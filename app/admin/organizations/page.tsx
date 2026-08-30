'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminOrgApi } from '@/lib/admin-api'
import type { Organization } from '@/lib/types'
import { Plus, Building2, MoreVertical, Power, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function OrganizationsPage() {
    const [orgs, setOrgs] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOrgs = async () => {
        try {
            const data = await adminOrgApi.getAll()
            setOrgs(data)
        } catch (error) {
            console.error('Failed to load organizations:', error)
            toast.error('Failed to load organizations')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchOrgs()
    }, [])

    const handleToggleActive = async (org: Organization) => {
        try {
            await adminOrgApi.toggleActive(org.id, !org.is_active)
            toast.success(`${org.name} ${org.is_active ? 'deactivated' : 'activated'}`)
            fetchOrgs()
        } catch {
            toast.error('Failed to update organization')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
                    <p className="text-slate-400 mt-1">Manage driving schools on the platform</p>
                </div>
                <Link href="/admin/organizations/new">
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Add Organization
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-12">Loading organizations...</div>
            ) : orgs.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="py-12 text-center">
                        <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 mb-4">No organizations yet</p>
                        <Link href="/admin/organizations/new">
                            <Button className="bg-amber-600 hover:bg-amber-700">Create First Organization</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {orgs.map((org) => (
                        <Card key={org.id} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
                            <CardContent className="py-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold ${org.is_active
                                                ? 'bg-amber-500/20 text-amber-400'
                                                : 'bg-slate-700/50 text-slate-500'
                                            }`}>
                                            {org.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-white">{org.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${org.is_active
                                                        ? 'bg-blue-500/20 text-emerald-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {org.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400">
                                                {org.slug} {org.phone ? `• ${org.phone}` : ''} {org.email ? `• ${org.email}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/admin/organizations/${org.id}`}>
                                            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
                                                <Users className="h-4 w-4 mr-1" /> Manage
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleActive(org)}
                                            className={org.is_active
                                                ? 'text-red-400 hover:text-red-300 hover:bg-red-950/30'
                                                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                                            }
                                        >
                                            <Power className="h-4 w-4 mr-1" />
                                            {org.is_active ? 'Deactivate' : 'Activate'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
