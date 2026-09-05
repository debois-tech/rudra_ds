import { createSupabaseAdmin } from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/admin-auth-guard'
import { NextResponse, type NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

// One-time bulk import of legacy vehicle-service data (service_data.xlsx style
// sheets: Customer, Mobile No, Service, sub Category, Vehicle Type, Vehicel No,
// Issued Date, Expiry Date, Service Cost, Status, Entry Date).
//
// Customers are inserted one at a time (not batched) because
// generate_registration_id() (supabase/schema.sql) reads MAX(c_registration_id)
// per-row in a BEFORE INSERT trigger — a multi-row INSERT would let sibling
// rows in the same statement race on that MAX() and collide on the
// UNIQUE(org_id, c_registration_id) constraint. Vehicles and service rows have
// no such trigger, so those are safe to batch.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BATCH_SIZE = 500

type XlsxRow = Record<string, unknown>

function toIsoDate(value: unknown): string | null {
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value.toISOString().split('T')[0]
    }
    return null
}

function toIsoDateTime(value: unknown): string | undefined {
    if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString()
    if (typeof value === 'string' && value.trim()) {
        const d = new Date(value.trim().replace(' ', 'T'))
        if (!isNaN(d.getTime())) return d.toISOString()
    }
    return undefined
}

// PostgREST caps unlimited selects at 1000 rows by default — this org has
// thousands of customers/vehicles once partially imported, so a plain
// .select() silently truncates and makes already-existing rows look new
// (causing duplicate-key errors on re-import). Page through everything.
async function fetchAllRows<T>(
    query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
    const PAGE_SIZE = 1000
    const all: T[] = []
    let from = 0
    for (;;) {
        const { data, error } = await query(from, from + PAGE_SIZE - 1)
        if (error) throw new Error(error.message)
        if (!data || data.length === 0) break
        all.push(...data)
        if (data.length < PAGE_SIZE) break
        from += PAGE_SIZE
    }
    return all
}

