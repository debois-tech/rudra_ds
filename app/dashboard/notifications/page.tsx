'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, MessageSquare, Clock, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { toast } from "sonner";

type NotificationLog = {
  log_id: string;
  created_at: string;
  status: string;
  days_before: number;
  doc_id: string;
  // This helps us show which document the alert was for
  v_documents_full?: {
    doc_type_name: string;
    person_name: string;
    vehicle_number: string;
  };
};

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications_log')
      .select(`
        *,
        v_documents_full:documents!doc_id (
          doc_type_name:document_types(doc_type_name),
          person_name:persons(p_name),
          vehicle_number:vehicles(v_number)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Could not load notification history");
    } else {
      // @ts-ignore - Simplifying the nested data structure for the UI
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notification History</h1>
          <p className="text-slate-500 mt-1">Logs of all WhatsApp alerts sent to students.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          title="Refresh Logs"
        >
          <RefreshCcw className={`h-5 w-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Total Alerts Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{logs.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[180px]">Sent At</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Alert Type</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-2 opacity-20" />
                  Syncing logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                  No notifications have been sent yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.log_id} className="hover:bg-slate-50/50">
                  <TableCell className="text-slate-600 font-medium">
                    {format(new Date(log.created_at), 'dd MMM, hh:mm a')}
                  </TableCell>
                  <TableCell>
                    {/* We use the optional chaining to handle nulls safely */}
                    <div className="font-semibold text-slate-900">
                      {/* @ts-ignore */}
                      {log.v_documents_full?.person_name?.p_name || log.v_documents_full?.vehicle_number?.v_number || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* @ts-ignore */}
                    <span className="text-slate-600">{log.v_documents_full?.doc_type_name?.doc_type_name || 'Document'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {log.days_before} Day Reminder
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Sent
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