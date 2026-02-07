'use client';

import { useEffect, useState } from 'react';
import { documentApi } from '@/lib/api';
import type { DocumentFullView } from '@/lib/types';
import { Plus, Search, FileText, Edit, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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
import { format } from 'date-fns';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentFullView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentApi.getAll();
      setDocuments(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error loading documents: " + message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) return;

    try {
      await documentApi.delete(id);
      toast.success("Document deleted successfully");
      fetchDocuments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error deleting document: " + message);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

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

  const filteredDocs = documents.filter(d =>
    d.doc_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.doc_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const expired = documents.filter(d => d.days_left < 0).length;
  const critical = documents.filter(d => d.days_left >= 0 && d.days_left <= 7).length;
  const warning = documents.filter(d => d.days_left > 7 && d.days_left <= 30).length;
  const valid = documents.filter(d => d.days_left > 30).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All Documents</h1>
          <p className="text-slate-500 mt-1">Track all document expiries for customers and vehicles.</p>
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
          <input
            placeholder="Search by document type, number, customer or vehicle..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 max-w-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-red-500">
          <p className="text-sm text-slate-500">Expired</p>
          <p className="text-2xl font-bold text-red-600">{expired}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-sm text-slate-500">Critical (≤7 days)</p>
          <p className="text-2xl font-bold text-amber-600">{critical}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <p className="text-sm text-slate-500">Warning (8-30 days)</p>
          <p className="text-2xl font-bold text-yellow-600">{warning}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-sm text-slate-500">Valid (&gt;30 days)</p>
          <p className="text-2xl font-bold text-emerald-600">{valid}</p>
        </Card>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-900">Document</TableHead>
              <TableHead className="font-semibold text-slate-900">Belongs To</TableHead>
              <TableHead className="font-semibold text-slate-900">Customer</TableHead>
              <TableHead className="font-semibold text-slate-900">Expiry Date</TableHead>
              <TableHead className="font-semibold text-slate-900">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">Loading documents...</TableCell>
              </TableRow>
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  {searchTerm ? 'No documents match your search.' : 'No documents yet. Add your first document!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.doc_id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{doc.doc_type_name}</span>
                      {doc.doc_number && (
                        <span className="text-xs text-slate-500 font-mono">{doc.doc_number}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.entity_type === 'customer' ? (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">Personal</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium">{doc.vehicle_number}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/customers/${doc.customer_id}`} className="text-blue-600 hover:underline">
                      {doc.customer_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-700 font-medium">
                      {format(new Date(doc.exp_date), 'dd MMM yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.days_left)}`}>
                      {getStatusIcon(doc.days_left)}
                      {doc.days_left < 0 ? `${Math.abs(doc.days_left)}d overdue` : `${doc.days_left}d left`}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/documents/${doc.doc_id}/edit`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => handleDelete(doc.doc_id, doc.doc_type_name)}
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