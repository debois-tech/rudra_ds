'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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
import { format } from 'date-fns';

type DocView = {
  doc_id: string;
  doc_type_name: string;
  doc_number: string;
  entity_type: 'person' | 'vehicle';
  person_name: string | null;
  vehicle_number: string | null;
  exp_date: string;
  days_left: number;
  status: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    // Fetch from our new View
    const { data, error } = await supabase
      .from('v_documents_full')
      .select('*')
      .order('days_left', { ascending: true }); // Show expiring soonest first

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Helper to determine status color
  const getStatusColor = (days: number) => {
    if (days < 0) return "bg-red-100 text-red-700 border-red-200"; // Expired
    if (days <= 7) return "bg-amber-100 text-amber-700 border-amber-200"; // Urgent
    if (days <= 30) return "bg-yellow-50 text-yellow-700 border-yellow-200"; // Warning
    return "bg-emerald-50 text-emerald-700 border-emerald-200"; // Safe
  };

  const getStatusIcon = (days: number) => {
    if (days < 0) return <XCircle className="h-4 w-4" />;
    if (days <= 30) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const filteredDocs = documents.filter(d => 
    d.doc_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 mt-1">Track expiries for Driving Licenses, Insurance, etc.</p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add Document
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by doc number, person, or vehicle..." 
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
              <TableHead className="font-semibold text-slate-900">Document</TableHead>
              <TableHead className="font-semibold text-slate-900">Belongs To</TableHead>
              <TableHead className="font-semibold text-slate-900">Expiry Date</TableHead>
              <TableHead className="font-semibold text-slate-900">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">Loading...</TableCell>
              </TableRow>
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.doc_id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{doc.doc_type_name}</span>
                      <span className="text-xs text-slate-500 font-mono">{doc.doc_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.entity_type === 'person' ? (
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Person</span>
                        {doc.person_name}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Vehicle</span>
                        {doc.vehicle_number}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-700 font-medium">
                      {format(new Date(doc.exp_date), 'dd MMM yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.days_left)}`}>
                      {getStatusIcon(doc.days_left)}
                      {doc.days_left < 0 ? `${Math.abs(doc.days_left)} days overdue` : `${doc.days_left} days left`}
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