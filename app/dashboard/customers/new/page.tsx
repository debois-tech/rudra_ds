'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerApi } from '@/lib/api';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save, Plus, Trash2, Car } from 'lucide-react';
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
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Customer</h1>
          <p className="text-slate-500 text-sm">Add customer details and their vehicles</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Fields marked with * are required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField control={form.control} name="c_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input placeholder="e.g. Rahul Sharma" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="c_mobile" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder="9876543210" maxLength={10} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="c_whatsapp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl><Input placeholder="Same as mobile if empty" maxLength={10} {...field} /></FormControl>
                    <FormDescription className="text-xs">Leave empty to use mobile number</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="c_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input placeholder="rahul@example.com" type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="c_address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Textarea placeholder="Full address (optional)" className="resize-none" rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="c_dob" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Vehicles Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" /> Vehicles
                  </CardTitle>
                  <CardDescription>Add customer&apos;s vehicles (optional)</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ v_number: '', v_name: '', v_type: 'car' })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Vehicle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Car className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No vehicles added yet</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-blue-600"
                    onClick={() => append({ v_number: '', v_name: '', v_type: 'car' })}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add First Vehicle
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <FormField control={form.control} name={`vehicles.${index}.v_number`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Vehicle Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="MH12AB1234" {...field} className="uppercase" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`vehicles.${index}.v_name`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Vehicle Name</FormLabel>
                            <FormControl><Input placeholder="e.g. Swift" {...field} /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`vehicles.${index}.v_type`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Vehicle Type</FormLabel>
                            <FormControl>
                              <select {...field} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
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
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 mt-6"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-5 w-5" /> Save Customer</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}