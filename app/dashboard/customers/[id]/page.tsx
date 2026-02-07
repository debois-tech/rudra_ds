'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { customerApi, vehicleApi, documentApi } from '@/lib/api';
import type { CustomerDashboardView, Vehicle, DocumentFullView } from '@/lib/types';
import { ArrowLeft, Edit, Plus, Car, FileText, Phone, Mail, MapPin, Calendar, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import Link from 'next/link';
import { format } from 'date-fns';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDashboardView | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [documents, setDocuments] = useState<DocumentFullView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [customerData, vehiclesData, docsData] = await Promise.all([
          customerApi.getByIdWithStats(customerId),
          vehicleApi.getByOwner(customerId),
          documentApi.getByCustomer(customerId),
        ]);
        setCustomer(customerData);
        setVehicles(vehiclesData);
        setDocuments(docsData);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error("Error loading customer: " + message);
      }
      setLoading(false);
    }
    fetchData();
  }, [customerId]);

  const getStatusColor = (days: number) => {
    if (days < 0) return "bg-red-100 text-red-700 border-red-200";
    if (days <= 7) return "bg-amber-100 text-amber-700 border-amber-200";
    if (days <= 30) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const getStatusIcon = (days: number) => {
    if (days < 0) return <XCircle className="h-4 w-4" />;
    if (days <= 30) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading customer details...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500">Customer not found.</p>
        <Link href="/dashboard/customers">
          <Button>Back to Customers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{customer.c_name}</h1>
            <p className="text-slate-500 font-mono text-sm">{customer.c_registration_id}</p>
          </div>
        </div>
        <Link href={`/dashboard/customers/${customerId}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" /> Edit Customer
          </Button>
        </Link>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Mobile</p>
                <p className="font-medium">{customer.c_mobile}</p>
              </div>
            </div>
            {customer.c_whatsapp && customer.c_whatsapp !== customer.c_mobile && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-slate-500">WhatsApp</p>
                  <p className="font-medium">{customer.c_whatsapp}</p>
                </div>
              </div>
            )}
            {customer.c_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{customer.c_email}</p>
                </div>
              </div>
            )}
            {customer.c_address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-medium">{customer.c_address}</p>
                </div>
              </div>
            )}
            {customer.c_dob && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Date of Birth</p>
                  <p className="font-medium">{format(new Date(customer.c_dob), 'dd MMM yyyy')}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Customer Since</p>
                <p className="font-medium">{format(new Date(customer.created_at), 'dd MMM yyyy')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{customer.vehicle_count}</p>
              <p className="text-sm text-slate-500">Vehicles</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{customer.personal_doc_count}</p>
              <p className="text-sm text-slate-500">Personal Docs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-slate-500" />
            <div>
              <p className="text-2xl font-bold">{customer.vehicle_doc_count}</p>
              <p className="text-sm text-slate-500">Vehicle Docs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{customer.expiring_soon_count}</p>
              <p className="text-sm text-slate-500">Expiring Soon</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Vehicles Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" /> Vehicles
          </CardTitle>
          <Link href={`/dashboard/vehicles/new?owner=${customerId}`}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-1" /> Add Vehicle
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No vehicles registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.v_id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <Car className="h-8 w-8 text-slate-400" />
                    <div>
                      <p className="font-bold text-lg bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded inline-block">
                        {vehicle.v_number}
                      </p>
                      <p className="text-sm text-slate-500">{vehicle.v_name || vehicle.v_type}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> All Documents
          </CardTitle>
          <Link href={`/dashboard/documents/new?customer=${customerId}`}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-1" /> Add Document
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No documents added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>For</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.doc_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.doc_type_name}</p>
                        {doc.doc_number && (
                          <p className="text-xs text-slate-500 font-mono">{doc.doc_number}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.entity_type === 'customer' ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Personal</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">{doc.vehicle_number}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(doc.exp_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.days_left)}`}>
                        {getStatusIcon(doc.days_left)}
                        {doc.days_left < 0 ? `${Math.abs(doc.days_left)}d overdue` : `${doc.days_left}d left`}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/documents/${doc.doc_id}/edit`}>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}