'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// 1. Validation Schema
const formSchema = z.object({
  v_number: z.string().min(2, "Vehicle number is required").transform(val => val.toUpperCase()),
  v_type: z.string().min(1, "Please select a vehicle type"),
  v_name: z.string().min(2, "Model name is required (e.g. Honda City)"),
  p_id: z.string().uuid("Please select an owner"),
});

type StudentOption = {
  p_id: string;
  p_name: string;
  p_mobile: string;
};

export default function AddVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);

  // 2. Fetch Students for the Dropdown
  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase
        .from('persons')
        .select('p_id, p_name, p_mobile')
        .order('p_name');
      
      if (error) {
        toast.error("Failed to load students list");
      } else {
        setStudents(data || []);
      }
    }
    fetchStudents();
  }, []);

  // 3. Initialize Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      v_number: "",
      v_type: "car",
      v_name: "",
      p_id: "",
    },
  });

  // 4. Submit Handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const { error } = await supabase.from('vehicles').insert([values]);

    if (error) {
      if (error.code === '23505') { // Unique constraint violation code
        toast.error("This vehicle number already exists!");
      } else {
        toast.error("Error adding vehicle: " + error.message);
      }
    } else {
      toast.success("Vehicle added successfully! 🚗");
      router.push('/dashboard/vehicles');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vehicles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add New Vehicle</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Owner Selection Dropdown */}
              <FormField
                control={form.control}
                name="p_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Owner <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.p_id} value={student.p_id}>
                            {student.p_name} ({student.p_mobile})
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
                      <Input placeholder="MH15AB1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vehicle Type & Name Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="v_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="car">Car (LMV)</SelectItem>
                          <SelectItem value="bike">Bike (MCWG)</SelectItem>
                          <SelectItem value="commercial">Commercial (TR)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="v_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Swift Dzire" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Vehicle
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