'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save, CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import Link from 'next/link';

// Schema
const formSchema = z.object({
  doc_type_id: z.string().min(1, "Select a document type"),
  entity_type: z.enum(["person", "vehicle"]),
  entity_id: z.string().uuid("Select who this document belongs to"),
  doc_number: z.string().min(2, "Document number is required"),
  issue_date: z.string().optional(),
  exp_date: z.string().min(10, "Expiry date is required"),
});

export default function AddDocumentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entity_type: "person",
      doc_number: "",
      // Initialize these to empty strings to fix the React warning
      issue_date: "", 
      exp_date: "",
      doc_type_id: "",
      entity_id: "",
    },
  });

  // Watch entity type to switch dropdowns
  const entityType = form.watch("entity_type");

  // 1. Fetch Data (Types, Persons, Vehicles)
  useEffect(() => {
    const loadData = async () => {
      // Fetch Doc Types
      const { data: types } = await supabase.from('document_types').select('*');
      setDocTypes(types || []);

      // Fetch Persons
      const { data: ppl } = await supabase.from('persons').select('p_id, p_name, p_mobile');
      setPersons(ppl || []);

      // Fetch Vehicles
      const { data: vhcls } = await supabase.from('vehicles').select('v_id, v_number, v_name');
      setVehicles(vhcls || []);
    };
    loadData();
  }, []);

  // 2. Filter Doc Types based on selection
  const filteredDocTypes = docTypes.filter(dt => dt.entity_type === entityType);

  // 3. Submit
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    
    // Ensure dates are formatted YYYY-MM-DD (HTML input does this by default)
    const { error } = await supabase.from('documents').insert([{
      doc_type_id: parseInt(values.doc_type_id), // Convert string to int
      entity_type: values.entity_type,
      entity_id: values.entity_id,
      doc_number: values.doc_number,
      issue_date: values.issue_date || null,
      exp_date: values.exp_date,
    }]);

    if (error) {
      toast.error("Error saving document: " + error.message);
    } else {
      toast.success("Document saved! 📄");
      router.push('/dashboard/documents');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add New Document</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Entity Type Radio */}
              <FormField
                control={form.control}
                name="entity_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>This document belongs to...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="person" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">A Student</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="vehicle" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">A Vehicle</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Dynamic Entity Select (Person OR Vehicle) */}
              <FormField
                control={form.control}
                name="entity_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select {entityType === 'person' ? 'Student' : 'Vehicle'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${entityType}...`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {entityType === 'person' 
                          ? persons.map(p => (
                              <SelectItem key={p.p_id} value={p.p_id}>{p.p_name} ({p.p_mobile})</SelectItem>
                            ))
                          : vehicles.map(v => (
                              <SelectItem key={v.v_id} value={v.v_id}>{v.v_number} - {v.v_name}</SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Document Type Select */}
              <FormField
                control={form.control}
                name="doc_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredDocTypes.map(dt => (
                          <SelectItem key={dt.doc_type_id} value={dt.doc_type_id.toString()}>
                            {dt.doc_type_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Doc Number */}
              <FormField
                control={form.control}
                name="doc_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. DL-1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exp_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                Save Document
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}