'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerApi } from '@/lib/api';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save, Plus, Trash2, Car, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import Link from 'next/link';

const vehicleSchema = z.object({
  v_number: z.string().min(1, "Vehicle number is required"),
  v_name: z.string().optional(),
  v_type: z.string().optional(),
});

const formSchema = z.object({
  c_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  c_mobile: z.string().regex(/^[0-9]{10}$/, { message: "Mobile number must be exactly 10 digits." }),
  c_whatsapp: z.string().regex(/^[0-9]{10}$/, { message: "WhatsApp number must be 10 digits." }).optional().or(z.literal('')),
  c_email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  c_address: z.string().optional(),
  c_dob: z.string().optional(),
  vehicles: z.array(vehicleSchema).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AddCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      c_name: "",
      c_mobile: "",
      c_whatsapp: "",
      c_email: "",
      c_address: "",
      c_dob: "",
      vehicles: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "vehicles",
  });

  async function onSubmit(values: FormData) {
    setLoading(true);
    try {
      const vehicles = values.vehicles?.filter(v => v.v_number.trim()) || [];
      const customer = await customerApi.create(
        {
          c_name: values.c_name,
          c_mobile: values.c_mobile,
          c_whatsapp: values.c_whatsapp || undefined,
          c_email: values.c_email || undefined,
          c_address: values.c_address || undefined,
          c_dob: values.c_dob || undefined,
        },
        vehicles.length > 0 ? vehicles.map(v => ({
          v_number: v.v_number,
          v_name: v.v_name,
          v_type: v.v_type,
        })) : undefined
      );
      toast.success(`Customer "${customer.c_name}" added! ID: ${customer.c_registration_id}`);
      router.push('/dashboard/customers');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error adding customer: " + message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 py-2 border-b border-slate-200 pb-6">
        <Link href="/dashboard/customers">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Customer</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Register a new customer and their vehicles</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Details Card */}
          <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
              <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-amber-600" /> Personal Details</CardTitle>
              <CardDescription>Fields marked with * are required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 bg-slate-50/30">
              <FormField control={form.control} name="c_name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input placeholder="e.g. Rahul Sharma" className="bg-white rounded-xl focus-visible:ring-amber-200" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField control={form.control} name="c_mobile" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mobile Number <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder="9876543210" maxLength={10} className="bg-white rounded-xl focus-visible:ring-amber-200" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="c_whatsapp" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">WhatsApp Number</FormLabel>
                    <FormControl><Input placeholder="Same as mobile if empty" maxLength={10} className="bg-white rounded-xl focus-visible:ring-amber-200" {...field} /></FormControl>
                    <FormDescription className="text-[10px] uppercase font-semibold">Leave empty to use mobile number</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField control={form.control} name="c_email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</FormLabel>
                    <FormControl><Input placeholder="rahul@example.com" type="email" className="bg-white rounded-xl focus-visible:ring-amber-200" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="c_dob" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date of Birth</FormLabel>
                    <FormControl><Input type="date" className="bg-white rounded-xl focus-visible:ring-amber-200" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="c_address" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Address</FormLabel>
                  <FormControl><Textarea placeholder="Full residential address (optional)" className="resize-none bg-white rounded-xl focus-visible:ring-amber-200" rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Vehicles Card */}
          <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-3 pt-5 px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Car className="h-5 w-5 text-amber-600" /> Vehicles
                  </CardTitle>
                  <CardDescription>Add customer&apos;s vehicles (optional)</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => append({ v_number: '', v_name: '', v_type: 'car' })}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Add Vehicle
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-slate-50/30">
              {fields.length === 0 ? (
                <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-xl">
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                     <Car className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No vehicles added yet</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-semibold"
                    onClick={() => append({ v_number: '', v_name: '', v_type: 'car' })}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add First Vehicle
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm relative group transition-all hover:border-amber-200">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                        <FormField control={form.control} name={`vehicles.${index}.v_number`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Vehicle Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="MH12AB1234" {...field} className="uppercase bg-slate-50 focus-visible:ring-amber-200 h-10 rounded-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`vehicles.${index}.v_name`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Vehicle Name</FormLabel>
                            <FormControl><Input placeholder="e.g. Swift" {...field} className="bg-slate-50 focus-visible:ring-amber-200 h-10 rounded-lg" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`vehicles.${index}.v_type`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Vehicle Type</FormLabel>
                            <FormControl>
                              <select {...field} className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">
                                <option value="car">Car</option>
                                <option value="bike">Bike</option>
                                <option value="truck">Truck</option>
                                <option value="bus">Bus</option>
                                <option value="auto">Auto</option>
                                <option value="tractor">Tractor</option>
                                <option value="other">Other</option>
                              </select>
                            </FormControl>
                          </FormItem>
                        )} />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 mt-6 sm:mt-6 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={() => remove(index)}
                        title="Remove Vehicle"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black shadow-md border border-amber-600/20 rounded-xl h-10 text-base font-bold tracking-wide" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-5 w-5" /> Create Customer Profile</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}