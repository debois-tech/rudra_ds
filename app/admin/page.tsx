'use client'

import { useEffect, useState } from 'react'
import { adminStatsApi } from '@/lib/admin-api'
import { Building2, Users, Wrench, Activity, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PlatformStats {
    totalOrgs: number
    activeOrgs: number
    totalUsers: number
    totalCustomers: number
    totalServices: number
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStats() {
            try {
                const data = await adminStatsApi.getPlatformStats()
                setStats(data)
            } catch (error) {
                console.error('Failed to load platform stats:', error)
            }
            setLoading(false)
        }
        loadStats()
    }, [])

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Platform Overview</h1>
                <p className="text-slate-400 mt-1">Monitor all driving schools on the platform</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    label="Total Organizations"
                    value={loading ? '-' : stats?.totalOrgs ?? 0}
                    icon={Building2}
                    color="amber"
                />
                <StatCard
                    label="Active Organizations"
                    value={loading ? '-' : stats?.activeOrgs ?? 0}
                    icon={Activity}
                    color="blue"
                />
                <StatCard
                    label="Total Users"
                    value={loading ? '-' : stats?.totalUsers ?? 0}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    label="Total Customers"
                    value={loading ? '-' : stats?.totalCustomers ?? 0}
                    icon={TrendingUp}
                    color="purple"
                />
                <StatCard
                    label="Total Services"
                    value={loading ? '-' : stats?.totalServices ?? 0}
                    icon={Wrench}
                    color="emerald"
                />
            </div>
        </div>
    )
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string
    value: number | string
    icon: React.ComponentType<{ className?: string }>
    color: string
}) {
    const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
        amber: { bg: 'bg-amber-950/30', text: 'text-amber-400', iconBg: 'bg-amber-500/20' },
        emerald: { bg: 'bg-emerald-950/30', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20' },
        blue: { bg: 'bg-blue-950/30', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
        purple: { bg: 'bg-purple-950/30', text: 'text-purple-400', iconBg: 'bg-purple-500/20' },
        slate: { bg: 'bg-slate-800/50', text: 'text-slate-300', iconBg: 'bg-slate-700/50' },
    }

    const c = colorMap[color] || colorMap.slate

    return (
        <Card className={`${c.bg} border-slate-700/50`}>
            <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${c.iconBg}`}>
                        <Icon className={`h-5 w-5 ${c.text}`} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
