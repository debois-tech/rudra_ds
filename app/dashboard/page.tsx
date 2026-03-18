'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import type { DashboardStats, CustomerDashboardView, DocumentFullView } from '@/lib/types';
import { Users, Car, FileText, AlertCircle, ChevronRight, Plus, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalVehicles: 0,
    totalDocuments: 0,
    expiringSoon: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState<CustomerDashboardView[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<DocumentFullView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, customersData, docsData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentCustomers(5),
          dashboardApi.getUpcomingExpirations(8),
        ]);
        setStats(statsData);
        setRecentCustomers(customersData);
        setExpiringDocs(docsData);
      } catch (error) {
        console.error('Dashboard error:', error);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const getStatusColor = (days: number) => {
    if (days < 0) return "text-red-600 bg-red-50";
    if (days <= 7) return "text-amber-600 bg-amber-50";
    if (days <= 30) return "text-yellow-600 bg-yellow-50";
    return "text-blue-600 bg-emerald-50";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here&apos;s an overview of your business.</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </Link>
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
                <p className="text-sm text-slate-500">Total Customers</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? '-' : stats.totalCustomers}
                </p>
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
                <p className="text-sm text-slate-500">Total Vehicles</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? '-' : stats.totalVehicles}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-slate-100">
                <FileText className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Documents</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? '-' : stats.totalDocuments}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600">Expiring Soon</p>
                <p className="text-3xl font-bold text-orange-600">
                  {loading ? '-' : stats.expiringSoon}
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
                <Link href="/dashboard/customers/new">
                  <Button size="sm">Add First Customer</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCustomers.map((customer) => (
                  <Link
                    key={customer.c_id}
                    href={`/dashboard/customers/${customer.c_id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {customer.c_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{customer.c_name}</p>
                        <p className="text-xs text-slate-500">{customer.c_mobile}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {customer.vehicle_count} vehicles · {customer.personal_doc_count + customer.vehicle_doc_count} docs
                      </p>
                      {customer.expiring_soon_count > 0 && (
                        <span className="text-xs text-orange-600 font-medium">
                          {customer.expiring_soon_count} expiring
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Expirations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Upcoming Expirations</CardTitle>
            <Link href="/dashboard/documents/expiring">
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-slate-500 py-8">Loading...</p>
            ) : expiringDocs.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-3">
                  <AlertCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-slate-900 font-medium">All Clear!</p>
                <p className="text-sm text-slate-500">No documents expiring soon.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expiringDocs.map((doc) => (
                  <div
                    key={doc.doc_id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{doc.doc_type_name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {doc.customer_name}
                        {doc.entity_type === 'vehicle' && ` · ${doc.vehicle_number}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc.days_left)}`}>
                        {doc.days_left}d
                      </span>
                      <Link href={`/dashboard/documents/${doc.doc_id}/edit`}>
                        <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/customers/new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" /> New Customer
              </Button>
            </Link>
            <Link href="/dashboard/vehicles/new">
              <Button variant="outline" className="w-full justify-start">
                <Car className="h-4 w-4 mr-2" /> New Vehicle
              </Button>
            </Link>
            <Link href="/dashboard/documents/new">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" /> New Document
              </Button>
            </Link>
            <Link href="/dashboard/documents/expiring">
              <Button variant="outline" className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50">
                <AlertCircle className="h-4 w-4 mr-2" /> View Expiring
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}