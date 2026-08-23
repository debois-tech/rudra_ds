'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Plus, Search, UserCircle, Phone, IdCard, MoreVertical, Pencil, Power, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { instructorApi } from '@/lib/ds-api'
import type { DsInstructor } from '@/lib/types'
import { toast } from 'sonner'

export default function InstructorsPage() {
    const [instructors, setInstructors] = useState<DsInstructor[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const [sheetOpen, setSheetOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<DsInstructor | null>(null)
    const [formName, setFormName] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formLicence, setFormLicence] = useState('')
    const [saving, setSaving] = useState(false)

    const [menuOpen, setMenuOpen] = useState<string | null>(null)
    const [pendingId, setPendingId] = useState<string | null>(null)

    const menuRef = useRef<HTMLDivElement>(null)

    const fetchList = useCallback(() => {
        instructorApi.getAll()
            .then(data => { setInstructors(data); setLoading(false) })
            .catch(() => toast.error('Failed to load instructors'))
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
        setFormName('')
        setFormPhone('')
        setFormLicence('')
        setSheetOpen(true)
    }

    const openEdit = (i: DsInstructor) => {
        setEditTarget(i)
        setFormName(i.name)
        setFormPhone(i.phone)
        setFormLicence(i.licence_no || '')
        setSheetOpen(true)
        setMenuOpen(null)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (editTarget) {
                await instructorApi.update(editTarget.id, { name: formName, phone: formPhone, licence_no: formLicence || undefined })
                toast.success('Instructor updated')
            } else {
                await instructorApi.create({ name: formName, phone: formPhone, licence_no: formLicence || undefined })
                toast.success('Instructor added')
            }
            setSheetOpen(false)
            fetchList()
        } catch { toast.error('Failed to save instructor') }
        finally { setSaving(false) }
    }

    const toggleActive = async (i: DsInstructor) => {
        if (pendingId) return
        setPendingId(i.id)
        try {
            await instructorApi.update(i.id, { name: i.name, phone: i.phone, licence_no: i.licence_no || undefined, is_active: !i.is_active })
            toast.success(`Instructor ${i.is_active ? 'deactivated' : 'activated'}`)
            fetchList()
        } catch { toast.error('Failed to update status') }
        setPendingId(null)
        setMenuOpen(null)
    }

    const handleDelete = async (id: string) => {
        if (pendingId) return
        if (!confirm('Delete this instructor? This cannot be undone.')) return
        setPendingId(id)
        try {
            await instructorApi.delete(id)
            toast.success('Instructor deleted')
            fetchList()
        } catch { toast.error('Failed to delete instructor') }
        setPendingId(null)
        setMenuOpen(null)
    }

    const filtered = instructors.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.phone.includes(search) ||
        (i.licence_no || '').toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Instructors</h1>
                    <p className="text-[14px] text-slate-400 mt-1">Manage driving school teaching staff</p>
                </div>
                <Button onClick={openAdd} className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm cursor-pointer">
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
                                            {instructor.licence_no && (
                                                <span className="text-[12px] text-slate-400 flex items-center gap-1">
                                                    <IdCard className="h-3 w-3" /> {instructor.licence_no}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative" ref={menuOpen === instructor.id ? menuRef : undefined}>
                                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-600 cursor-pointer"
                                        onClick={() => setMenuOpen(menuOpen === instructor.id ? null : instructor.id)}>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                    {menuOpen === instructor.id && (
                                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-slate-200 shadow-lg z-10 py-1">
                                            <button onClick={() => openEdit(instructor)} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 cursor-pointer">
                                                <Pencil className="h-3.5 w-3.5" /> Edit
                                            </button>
                                            <button onClick={() => toggleActive(instructor)} disabled={pendingId === instructor.id} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
                                                <Power className="h-3.5 w-3.5" /> {instructor.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => handleDelete(instructor.id)} disabled={pendingId === instructor.id} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
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
                    <UserCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No instructors found</p>
                </div>
            )}

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>{editTarget ? 'Edit Instructor' : 'Add Instructor'}</SheetTitle>
                        <SheetDescription>{editTarget ? 'Update instructor details' : 'Add a new driving instructor'}</SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="flex flex-col gap-4 p-4">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-slate-700">Name *</label>
                            <Input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="Instructor name" className="rounded-xl border-slate-200 h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-slate-700">Phone *</label>
                            <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} required placeholder="Phone number" className="rounded-xl border-slate-200 h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-slate-700">Licence Number</label>
                            <Input value={formLicence} onChange={e => setFormLicence(e.target.value)} placeholder="Driving licence number" className="rounded-xl border-slate-200 h-9 text-sm" />
                        </div>
                        <SheetFooter className="pt-2">
                            <SheetClose asChild>
                                <Button type="button" variant="outline" className="rounded-xl h-9 px-4 text-[13px] border-slate-200 cursor-pointer">Cancel</Button>
                            </SheetClose>
                            <Button type="submit" disabled={saving} className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black cursor-pointer disabled:opacity-50">
                                {saving ? 'Saving...' : editTarget ? 'Update' : 'Add Instructor'}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
}
