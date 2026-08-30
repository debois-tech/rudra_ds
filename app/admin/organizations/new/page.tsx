'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminOrgApi, adminUserApi } from '@/lib/admin-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Building2, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NewOrganizationPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Org fields
    const [orgName, setOrgName] = useState('')
    const [orgSlug, setOrgSlug] = useState('')
    const [orgPhone, setOrgPhone] = useState('')
    const [orgEmail, setOrgEmail] = useState('')
    const [orgAddress, setOrgAddress] = useState('')

    // First user fields
    const [userName, setUserName] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [userPassword, setUserPassword] = useState('')

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        setOrgName(name)
        setOrgSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Step 1: Create organization
            const org = await adminOrgApi.create({
                name: orgName,
                slug: orgSlug,
                phone: orgPhone,
                email: orgEmail,
                address: orgAddress,
            })

            // Step 2: Create the first user for this org
            await adminUserApi.createUser({
                email: userEmail,
                password: userPassword,
                full_name: userName,
                org_id: org.id,
                role: 'user',
            })

            toast.success(`Organization "${orgName}" created with user ${userEmail}`)
            router.push('/admin/organizations')
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to create organization'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/organizations">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">New Organization</h1>
                    <p className="text-slate-400 text-sm">Create a new driving school + its first admin user</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Organization Details */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-amber-400" />
                            Organization Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Name *</Label>
                                <Input
                                    value={orgName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="MotoAdmin"
                                    required
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Slug *</Label>
                                <Input
                                    value={orgSlug}
                                    onChange={(e) => setOrgSlug(e.target.value)}
                                    placeholder="moto-admin"
                                    required
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Phone</Label>
                                <Input
                                    value={orgPhone}
                                    onChange={(e) => setOrgPhone(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Email</Label>
                                <Input
                                    value={orgEmail}
                                    onChange={(e) => setOrgEmail(e.target.value)}
                                    placeholder="admin@school.com"
                                    type="email"
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Address</Label>
                            <Input
                                value={orgAddress}
                                onChange={(e) => setOrgAddress(e.target.value)}
                                placeholder="123 Main Road, City"
                                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* First User */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-amber-400" />
                            First User (Owner/Admin)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Full Name *</Label>
                            <Input
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="John Doe"
                                required
                                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Email *</Label>
                                <Input
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    placeholder="user@school.com"
                                    type="email"
                                    required
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Password *</Label>
                                <Input
                                    value={userPassword}
                                    onChange={(e) => setUserPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    type="password"
                                    required
                                    minLength={6}
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-medium"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Building2 className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Creating...' : 'Create Organization & User'}
                </Button>
            </form>
        </div>
    )
}