export async function POST(request: NextRequest) {
    const authError = await requireSuperAdmin(request)
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get('file')
    const orgId = formData.get('org_id')

    if (!(file instanceof File) || typeof orgId !== 'string' || !UUID_RE.test(orgId)) {
        return NextResponse.json({ error: 'file and a valid org_id are required' }, { status: 400 })
    }

    const supabase = createSupabaseAdmin()

    const { data: org, error: orgErr } = await supabase.from('organizations').select('id').eq('id', orgId).single()
    if (orgErr || !org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    let workbook: XLSX.WorkBook
    try {
        const buffer = Buffer.from(await file.arrayBuffer())
        workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    } catch {
        return NextResponse.json({ error: 'Could not parse file as xlsx' }, { status: 400 })
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<XlsxRow>(sheet, { defval: null })

    // Vehicle-category service types visible to this org (global + org-specific).
    const { data: serviceTypes, error: stErr } = await supabase
        .from('service_types')
        .select('st_id, name')
        .eq('category', 'vehicle')
        .or(`org_id.is.null,org_id.eq.${orgId}`)
    if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 })

    const serviceTypeByName = new Map<string, number>()
    for (const st of serviceTypes || []) serviceTypeByName.set(st.name.trim().toLowerCase(), st.st_id)

    const customerIdByMobile = new Map<string, string>()
    const vehicleIdByNumber = new Map<string, string>()
    try {
        const existingCustomers = await fetchAllRows<{ c_id: string; c_mobile: string }>((from, to) =>
            supabase.from('customers').select('c_id, c_mobile').eq('org_id', orgId).range(from, to)
        )
        for (const c of existingCustomers) customerIdByMobile.set((c.c_mobile || '').trim(), c.c_id)

        const existingVehicles = await fetchAllRows<{ v_id: string; v_number: string }>((from, to) =>
            supabase.from('vehicles').select('v_id, v_number').eq('org_id', orgId).range(from, to)
        )
        for (const v of existingVehicles) vehicleIdByNumber.set(v.v_number.trim().toUpperCase(), v.v_id)
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load existing customers/vehicles'
        return NextResponse.json({ error: message }, { status: 500 })
    }

    type Staged = {
        rowNum: number
        mobile: string
        customerName: string
        vNumber: string
        vType: string
        st_id: number
        issue_date: string
        expiry_date: string | null
        total_cost: number
        status: 'active' | 'expired'
        created_at?: string
    }

    const skipped: { row: number; reason: string }[] = []
    const staged: Staged[] = []

    rows.forEach((r, idx) => {
        const rowNum = idx + 2 // account for header row, 1-indexed
        const serviceRaw = String(r['Service'] ?? '').trim()
        const st_id = serviceTypeByName.get(serviceRaw.toLowerCase())
        if (!st_id) {
            skipped.push({ row: rowNum, reason: `Unrecognized service type "${serviceRaw}"` })
            return
        }

        const statusRaw = String(r['Status'] ?? '').trim().toLowerCase()
        const status = statusRaw === 'expired' ? 'expired' : statusRaw === 'active' ? 'active' : null
        if (!status) {
            skipped.push({ row: rowNum, reason: `Unrecognized status "${r['Status']}"` })
            return
        }

        const issue_date = toIsoDate(r['Issued Date'])
        if (!issue_date) {
            skipped.push({ row: rowNum, reason: 'Missing/invalid Issued Date' })
            return
        }
        const expiry_date = toIsoDate(r['Expiry Date'])

        const mobile = String(r['Mobile No'] ?? '').trim()
        const customerName = String(r['Customer'] ?? '').trim()
        if (!mobile || !customerName) {
            skipped.push({ row: rowNum, reason: 'Missing Customer name or Mobile No' })
            return
        }

        const vNumber = String(r['Vehicel No'] ?? '').trim().toUpperCase()
        const vType = String(r['Vehicle Type'] ?? '').trim()
        const total_cost = Number(r['Service Cost']) || 0

        staged.push({
            rowNum, mobile, customerName, vNumber, vType, st_id,
            issue_date, expiry_date, total_cost, status,
            created_at: toIsoDateTime(r['Entry Date']),
        })
    })

    // New customers: first-seen name per new mobile, inserted one at a time.
    const nameForNewMobile = new Map<string, string>()
    for (const row of staged) {
        if (!customerIdByMobile.has(row.mobile) && !nameForNewMobile.has(row.mobile)) {
            nameForNewMobile.set(row.mobile, row.customerName)
        }
    }

    let customersCreated = 0
    for (const [mobile, name] of nameForNewMobile) {
        const { data, error } = await supabase
            .from('customers')
            .insert([{ c_name: name, c_mobile: mobile, org_id: orgId }])
            .select('c_id')
            .single()
        if (error || !data) {
            skipped.push({ row: -1, reason: `Failed to create customer for mobile ${mobile}: ${error?.message}` })
            continue
        }
        customerIdByMobile.set(mobile, data.c_id)
        customersCreated++
    }

    // New vehicles: batched (no per-row trigger on this table).
    const newVehicles = new Map<string, { v_type: string; owner_id: string }>()
    for (const row of staged) {
        if (!row.vNumber || vehicleIdByNumber.has(row.vNumber) || newVehicles.has(row.vNumber)) continue
        const owner_id = customerIdByMobile.get(row.mobile)
        if (owner_id) newVehicles.set(row.vNumber, { v_type: row.vType || 'car', owner_id })
    }
    const vehicleInserts = [...newVehicles.entries()].map(([v_number, v]) => ({
        v_number, v_type: v.v_type, owner_id: v.owner_id, org_id: orgId,
    }))

    let vehiclesCreated = 0
    for (let i = 0; i < vehicleInserts.length; i += BATCH_SIZE) {
        const chunk = vehicleInserts.slice(i, i + BATCH_SIZE)
        const { data, error } = await supabase.from('vehicles').insert(chunk).select('v_id, v_number')
        if (error) {
            skipped.push({ row: -1, reason: `Vehicle batch ${i}-${i + chunk.length} failed: ${error.message}` })
            continue
        }
        for (const v of data || []) {
            vehicleIdByNumber.set(v.v_number.toUpperCase(), v.v_id)
            vehiclesCreated++
        }
    }

    // Service rows: batched.
    const serviceInserts = staged.flatMap((row) => {
        const customer_id = customerIdByMobile.get(row.mobile)
        if (!customer_id) {
            skipped.push({ row: row.rowNum, reason: `No customer resolved for mobile ${row.mobile}` })
            return []
        }
        return [{
            customer_id,
            service_type_id: row.st_id,
            vehicle_id: row.vNumber ? vehicleIdByNumber.get(row.vNumber) ?? null : null,
            vehicle_type: row.vType || null,
            vehicle_number: row.vNumber || null,
            issue_date: row.issue_date,
            expiry_date: row.expiry_date,
            total_cost: row.total_cost,
            status: row.status,
            org_id: orgId,
            ...(row.created_at ? { created_at: row.created_at, updated_at: row.created_at } : {}),
        }]
    })

    let servicesCreated = 0
    for (let i = 0; i < serviceInserts.length; i += BATCH_SIZE) {
        const chunk = serviceInserts.slice(i, i + BATCH_SIZE)
        const { error } = await supabase.from('vehicle_services').insert(chunk)
        if (error) {
            skipped.push({ row: -1, reason: `Service batch ${i}-${i + chunk.length} failed: ${error.message}` })
            continue
        }
        servicesCreated += chunk.length
    }

    return NextResponse.json({
        totalRows: rows.length,
        customersCreated,
        vehiclesCreated,
        servicesCreated,
        skippedCount: skipped.length,
        skipped: skipped.slice(0, 200), // cap payload size
    })
}
