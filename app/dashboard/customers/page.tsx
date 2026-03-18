'use client';

import { useEffect, useState } from 'react';
import { customerApi } from '@/lib/api';
import type { CustomerDashboardView } from '@/lib/types';
import { Plus, Search, Phone, Trash2, Eye, Car, FileText, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerDashboardView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Failed to load customers: " + message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = confirm(`Are you sure you want to delete "${name}"? This will also remove their vehicles and all associated documents.`);
    if (!confirmed) return;

    try {
      await customerApi.delete(id);
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error deleting customer: " + message);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.c_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.c_mobile.includes(searchTerm) ||
    c.c_registration_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage customers and their vehicle documents.</p>
        </div>

        <Link href="/dashboard/customers/new">
          <Button className="bg-blue-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </Link>
      </div>

      {/* Search Card */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search by name, mobile, or registration ID..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Customers</p>
          <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Vehicles</p>
          <p className="text-2xl font-bold text-slate-900">
            {customers.reduce((sum, c) => sum + c.vehicle_count, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Documents</p>
          <p className="text-2xl font-bold text-slate-900">
            {customers.reduce((sum, c) => sum + c.personal_doc_count + c.vehicle_doc_count, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Expiring Soon</p>
          <p className="text-2xl font-bold text-orange-600">
            {customers.reduce((sum, c) => sum + c.expiring_soon_count, 0)}
          </p>
        </Card>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-900">Reg. ID</TableHead>
              <TableHead className="font-semibold text-slate-900">Name</TableHead>
              <TableHead className="font-semibold text-slate-900">Mobile</TableHead>
              <TableHead className="font-semibold text-slate-900 text-center">Vehicles</TableHead>
              <TableHead className="font-semibold text-slate-900 text-center">Docs</TableHead>
              <TableHead className="font-semibold text-slate-900 text-center">Expiring</TableHead>
              <TableHead className="font-semibold text-slate-900 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  {searchTerm ? 'No customers match your search.' : 'No customers yet. Add your first customer!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.c_id} className="hover:bg-slate-50">
                  <TableCell>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      {customer.c_registration_id}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {customer.c_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-3 w-3" /> {customer.c_mobile}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-600">
                      <Car className="h-3 w-3" /> {customer.vehicle_count}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-600">
                      <FileText className="h-3 w-3" /> {customer.personal_doc_count + customer.vehicle_doc_count}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {customer.expiring_soon_count > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <AlertCircle className="h-3 w-3" /> {customer.expiring_soon_count}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/customers/${customer.c_id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => handleDelete(customer.c_id, customer.c_name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}