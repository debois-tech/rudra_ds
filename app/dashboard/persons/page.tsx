'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Phone, Trash2, Edit2 } from 'lucide-react';
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

// Define what a "Person" looks like
type Person = {
  p_id: string;
  p_name: string;
  p_mobile: string;
  p_email: string | null;
  p_whatsapp_no: string | null;
  created_at: string;
};

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Data Function
  const fetchPersons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load students: " + error.message);
    } else {
      setPersons(data || []);
    }
    setLoading(false);
  };

  // 2. Delete Function (Now inside the component scope)
  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure? This will also remove their linked vehicles and documents.");
    if (!confirmed) return;

    const { error } = await supabase.from('persons').delete().eq('p_id', id);
    
    if (error) {
      toast.error("Error deleting student: " + error.message);
    } else {
      toast.success("Student removed successfully");
      fetchPersons(); // This now works because it is in the same scope!
    }
  };

  // 3. Run fetch on initial load
  useEffect(() => {
    fetchPersons();
  }, []);

  // 4. Filter data based on search
  const filteredPersons = persons.filter(person => 
    person.p_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.p_mobile.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Manage driving school students and contact details.</p>
        </div>
        
        <Link href="/dashboard/persons/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add New Student
          </Button>
        </Link>
      </div>

      {/* Search Card */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            placeholder="Search by name or mobile number..." 
            className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Data Table */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-900">Name</TableHead>
              <TableHead className="font-semibold text-slate-900">Mobile</TableHead>
              <TableHead className="font-semibold text-slate-900">Email</TableHead>
              <TableHead className="font-semibold text-slate-900 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  Loading data...
                </TableCell>
              </TableRow>
            ) : filteredPersons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPersons.map((person) => (
                <TableRow key={person.p_id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">
                    {person.p_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-3 w-3" /> {person.p_mobile}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {person.p_email || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => handleDelete(person.p_id)}
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