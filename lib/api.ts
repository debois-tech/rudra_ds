// Centralized API functions for MotoAdmin Service Platform (Multi-Tenant)
// RLS handles tenant scoping automatically on SELECT/UPDATE/DELETE.
// For INSERT, we must include org_id in the payload.

import { differenceInCalendarDays } from 'date-fns';
import { createSupabaseBrowser } from './supabase';
import { getCurrentProfile, getOrgId } from './auth';
import type {
    Customer,
    CustomerFormData,
    CustomerDashboardView,
    Vehicle,
    VehicleWithOwner,
    VehicleFormData,
    InlineVehicleData,
    ServiceType,
    Service,
    ServiceCategory,
    ServiceStatus,
    ServiceOverview,
    VehicleServiceFormData,
    LicenceServiceFormData,
    DashboardStats,
    ExpiringDocument,
    ServiceBreakdown,
    MonthlyRevenue,
    StatusBreakdown,
    VehicleClass,
    VehicleTypeLicence,
} from './types';

function getClient() {
    return createSupabaseBrowser();
}

// =============================================
// CUSTOMER OPERATIONS
// =============================================

export const customerApi = {
    async getAll(): Promise<CustomerDashboardView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Customer | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('c_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async getByIdWithStats(id: string): Promise<CustomerDashboardView | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .eq('c_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // Exact-match dedupe check — used before auto-creating a customer so a
    // reused mobile number snaps onto the existing record instead of
    // silently creating a duplicate.
    async findByMobile(mobile: string): Promise<CustomerDashboardView | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .eq('c_mobile', mobile)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    // Returns the created customer plus any per-vehicle failures (e.g. a plate
    // already registered to another customer) — a failed vehicle insert must
    // never be reported as "customer not added" since the customer row is
    // already committed by that point.
    async create(customer: CustomerFormData, vehicles?: InlineVehicleData[]): Promise<{ customer: Customer; vehicleErrors: string[] }> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const payload = {
            c_name: customer.c_name,
            c_mobile: customer.c_mobile,
            c_whatsapp: customer.c_whatsapp || null,
            c_email: customer.c_email || null,
            c_address: customer.c_address || null,
            c_dob: customer.c_dob || null,
            org_id: orgId,
        };
        const { data, error } = await supabase
            .from('customers')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;

        const vehicleErrors: string[] = [];
        for (const v of vehicles || []) {
            const { error: vError } = await supabase
                .from('vehicles')
                .insert([{
                    owner_id: data.c_id,
                    v_number: v.v_number.toUpperCase(),
                    v_name: v.v_name || null,
                    v_type: v.v_type || 'car',
                    org_id: orgId,
                }]);
            if (vError) {
                vehicleErrors.push(
                    vError.code === '23505'
                        ? `Vehicle ${v.v_number.toUpperCase()} is already registered to another customer — skipped.`
                        : `Vehicle ${v.v_number.toUpperCase()} could not be added.`
                );
            }
        }

        return { customer: data, vehicleErrors };
    },

    async update(id: string, customer: CustomerFormData): Promise<Customer> {
        const supabase = getClient();
        const payload = {
            c_name: customer.c_name,
            c_mobile: customer.c_mobile,
            c_whatsapp: customer.c_whatsapp || null,
            c_email: customer.c_email || null,
            c_address: customer.c_address || null,
            c_dob: customer.c_dob || null,
        };
        const { data, error } = await supabase
            .from('customers')
            .update(payload)
            .eq('c_id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('customers').delete().eq('c_id', id);
        if (error) throw error;
    },

    // Matches name/mobile/registration directly, plus vehicle plate via a
    // second query (v_customer_dashboard has no plate column). Top 5 total —
    // this backs the add-customer search-as-you-type dropdown, so callers
    // don't need to re-add customers that already exist.
    async search(query: string): Promise<CustomerDashboardView[]> {
        const supabase = getClient();
        const [direct, byPlate] = await Promise.all([
            supabase
                .from('v_customer_dashboard')
                .select('*')
                .or(`c_name.ilike.%${query}%,c_mobile.ilike.%${query}%,c_registration_id.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(5),
            supabase
                .from('vehicles')
                .select('owner_id')
                .ilike('v_number', `%${query}%`)
                .limit(5),
        ]);
        if (direct.error) throw direct.error;
        if (byPlate.error) throw byPlate.error;

        const directResults: CustomerDashboardView[] = direct.data || [];
        const plateOwnerIds: string[] = (byPlate.data || []).map((v: { owner_id: string }) => v.owner_id);
        const extraOwnerIds = [...new Set(plateOwnerIds)]
            .filter((id: string) => !directResults.some((c: CustomerDashboardView) => c.c_id === id));

        let plateResults: CustomerDashboardView[] = [];
        if (extraOwnerIds.length > 0) {
            const { data, error } = await supabase
                .from('v_customer_dashboard')
                .select('*')
                .in('c_id', extraOwnerIds);
            if (error) throw error;
            plateResults = data || [];
        }

        return [...directResults, ...plateResults].slice(0, 5);
    },
};

// =============================================
// VEHICLE OPERATIONS
// =============================================

export const vehicleApi = {
    async getByOwner(ownerId: string): Promise<Vehicle[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<VehicleWithOwner | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('vehicles')
            .select(`*, customers(c_name, c_mobile)`)
            .eq('v_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // Exact plate match — vehicles(org_id, v_number) is already unique in
    // the DB, so this is a same-tenant lookup, not a new constraint.
    async getByNumber(vNumber: string): Promise<VehicleWithOwner | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('vehicles')
            .select(`*, customers(c_name, c_mobile)`)
            .eq('v_number', vNumber.toUpperCase())
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async create(vehicle: VehicleFormData): Promise<Vehicle> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data, error } = await supabase
            .from('vehicles')
            .insert([{
                owner_id: vehicle.owner_id,
                v_number: vehicle.v_number.toUpperCase(),
                v_name: vehicle.v_name || null,
                v_type: vehicle.v_type || 'car',
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id: string, vehicle: VehicleFormData): Promise<Vehicle> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('vehicles')
            .update({
                owner_id: vehicle.owner_id,
                v_number: vehicle.v_number.toUpperCase(),
                v_name: vehicle.v_name || null,
                v_type: vehicle.v_type || 'car',
            })
            .eq('v_id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('vehicles').delete().eq('v_id', id);
        if (error) throw error;
    },
};

// =============================================
// SERVICE TYPE OPERATIONS
// =============================================

export const serviceTypeApi = {
    async getAll(): Promise<ServiceType[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('service_types')
            .select('*')
            .eq('is_active', true)
            .order('name');
        if (error) throw error;
        return data || [];
    },

    async getByCategory(category: 'vehicle' | 'licence'): Promise<ServiceType[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('service_types')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('name');
        if (error) throw error;
        return data || [];
    },
};

// =============================================
// SERVICE OPERATIONS
// =============================================

export const serviceApi = {
    async getAll(): Promise<ServiceOverview[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_services_overview')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getByCustomer(customerId: string): Promise<ServiceOverview[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_services_overview')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<ServiceOverview | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_services_overview')
            .select('*')
            .eq('s_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async createVehicleService(formData: VehicleServiceFormData): Promise<Service> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data, error } = await supabase
            .from('vehicle_services')
            .insert([{
                customer_id: formData.customer_id,
                service_type_id: formData.service_type_id,
                vehicle_id: formData.vehicle_id || null,
                vehicle_type: formData.vehicle_type,
                vehicle_number: formData.vehicle_number,
                issue_date: formData.issue_date,
                expiry_date: formData.expiry_date || null,
                total_cost: formData.total_cost,
                notes: formData.notes || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async createLicenceService(formData: LicenceServiceFormData): Promise<Service> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data, error } = await supabase
            .from('document_services')
            .insert([{
                customer_id: formData.customer_id,
                service_type_id: formData.service_type_id,
                vehicle_class: formData.vehicle_class,
                vehicle_type_licence: formData.vehicle_type_licence,
                mdl_number: formData.mdl_number || null,
                renewal_date: formData.renewal_date || null,
                issue_date: formData.issue_date,
                expiry_date: formData.expiry_date || null,
                total_cost: formData.total_cost,
                notes: formData.notes || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateStatus(id: string, status: ServiceStatus): Promise<Service> {
        const supabase = getClient();
        const { data: existing, error: lookupError } = await supabase.from('v_services_overview').select('category').eq('s_id', id).single();
        if (lookupError) throw lookupError;
        const { data, error } = await supabase.from(existing.category === 'vehicle' ? 'vehicle_services' : 'document_services').update({ status }).eq('s_id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { data: existing, error: lookupError } = await supabase.from('v_services_overview').select('category').eq('s_id', id).single();
        if (lookupError) throw lookupError;
        const { error } = await supabase.from(existing.category === 'vehicle' ? 'vehicle_services' : 'document_services').delete().eq('s_id', id);
        if (error) throw error;
    },
};

// =============================================
// DASHBOARD STATS
// =============================================

export const dashboardApi = {
    /**
     * Single RPC call returns all dashboard stats, charts, and breakdowns.
     * Replaces 7 separate queries — DB does all aggregation in one round-trip.
     */
    async getAllStats(): Promise<{
        stats: DashboardStats;
        serviceBreakdown: ServiceBreakdown[];
        statusBreakdown: StatusBreakdown[];
        revenueByMonth: MonthlyRevenue[];
    }> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data, error } = await supabase.rpc('get_dashboard_stats', { p_org_id: orgId });
        if (error) throw error;
        const result = data as {
            totalCustomers: number;
            totalVehicles: number;
            totalServices: number;
            totalRevenue: number;
            serviceBreakdown: Array<{ category: string; count: number }> | null;
            statusBreakdown: Array<{ status: string; count: number }> | null;
            revenueByMonth: Array<{ month: string; month_key: string; revenue: number }> | null;
        };
        return {
            stats: {
                totalCustomers: result.totalCustomers || 0,
                totalVehicles: result.totalVehicles || 0,
                totalServices: result.totalServices || 0,
                totalRevenue: result.totalRevenue || 0,
            },
            serviceBreakdown: result.serviceBreakdown || [],
            statusBreakdown: result.statusBreakdown || [],
            revenueByMonth: (result.revenueByMonth || []).map(r => ({ month: r.month, month_key: r.month_key, revenue: r.revenue })),
        };
    },

    async getRecentCustomers(limit: number = 5): Promise<CustomerDashboardView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    async getRecentServices(limit: number = 10): Promise<ServiceOverview[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_services_overview')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    /**
     * Get services with expiry dates within the next N days.
     * RLS scopes this to the logged-in user's org automatically.
     */
    /**
     * `filter` is either "next N days" (upcoming, still active) or 'expired'
     * (already past expiry, regardless of stored status — bulk-imported
     * historical rows often still say 'active' even though they've lapsed).
     */
    async getExpiringDocuments(filter: number | 'expired' = 30): Promise<ExpiringDocument[]> {
        const supabase = getClient();
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let query = supabase
            .from('v_services_overview')
            .select('s_id, customer_id, customer_name, service_name, category, expiry_date, vehicle_number, service_type_id, issue_date, total_cost, status, vehicle_id, vehicle_type, vehicle_class, vehicle_type_licence, mdl_number')
            .not('expiry_date', 'is', null);

        if (filter === 'expired') {
            // Not status = 'active' only — some bulk-imported rows never got
            // relabeled 'expired' even though the date has passed. But do
            // exclude 'completed'/'cancelled' — those are resolved (e.g. a
            // renewal already superseded them) and shouldn't linger here.
            query = query.lt('expiry_date', todayStr).in('status', ['active', 'expired']).order('expiry_date', { ascending: false });
        } else {
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + filter);
            const futureStr = futureDate.toISOString().split('T')[0];
            query = query.gte('expiry_date', todayStr).lte('expiry_date', futureStr).eq('status', 'active').order('expiry_date', { ascending: true });
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map((row: Omit<ExpiringDocument, 'days_remaining'>) => {
            const daysRemaining = differenceInCalendarDays(new Date(row.expiry_date), today);
            return { ...row, days_remaining: daysRemaining };
        });
    },
};

// =============================================
// RENEW — build a prefilled "New Service" link from any existing
// service-shaped row (ServiceOverview or ExpiringDocument both qualify).
// =============================================

export interface RenewableService {
    s_id: string;
    customer_id: string;
    category: ServiceCategory;
    service_type_id: number;
    issue_date: string;
    expiry_date: string | null;
    total_cost: number;
    status: ServiceStatus;
    vehicle_id?: string | null;
    vehicle_number?: string | null;
    vehicle_type?: string | null;
    vehicle_class?: VehicleClass | null;
    vehicle_type_licence?: VehicleTypeLicence | null;
    mdl_number?: string | null;
}

export function buildRenewUrl(s: RenewableService): string {
    const todayStr = new Date().toISOString().split('T')[0];
    let newExpiry = '';
    if (s.expiry_date) {
        const durationMs = Math.max(new Date(s.expiry_date).getTime() - new Date(s.issue_date).getTime(), 0);
        newExpiry = new Date(Date.now() + durationMs).toISOString().split('T')[0];
    }

    const params = new URLSearchParams({
        customer: s.customer_id,
        category: s.category,
        serviceTypeId: String(s.service_type_id),
        issueDate: todayStr,
        expiryDate: newExpiry,
        cost: String(s.total_cost),
        renewOf: s.s_id,
        oldStatus: s.status,
    });
    if (s.category === 'vehicle') {
        if (s.vehicle_id) params.set('vehicleId', s.vehicle_id);
        if (s.vehicle_number) params.set('vehicleNumber', s.vehicle_number);
        if (s.vehicle_type) params.set('vehicleType', s.vehicle_type);
    } else {
        if (s.vehicle_class) params.set('vehicleClass', s.vehicle_class);
        if (s.vehicle_type_licence) params.set('vehicleTypeLicence', s.vehicle_type_licence);
        if (s.mdl_number) params.set('mdlNumber', s.mdl_number);
    }
    return `/dashboard/services/new?${params.toString()}`;
}
