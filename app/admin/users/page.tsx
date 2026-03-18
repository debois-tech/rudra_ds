'use client'

import { useEffect, useState } from 'react'
import { adminUserApi } from '@/lib/admin-api'
import type { Profile } from '@/lib/types'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Trash2, Users, ShieldCheck, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface UserWithOrg extends Profile {
    org_name?: string
}

export default function AllUsersPage() {
    const [users, setUsers] = useState<UserWithOrg[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUsers = async () => {
        try {
            const data = await adminUserApi.getAll()
            setUsers(data)
        } catch (error) {
            console.error('Failed to load users:', error)
            toast.error('Failed to load users')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleDelete = async (userId: string, email: string | null) => {
        if (!confirm(`Delete user ${email}? This cannot be undone.`)) return
        try {
            await adminUserApi.deleteUser(userId)
            toast.success('User deleted')
            fetchUsers()
        } catch {
            toast.error('Failed to delete user')
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">All Users</h1>
                <p className="text-slate-400 mt-1">Manage all users across the platform</p>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-12">Loading users...</div>
            ) : users.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="py-12 text-center">
                        <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No users found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {users.map((user) => (
                        <Card key={user.id} className="bg-slate-800/50 border-slate-700/50">
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${user.role === 'super_admin'
                                                ? 'bg-amber-500/20 text-amber-400'
                                                : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium">{user.full_name || 'Unnamed'}</p>
                                                {user.role === 'super_admin' && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">
                                                        <ShieldCheck className="h-3 w-3" /> Super Admin
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 rounded text-xs ${user.is_active ? 'bg-blue-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                <span>{user.email}</span>
                                                {user.org_name && (
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" /> {user.org_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {user.role !== 'super_admin' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(user.id, user.email)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
