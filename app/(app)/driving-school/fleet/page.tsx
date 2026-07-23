'use client'

import { useState } from 'react'
import { Plus, Search, Car, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const mockVehicles = [
    { id: '1', v_number: 'MH12 AB 1234', v_name: 'Maruti Swift Dzire', v_type: 'car', status: 'available' as const },
    { id: '2', v_number: 'MH12 CD 5678', v_name: 'Hyundai i10', v_type: 'car', status: 'in-use' as const },
    { id: '3', v_number: 'MH12 EF 9012', v_name: 'Maruti Baleno', v_type: 'car', status: 'available' as const },
    { id: '4', v_number: 'MH12 GH 3456', v_name: 'Honda Activa', v_type: 'bike', status: 'maintenance' as const },
    { id: '5', v_number: 'MH12 IJ 7890', v_name: 'Tata Tiago', v_type: 'car', status: 'available' as const },
]

const statusStyles = {
    available: { label: 'Available', bg: 'bg-emerald-50 text-emerald-600' },
    'in-use': { label: 'In Use', bg: 'bg-amber-50 text-amber-600' },
    maintenance: { label: 'Maintenance', bg: 'bg-red-50 text-red-500' },
}

export default function FleetPage() {
    const [search, setSearch] = useState('')
    const filtered = mockVehicles.filter(v =>
        v.v_number.toLowerCase().includes(search.toLowerCase()) ||
        v.v_name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet Vehicles</h1>
                    <p className="text-[14px] text-slate-400 mt-1">Manage your school-owned training vehicles</p>
                </div>
                <Button className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm cursor-pointer">
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
                {filtered.map((vehicle) => {
                    const style = statusStyles[vehicle.status]
                    return (
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
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${style.bg}`}>
                                                    {style.label}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-slate-400 mt-0.5">
                                                {vehicle.v_name} &middot; {vehicle.v_type}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-600">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <Car className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No vehicles found</p>
                </div>
            )}
        </div>
    )
}
