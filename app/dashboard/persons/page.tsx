'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Phone, Mail } from 'lucide-react';
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
import Link from 'next/link'; // <--- IMPORTANT IMPORT

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

  // 2. Run fetch on initial load
  useEffect(() => {
    fetchPersons();
  }, []);

  // 3. Filter data based on search
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
        
        {/* THIS IS THE FIX: Wrapping the button in a Link */}
        <Link href="/dashboard/persons/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add New Student
          </Button>
        </Link>
      </div>

      {/* Search & Stats */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name or mobile number..." 
            className="pl-10 max-w-sm"
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
                  No students found. Add your first student!
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
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                      Edit
                    </Button>
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