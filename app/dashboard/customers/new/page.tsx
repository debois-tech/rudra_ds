'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
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

// Validation Schema
const formSchema = z.object({
  c_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  c_mobile: z.string().regex(/^[0-9]{10}$/, { message: "Mobile number must be exactly 10 digits." }),
  c_whatsapp: z.string().regex(/^[0-9]{10}$/, { message: "WhatsApp number must be 10 digits." }).optional().or(z.literal('')),
  c_email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  c_address: z.string().optional(),
  c_dob: z.string().optional(),
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
    },
  });

  async function onSubmit(values: FormData) {
    setLoading(true);

    try {
      const customer = await customerApi.create({
        c_name: values.c_name,
        c_mobile: values.c_mobile,
        c_whatsapp: values.c_whatsapp || undefined,
        c_email: values.c_email || undefined,
        c_address: values.c_address || undefined,
        c_dob: values.c_dob || undefined,
      });
      toast.success(`Customer "${customer.c_name}" added! ID: ${customer.c_registration_id}`);
      router.push('/dashboard/customers');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error adding customer: " + message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Customer</h1>
          <p className="text-slate-500 text-sm">Customer will receive auto-generated Registration ID</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
          <CardDescription>Enter customer information. Fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Name Field */}
              <FormField
                control={form.control}
                name="c_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Rahul Sharma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mobile & WhatsApp Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="c_mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" maxLength={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="c_whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Same as mobile if empty" maxLength={10} {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Leave empty to use mobile number for notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email Field */}
              <FormField
                control={form.control}
                name="c_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="rahul@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Field */}
              <FormField
                control={form.control}
                name="c_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Full address (optional)"
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Birth */}
              <FormField
                control={form.control}
                name="c_dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Customer
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}