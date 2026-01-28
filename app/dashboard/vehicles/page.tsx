'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Car, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Define Vehicle Type (including the nested person details)
type Vehicle = {
  v_id: string;
  v_number: string;
  v_type: string;
  v_name: string;
  persons: {
    p_name: string;
    p_mobile: string;
  } | null; // It might be null if the link is broken, though our DB enforces it
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVehicles = async () => {
    setLoading(true);
    // ⚡ MAGIC QUERY: Fetch vehicles AND the related person data
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        persons (
          p_name,
          p_mobile
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      // @ts-ignore - Supabase types can be tricky with joins, ignoring for simplicity
      setVehicles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(v => 
    v.v_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.persons?.p_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vehicles</h1>
          <p className="text-slate-500 mt-1">Manage vehicles and assign them to students.</p>
        </div>
        <Link href="/dashboard/vehicles/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add New Vehicle
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by vehicle number or owner name..." 
            className="pl-10 max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

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
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">Loading...</TableCell>
              </TableRow>
            ) : filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  No vehicles found.
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.v_id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold border border-yellow-200">
                        {vehicle.v_number.toUpperCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-medium">{vehicle.v_name}</span>
                      <span className="text-xs text-slate-500 capitalize">{vehicle.v_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="h-3 w-3" /> 
                      {vehicle.persons?.p_name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-blue-600">Edit</Button>
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