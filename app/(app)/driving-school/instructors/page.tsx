'use client'

import { useState } from 'react'
import { Plus, Search, UserCircle, Phone, IdCard, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const mockInstructors = [
    { id: '1', name: 'Rajesh Kumar', phone: '9876543210', licence_no: 'MH12 20230012345', is_active: true },
    { id: '2', name: 'Suresh Patel', phone: '9876543211', licence_no: 'MH12 20230012346', is_active: true },
    { id: '3', name: 'Amit Singh', phone: '9876543212', licence_no: 'MH12 20230012347', is_active: false },
    { id: '4', name: 'Vijay Sharma', phone: '9876543213', licence_no: 'MH12 20230012348', is_active: true },
    { id: '5', name: 'Ravi Verma', phone: '9876543214', licence_no: 'MH12 20230012349', is_active: true },
]

export default function InstructorsPage() {
    const [search, setSearch] = useState('')
    const filtered = mockInstructors.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.phone.includes(search) ||
        i.licence_no.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Instructors</h1>
                    <p className="text-[14px] text-slate-400 mt-1">Manage driving school teaching staff</p>
                </div>
                <Button className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm cursor-pointer">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Instructor
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search instructors..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 h-9 text-sm"
                />
            </div>

            <div className="grid gap-3">
                {filtered.map((instructor) => (
                    <Card key={instructor.id} className="bg-white border-slate-100 hover:border-slate-200 transition-colors">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                                        {instructor.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-semibold text-slate-900">{instructor.name}</p>
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${instructor.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                {instructor.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-0.5">
                                            <span className="text-[12px] text-slate-400 flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {instructor.phone}
                                            </span>
                                            <span className="text-[12px] text-slate-400 flex items-center gap-1">
                                                <IdCard className="h-3 w-3" /> {instructor.licence_no}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-600">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <UserCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No instructors found</p>
                </div>
            )}
        </div>
    )
}
