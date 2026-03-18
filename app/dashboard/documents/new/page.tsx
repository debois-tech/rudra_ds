'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { documentApi, documentTypeApi, customerApi, vehicleApi } from '@/lib/api';
import type { DocumentType, CustomerDashboardView, Vehicle } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save, Car } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { CustomerSearchCombobox } from "@/components/ui/customer-search-combobox";
import { toast } from "sonner";
import Link from 'next/link';

const formSchema = z.object({
  doc_type_id: z.string().min(1, "Select a document type"),
  entity_type: z.enum(["customer", "vehicle"]),
  entity_id: z.string().uuid("Select who this document belongs to"),
  doc_number: z.string().optional(),
  issue_date: z.string().optional(),
  exp_date: z.string().min(10, "Expiry date is required"),
});

type FormData = z.infer<typeof formSchema>;

function AddDocumentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomer = searchParams.get('customer');

  const [loading, setLoading] = useState(false);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [customers, setCustomers] = useState<CustomerDashboardView[]>([]);

  // For vehicle mode: which customer was searched, and their vehicles
  const [selectedVehicleOwnerId, setSelectedVehicleOwnerId] = useState<string>('');
  const [ownerVehicles, setOwnerVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entity_type: "customer",
      doc_number: "",
      issue_date: "",
      exp_date: "",
      doc_type_id: "",
      entity_id: preselectedCustomer || "",
    },
  });

  const entityType = form.watch("entity_type");

  useEffect(() => {
    async function loadData() {
      try {
        const [types, custs] = await Promise.all([
          documentTypeApi.getAll(),
          customerApi.getAll(),
        ]);
        setDocTypes(types);
        setCustomers(custs);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error("Error loading data: " + message);
      }
    }
    loadData();
  }, []);

  // When a customer is picked in vehicle-mode, load only their vehicles
  useEffect(() => {
    async function loadOwnerVehicles() {
      if (entityType === 'vehicle' && selectedVehicleOwnerId) {
        setVehiclesLoading(true);
        setOwnerVehicles([]);
        form.setValue('entity_id', '');
        try {
          const vehs = await vehicleApi.getByOwner(selectedVehicleOwnerId);
          setOwnerVehicles(vehs);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          toast.error("Error loading vehicles: " + message);
        } finally {
          setVehiclesLoading(false);
        }
      }
    }
    loadOwnerVehicles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleOwnerId, entityType]);

  // Filter doc types based on entity type
  const filteredDocTypes = docTypes.filter(dt => dt.entity_type === entityType);

  async function onSubmit(values: FormData) {
    setLoading(true);
    try {
      await documentApi.create({
        doc_type_id: parseInt(values.doc_type_id),
        entity_type: values.entity_type,
        entity_id: values.entity_id,
        doc_number: values.doc_number || undefined,
        issue_date: values.issue_date || undefined,
        exp_date: values.exp_date,
      });
      toast.success("Document saved successfully!");

      if (preselectedCustomer) {
        router.push(`/dashboard/customers/${preselectedCustomer}`);
      } else {
        router.push('/dashboard/documents');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error saving document: " + message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={preselectedCustomer ? `/dashboard/customers/${preselectedCustomer}` : "/dashboard/documents"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Document</h1>
          <p className="text-slate-500 text-sm">Track document expiry for customer or vehicle</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>Enter document information below.</CardDescription>
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
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue('entity_id', '');
                          form.setValue('doc_type_id', '');
                          setSelectedVehicleOwnerId('');
                          setOwnerVehicles([]);
                        }}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="customer" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">A Customer (Personal Doc)</FormLabel>
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

              {/* ─── CUSTOMER MODE ─── */}
              {entityType === 'customer' && (
                <FormField
                  control={form.control}
                  name="entity_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Customer <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <CustomerSearchCombobox
                          customers={customers}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* ─── VEHICLE MODE ─── */}
              {entityType === 'vehicle' && (
                <div className="space-y-4">
                  {/* Step 1: Search customer */}
                  <FormItem>
                    <FormLabel>
                      Owner (Customer) <span className="text-red-500">*</span>
                    </FormLabel>
                    <CustomerSearchCombobox
                      customers={customers}
                      value={selectedVehicleOwnerId}
                      onChange={(id) => {
                        setSelectedVehicleOwnerId(id);
                        form.setValue('entity_id', '');
                      }}
                      placeholder="Search owner by name or mobile..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Select the owner to load their vehicles
                    </p>
                  </FormItem>

                  {/* Step 2: Pick from that owner's vehicles */}
                  {selectedVehicleOwnerId && (
                    <FormField
                      control={form.control}
                      name="entity_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Select Vehicle <span className="text-red-500">*</span>
                          </FormLabel>
                          {vehiclesLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading vehicles...
                            </div>
                          ) : ownerVehicles.length === 0 ? (
                            <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                              <Car className="h-4 w-4 shrink-0" />
                              No vehicles found for this customer.
                            </div>
                          ) : (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select vehicle..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ownerVehicles.map((v) => (
                                  <SelectItem key={v.v_id} value={v.v_id}>
                                    {v.v_number}
                                    {v.v_name ? ` — ${v.v_name}` : ''}
                                    {' '}
                                    <span className="text-muted-foreground text-xs capitalize">({v.v_type})</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Document Type */}
              <FormField
                control={form.control}
                name="doc_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type..." />
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

              {/* Document Number */}
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
                      <FormLabel>Issue Date</FormLabel>
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

              <Button type="submit" className="w-full bg-blue-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Document</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AddDocumentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <AddDocumentForm />
    </Suspense>
  );
}