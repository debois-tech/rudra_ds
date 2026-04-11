'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import type { DashboardStats, CustomerDashboardView, ServiceOverview } from '@/lib/types';
import { Users, Car, Wrench, IndianRupee, TrendingUp, Plus, Activity, Clock, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, isToday, isYesterday } from 'date-fns';

type ActivityItem = {
  id: string;
  type: 'customer' | 'service';
  title: string;
  subtitle: string;
  date: Date;
  status?: string;
  url: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0, totalVehicles: 0, totalServices: 0, totalRevenue: 0,
  });
  const [activities, setActivities] = useState<{ label: string, items: ActivityItem[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, customersData, servicesData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentCustomers(10),
          dashboardApi.getRecentServices(10),
        ]);
        setStats(statsData);

        // Combine into Activity Feed
        const allActivity: ActivityItem[] = [
          ...customersData.map((c: CustomerDashboardView) => ({
            id: `c_${c.c_id}`,
            type: 'customer' as const,
            title: c.c_name,
            subtitle: c.c_email || c.c_mobile,
            date: new Date(c.created_at),
            url: `/dashboard/customers/${c.c_id}`,
          })),
          ...servicesData.map((s: ServiceOverview) => ({
            id: `s_${s.s_id}`,
            type: 'service' as const,
            title: s.service_name,
            subtitle: `${s.customer_name} ${s.vehicle_number ? `· ${s.vehicle_number}` : ''}`,
            date: new Date(s.created_at),
            status: s.status,
            url: `/dashboard/services`, // Assuming we don't have individual service pages yet
          }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        // Group by Date
        const grouped: { [key: string]: ActivityItem[] } = {};
        allActivity.forEach(item => {
          let label = format(item.date, 'MMM d, yyyy');
          if (isToday(item.date)) label = 'Today';
          else if (isYesterday(item.date)) label = 'Yesterday';

          if (!grouped[label]) grouped[label] = [];
          grouped[label].push(item);
        });

        const activityGroups = Object.keys(grouped).map(key => ({
          label: key,
          items: grouped[key]
        }));

        setActivities(activityGroups);

      } catch (error) {
        console.error('Dashboard error:', error);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here&apos;s an overview of your business.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/customers/new">
            <Button variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl h-10 px-5 font-medium shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> New Customer
            </Button>
          </Link>
          <Link href="/dashboard/services/new" className="pointer-events-none">
            {/* The actual link goes to services/page or we just open a dialog. The original code linked to /dashboard/services. Let's keep it to /dashboard/services for now. */}
          </Link>
          <Link href="/dashboard/services">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl h-10 px-5 font-medium shadow-md border border-purple-700/20">
              <Plus className="h-4 w-4 mr-2" /> New Service
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100/80', border: 'border-purple-200' },
          { label: 'Vehicles', value: stats.totalVehicles, icon: Car, color: 'text-indigo-600', bg: 'bg-indigo-100/80', border: 'border-indigo-200' },
          { label: 'Services', value: stats.totalServices, icon: Wrench, color: 'text-emerald-600', bg: 'bg-emerald-100/80', border: 'border-emerald-200' },
          { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' }
        ].map((stat, i) => (
          <Card key={i} className={`rounded-2xl shadow-sm hover:shadow-md transition-all border ${stat.border} bg-white overflow-hidden group`}>
            <CardContent className="pt-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-black/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="flex items-center gap-4 relative">
                <div className={`p-3.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">{loading ? '-' : stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Two Columns */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        
        {/* Left Column: Activity Feed */}
        <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 pb-4">
            <CardTitle className="text-xl">Activity Feed</CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-slate-50/50">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
              </div>
            ) : activities.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activities.map((group, i) => (
                  <div key={i} className="p-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">{group.label}</h3>
                    <div className="space-y-4">
                      {group.items.map(item => (
                        <div key={item.id} className="group flex items-center justify-between p-3 -mx-3 rounded-xl hover:bg-purple-50/50 transition-colors border border-transparent hover:border-purple-100">
                          <div className="flex items-center gap-4">
                            {item.type === 'customer' ? (
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                                {item.title && item.title.length > 0 ? (
                                    <div className="h-full w-full rounded-full flex items-center justify-center overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.title}&backgroundColor=e2e8f0`} alt="" width={40} height={40} className="rounded-full" />
                                    </div>
                                ) : (
                                  <Users className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                                <Wrench className="h-5 w-5 text-indigo-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{item.title || 'Unknown'}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-slate-500">{item.subtitle}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 font-medium hidden sm:inline-block w-24 text-right">
                              {format(item.date, 'MMM d, yyyy')}
                            </span>
                            <div className="flex items-center gap-2">
                              <Link href={item.url}>
                                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-8 rounded-lg text-xs font-semibold px-4">
                                  View Details
                                </Button>
                              </Link>
                              {item.type === 'customer' && (
                                <Link href={`${item.url}/edit`}>
                                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold px-3 border-slate-200">
                                    Edit
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Quick Actions & Analytics */}
        <div className="space-y-6">
          <Card className="rounded-2xl shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <div className="text-sm font-semibold text-slate-500 mb-2 px-2">Shortcuts</div>
              <Link href="/dashboard/customers/new" className="flex items-center p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all mr-3">
                  <Plus className="h-4 w-4 text-slate-600" />
                </div>
                <span className="font-medium text-slate-700 group-hover:text-slate-900 flex-1">New Customer</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
              <Link href="/dashboard/services" className="flex items-center p-3 rounded-xl hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-100 group">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all mr-3">
                  <Wrench className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-medium text-purple-700 flex-1">New Service</span>
                <ChevronRight className="h-4 w-4 text-purple-400" />
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription>Activity overview</CardDescription>
            </CardHeader>
            <CardContent className="pb-6 pt-4">
               {/* Synthetic Chart Visual */}
               <div className="h-32 w-full flex items-end gap-1 px-2 relative z-10">
                 {[40, 70, 45, 90, 65, 85, 120, 95, 110, 140, 100, 160].map((val, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-purple-500/20 to-indigo-500/80 rounded-t-sm" style={{ height: `${(val / 160) * 100}%` }} />
                 ))}
               </div>
               <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Revenue Chart</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-2">
               {/* Synthetic Line Chart Visual */}
               <div className="h-24 w-full relative">
                 <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full stroke-purple-600 fill-purple-100/50">
                    <path d="M0,40 L0,30 C20,30 30,10 50,20 C70,30 80,5 100,10 L100,40 Z" />
                    <path d="M0,30 C20,30 30,10 50,20 C70,30 80,5 100,10" fill="none" strokeWidth="1.5" strokeLinecap="round" />
                 </svg>
                 <div className="absolute right-0 top-1/4 w-1 h-full bg-purple-200 group flex justify-center">
                    <div className="absolute -top-1 w-2 h-2 rounded-full bg-purple-600 ring-4 ring-white" />
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}