'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { adminOrgApi, adminUserApi } from '@/lib/admin-api'
import type { Organization, Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Building2, UserPlus, Trash2, Power, Loader2, Users, Car, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function OrgDetailPage() {
    const params = useParams()
    const orgId = params.id as string

    const [org, setOrg] = useState<Organization | null>(null)
    const [orgUsers, setOrgUsers] = useState<Profile[]>([])
    const [stats, setStats] = useState({ customerCount: 0, vehicleCount: 0, documentCount: 0 })
    const [loading, setLoading] = useState(true)

    // Add user form
    const [showAddUser, setShowAddUser] = useState(false)
    const [newUserName, setNewUserName] = useState('')
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserPassword, setNewUserPassword] = useState('')
    const [addingUser, setAddingUser] = useState(false)

    const loadData = async () => {
        try {
            const result = await adminOrgApi.getById(orgId)
            setOrg(result.organization)
            setOrgUsers(result.users)
            setStats(result.stats)
        } catch (error) {
            console.error('Failed to load org:', error)
            toast.error('Failed to load organization')
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [orgId])

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setAddingUser(true)
        try {
            await adminUserApi.createUser({
                email: newUserEmail,
                password: newUserPassword,
                full_name: newUserName,
                org_id: orgId,
                role: 'user',
            })
            toast.success(`User ${newUserEmail} created`)
            setShowAddUser(false)
            setNewUserName('')
            setNewUserEmail('')
            setNewUserPassword('')
            loadData()
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to create user'
            toast.error(msg)
        }
        setAddingUser(false)
    }

    const handleDeleteUser = async (userId: string, email: string | null) => {
        if (!confirm(`Delete user ${email}? This cannot be undone.`)) return
        try {
            await adminUserApi.deleteUser(userId)
            toast.success('User deleted')
            loadData()
        } catch {
            toast.error('Failed to delete user')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            </div>
        )
    }

    if (!org) {
        return <div className="text-center text-slate-400 py-20">Organization not found</div>
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/organizations">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">{org.name}</h1>
                    <p className="text-slate-400 text-sm">{org.slug} • {org.is_active ? '🟢 Active' : '🔴 Inactive'}</p>
                </div>
            </div>

            {/* Org Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="pt-5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Users className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Customers</p>
                            <p className="text-xl font-bold text-white">{stats.customerCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="pt-5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Car className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Vehicles</p>
                            <p className="text-xl font-bold text-white">{stats.vehicleCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="pt-5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                            <FileText className="h-5 w-5 text-slate-300" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Documents</p>
                            <p className="text-xl font-bold text-white">{stats.documentCount}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Org Info */}
            <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-amber-400" />
                        Organization Info
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-400">Phone</p>
                            <p className="text-white">{org.phone || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-slate-400">Email</p>
                            <p className="text-white">{org.email || 'Not set'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-slate-400">Address</p>
                            <p className="text-white">{org.address || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-slate-400">Created</p>
                            <p className="text-white">{new Date(org.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Users */}
            <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-amber-400" />
                        Users ({orgUsers.length})
                    </CardTitle>
                    <Button
                        size="sm"
                        onClick={() => setShowAddUser(!showAddUser)}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        <UserPlus className="h-4 w-4 mr-1" /> Add User
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Add User Form */}
                    {showAddUser && (
                        <form onSubmit={handleAddUser} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-slate-400 text-xs">Name</Label>
                                    <Input
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        placeholder="Full Name"
                                        required
                                        className="bg-slate-800 border-slate-600 text-white h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-slate-400 text-xs">Email</Label>
                                    <Input
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        placeholder="user@email.com"
                                        type="email"
                                        required
                                        className="bg-slate-800 border-slate-600 text-white h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-slate-400 text-xs">Password</Label>
                                    <Input
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        placeholder="Min 6 chars"
                                        type="password"
                                        required
                                        minLength={6}
                                        className="bg-slate-800 border-slate-600 text-white h-9 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={addingUser} className="bg-amber-600 hover:bg-amber-700">
                                    {addingUser ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                    Create User
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddUser(false)} className="text-slate-400">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* User List */}
                    {orgUsers.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">No users in this organization</p>
                    ) : (
                        <div className="space-y-2">
                            {orgUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-semibold">
                                            {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-medium">{user.full_name || 'Unnamed'}</p>
                                            <p className="text-xs text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs ${user.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteUser(user.id, user.email)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 p-1 h-7 w-7"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
