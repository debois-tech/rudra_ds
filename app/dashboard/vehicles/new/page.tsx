'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { vehicleApi, customerApi } from '@/lib/api';
import type { CustomerDashboardView } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
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
import { toast } from "sonner";
import Link from 'next/link';

const formSchema = z.object({
  owner_id: z.string().uuid({ message: "Please select an owner." }),
  v_number: z.string().min(4, { message: "Vehicle number is required." }).max(15),
  v_name: z.string().optional(),
  v_type: z.string().default('car'),
});

type FormData = z.infer<typeof formSchema>;

function AddVehicleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedOwner = searchParams.get('owner');

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerDashboardView[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      owner_id: preselectedOwner || "",
      v_number: "",
      v_name: "",
      v_type: "car",
    },
  });

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await customerApi.getAll();
        setCustomers(data);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error("Error loading customers: " + message);
      }
    }
    loadCustomers();
  }, []);

  async function onSubmit(values: FormData) {
    setLoading(true);
    try {
      const vehicle = await vehicleApi.create({
        owner_id: values.owner_id,
        v_number: values.v_number,
        v_name: values.v_name,
        v_type: values.v_type,
      });
      toast.success(`Vehicle "${vehicle.v_number}" added successfully!`);
      if (preselectedOwner) {
        router.push(`/dashboard/customers/${preselectedOwner}`);
      } else {
        router.push('/dashboard/vehicles');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error adding vehicle: " + message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={preselectedOwner ? `/dashboard/customers/${preselectedOwner}` : "/dashboard/vehicles"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Vehicle</h1>
          <p className="text-slate-500 text-sm">Register a vehicle for a customer</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
          <CardDescription>Enter vehicle information below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Owner Selection */}
              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner (Customer) <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.c_id} value={c.c_id}>
                            {c.c_name} ({c.c_mobile})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vehicle Number */}
              <FormField
                control={form.control}
                name="v_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Number <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. MH12AB1234"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vehicle Name/Model */}
              <FormField
                control={form.control}
                name="v_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Name/Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Maruti Swift, Honda Activa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vehicle Type */}
              <FormField
                control={form.control}
                name="v_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="bike">Bike / Scooter</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="bus">Bus</SelectItem>
                        <SelectItem value="auto">Auto Rickshaw</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Vehicle</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AddVehiclePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <AddVehicleForm />
    </Suspense>
  );
}