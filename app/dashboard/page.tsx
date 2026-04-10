'use client';

import { useEffect, useState } from 'react';
import { dashboardApi, serviceApi } from '@/lib/api';
import type { DashboardStats, CustomerDashboardView, ServiceOverview } from '@/lib/types';
import { Users, Car, Wrench, IndianRupee, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0, totalVehicles: 0, totalServices: 0, totalRevenue: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState<CustomerDashboardView[]>([]);
  const [recentServices, setRecentServices] = useState<ServiceOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, customersData, servicesData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentCustomers(5),
          dashboardApi.getRecentServices(8),
        ]);
        setStats(statsData);
        setRecentCustomers(customersData);
        setRecentServices(servicesData);
      } catch (error) {
        console.error('Dashboard error:', error);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here&apos;s an overview of your business.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/customers/new">
            <Button variant="outline"><Plus className="h-4 w-4 mr-2" /> New Customer</Button>
          </Link>
          <Link href="/dashboard/services">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Wrench className="h-4 w-4 mr-2" /> New Service
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Customers</p>
                <p className="text-3xl font-bold text-slate-900">{loading ? '-' : stats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Vehicles</p>
                <p className="text-3xl font-bold text-slate-900">{loading ? '-' : stats.totalVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-100">
                <Wrench className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Services</p>
                <p className="text-3xl font-bold text-slate-900">{loading ? '-' : stats.totalServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-100">
                <IndianRupee className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-600">Revenue</p>
                <p className="text-3xl font-bold text-emerald-700">
                  {loading ? '-' : `₹${stats.totalRevenue.toLocaleString('en-IN')}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Recent Customers</CardTitle>
            <Link href="/dashboard/customers">
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-slate-500 py-8">Loading...</p>
            ) : recentCustomers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">No customers yet</p>
                <Link href="/dashboard/customers/new"><Button size="sm">Add First Customer</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCustomers.map(c => (
                  <Link key={c.c_id} href={`/dashboard/customers/${c.c_id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {c.c_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{c.c_name}</p>
                        <p className="text-xs text-slate-500">{c.c_mobile}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{c.vehicle_count} vehicles · {c.service_count} services</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Recent Services</CardTitle>
            <Link href="/dashboard/services/overview">
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-slate-500 py-8">Loading...</p>
            ) : recentServices.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-3">
                  <Wrench className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-slate-900 font-medium">No Services Yet</p>
                <p className="text-sm text-slate-500">Start by creating your first service.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentServices.map(s => (
                  <div key={s.s_id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{s.service_name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {s.customer_name}
                        {s.category === 'vehicle' && s.vehicle_number && ` · ${s.vehicle_number}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.category === 'vehicle' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>{s.category}</span>
                      <span className="text-sm font-semibold text-slate-900">₹{Number(s.total_cost).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/dashboard/customers/new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" /> New Customer
              </Button>
            </Link>
            <Link href="/dashboard/services">
              <Button variant="outline" className="w-full justify-start text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <Wrench className="h-4 w-4 mr-2" /> New Service
              </Button>
            </Link>
            <Link href="/dashboard/services/overview">
              <Button variant="outline" className="w-full justify-start">
                <ChevronRight className="h-4 w-4 mr-2" /> Service Overview
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}