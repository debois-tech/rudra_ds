'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Plus, Search, Car, MoreVertical, Pencil, Power, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { fleetVehicleApi } from '@/lib/ds-api'
import type { DsFleetVehicle } from '@/lib/types'
import { toast } from 'sonner'

const vehicleTypes = ['car', 'bike', 'truck', 'other']

export default function FleetPage() {
    const [vehicles, setVehicles] = useState<DsFleetVehicle[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const [sheetOpen, setSheetOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<DsFleetVehicle | null>(null)
    const [formNumber, setFormNumber] = useState('')
    const [formName, setFormName] = useState('')
    const [formType, setFormType] = useState('car')
    const [saving, setSaving] = useState(false)

    const [menuOpen, setMenuOpen] = useState<string | null>(null)

    const menuRef = useRef<HTMLDivElement>(null)

    const fetchList = useCallback(() => {
        fleetVehicleApi.getAll()
            .then(data => { setVehicles(data); setLoading(false) })
            .catch(() => toast.error('Failed to load fleet vehicles'))
    }, [])

    useEffect(() => { fetchList() }, [fetchList])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(null)
            }
        }
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpen])

    const openAdd = () => {
        setEditTarget(null)
        setFormNumber('')
        setFormName('')
        setFormType('car')
        setSheetOpen(true)
    }

    const openEdit = (v: DsFleetVehicle) => {
        setEditTarget(v)
        setFormNumber(v.v_number)
        setFormName(v.v_name || '')
        setFormType(v.v_type)
        setSheetOpen(true)
        setMenuOpen(null)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (editTarget) {
                await fleetVehicleApi.update(editTarget.id, { v_number: formNumber, v_name: formName || undefined, v_type: formType })
                toast.success('Vehicle updated')
            } else {
                await fleetVehicleApi.create({ v_number: formNumber, v_name: formName || undefined, v_type: formType })
                toast.success('Vehicle added')
            }
            setSheetOpen(false)
            fetchList()
        } catch { toast.error('Failed to save vehicle') }
        finally { setSaving(false) }
    }

    const toggleActive = async (v: DsFleetVehicle) => {
        try {
            await fleetVehicleApi.update(v.id, { v_number: v.v_number, v_name: v.v_name || undefined, v_type: v.v_type, is_active: !v.is_active })
            toast.success(`Vehicle ${v.is_active ? 'deactivated' : 'activated'}`)
            fetchList()
        } catch { toast.error('Failed to update vehicle status') }
        setMenuOpen(null)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this vehicle? This cannot be undone.')) return
        try {
            await fleetVehicleApi.delete(id)
            toast.success('Vehicle deleted')
            fetchList()
        } catch { toast.error('Failed to delete vehicle') }
        setMenuOpen(null)
    }

    const filtered = vehicles.filter(v =>
        v.v_number.toLowerCase().includes(search.toLowerCase()) ||
        (v.v_name || '').toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet Vehicles</h1>
                    <p className="text-[14px] text-slate-400 mt-1">Manage your school-owned training vehicles</p>
                </div>
                <Button onClick={openAdd} className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm cursor-pointer">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Vehicle
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search vehicles..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 h-9 text-sm"
                />
            </div>

            <div className="grid gap-3">
                {filtered.map((vehicle) => (
                    <Card key={vehicle.id} className="bg-white border-slate-100 hover:border-slate-200 transition-colors">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                        <Car className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-semibold text-slate-900">{vehicle.v_number}</p>
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${vehicle.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                {vehicle.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-slate-400 mt-0.5">
                                            {vehicle.v_name || '—'} &middot; {vehicle.v_type}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative" ref={menuOpen === vehicle.id ? menuRef : undefined}>
                                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-600 cursor-pointer"
                                        onClick={() => setMenuOpen(menuOpen === vehicle.id ? null : vehicle.id)}>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                    {menuOpen === vehicle.id && (
                                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-slate-200 shadow-lg z-10 py-1">
                                            <button onClick={() => openEdit(vehicle)} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 cursor-pointer">
                                                <Pencil className="h-3.5 w-3.5" /> Edit
                                            </button>
                                            <button onClick={() => toggleActive(vehicle)} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 cursor-pointer">
                                                <Power className="h-3.5 w-3.5" /> {vehicle.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => handleDelete(vehicle.id)} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 cursor-pointer">
                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <Car className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No vehicles found</p>
                </div>
            )}

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>{editTarget ? 'Edit Vehicle' : 'Add Vehicle'}</SheetTitle>
                        <SheetDescription>{editTarget ? 'Update fleet vehicle details' : 'Add a new fleet vehicle'}</SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="flex flex-col gap-4 p-4">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-slate-700">Vehicle Number *</label>
                            <Input value={formNumber} onChange={e => setFormNumber(e.target.value)} required placeholder="e.g. MH12 AB 1234" className="rounded-xl border-slate-200 h-9 text-sm uppercase" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-slate-700">Name / Model</label>
                            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Maruti Swift Dzire" className="rounded-xl border-slate-200 h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-slate-700">Type *</label>
                            <select value={formType} onChange={e => setFormType(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 h-9 px-3 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20">
                                {vehicleTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>
                        <SheetFooter className="pt-2">
                            <SheetClose asChild>
                                <Button type="button" variant="outline" className="rounded-xl h-9 px-4 text-[13px] border-slate-200 cursor-pointer">Cancel</Button>
                            </SheetClose>
                            <Button type="submit" disabled={saving} className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black cursor-pointer disabled:opacity-50">
                                {saving ? 'Saving...' : editTarget ? 'Update' : 'Add Vehicle'}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
}
