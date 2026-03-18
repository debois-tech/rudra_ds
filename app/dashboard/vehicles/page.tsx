'use client';

import { useEffect, useState } from 'react';
import { vehicleApi, customerApi } from '@/lib/api';
import type { VehicleWithOwner } from '@/lib/types';
import { Plus, Search, Car, User, Trash2, Edit } from 'lucide-react';
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

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehicleApi.getAll();
      setVehicles(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error loading vehicles: " + message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, number: string) => {
    const confirmed = confirm(`Are you sure you want to delete vehicle "${number}"? This will also remove all associated documents.`);
    if (!confirmed) return;

    try {
      await vehicleApi.delete(id);
      toast.success("Vehicle deleted successfully");
      fetchVehicles();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error deleting vehicle: " + message);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(v =>
    v.v_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.v_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.customers?.c_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vehicles</h1>
          <p className="text-slate-500 mt-1">Manage vehicles and assign them to customers.</p>
        </div>
        <Link href="/dashboard/vehicles/new">
          <Button className="bg-blue-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add Vehicle
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search by vehicle number, name, or owner..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Vehicles</p>
          <p className="text-2xl font-bold text-slate-900">{vehicles.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Cars</p>
          <p className="text-2xl font-bold text-slate-900">
            {vehicles.filter(v => v.v_type === 'car').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Two-Wheelers</p>
          <p className="text-2xl font-bold text-slate-900">
            {vehicles.filter(v => v.v_type === 'bike' || v.v_type === 'motorcycle').length}
          </p>
        </Card>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-900">Vehicle No.</TableHead>
              <TableHead className="font-semibold text-slate-900">Model / Type</TableHead>
              <TableHead className="font-semibold text-slate-900">Owner</TableHead>
              <TableHead className="text-right font-semibold text-slate-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">Loading vehicles...</TableCell>
              </TableRow>
            ) : filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  {searchTerm ? 'No vehicles match your search.' : 'No vehicles yet. Add your first vehicle!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.v_id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-bold border border-yellow-200">
                      {vehicle.v_number}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-medium">{vehicle.v_name || '-'}</span>
                      <span className="text-xs text-slate-500 capitalize">{vehicle.v_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="h-3 w-3" />
                      {vehicle.customers?.c_name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/vehicles/${vehicle.v_id}/edit`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => handleDelete(vehicle.v_id, vehicle.v_number)}
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