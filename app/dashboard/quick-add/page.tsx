'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Car, FileText, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// One big schema for everything
const quickSchema = z.object({
  // Student
  p_name: z.string().min(2, "Name is required"),
  p_mobile: z.string().length(10, "Mobile must be 10 digits"),
  // Vehicle
  v_number: z.string().min(5, "Vehicle number required").toUpperCase(),
  v_name: z.string().min(2, "Vehicle model required"),
  // Document (License)
  doc_number: z.string().min(5, "License/Doc number required"),
  exp_date: z.string().min(10, "Expiry date required"),
});

export default function QuickAddPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof quickSchema>>({
    resolver: zodResolver(quickSchema),
    defaultValues: { p_name: "", p_mobile: "", v_number: "", v_name: "", doc_number: "", exp_date: "" }
  });

  async function onSubmit(values: z.infer<typeof quickSchema>) {
    setLoading(true);
    try {
      // 1. Create Person
      const { data: person, error: pError } = await supabase
        .from('persons')
        .insert([{ p_name: values.p_name, p_mobile: values.p_mobile }])
        .select()
        .single();
      
      if (pError) throw pError;

      // 2. Create Vehicle
      const { data: vehicle, error: vError } = await supabase
        .from('vehicles')
        .insert([{ p_id: person.p_id, v_number: values.v_number, v_name: values.v_name, v_type: 'car' }])
        .select()
        .single();
      
      if (vError) throw vError;

      // 3. Create Document (Driving License by default)
      const { error: dError } = await supabase
        .from('documents')
        .insert([{ 
          entity_id: person.p_id, 
          entity_type: 'person', 
          doc_type_id: 1, // 1 is usually DL based on our setup
          doc_number: values.doc_number, 
          exp_date: values.exp_date 
        }]);

      if (dError) throw dError;

      toast.success("Full Profile Created Successfully!");
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="max-w-xl mx-auto space-y-8 pt-4 pb-10">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-slate-900">Quick Onboarding</h1>
      <p className="text-slate-500 mt-2">Register a student, vehicle, and license in one go.</p>
    </div>

    {/* Progress Indicator */}
    <div className="flex justify-between items-center px-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className={`flex items-center ${s !== 3 ? 'w-full' : ''}`}>
          <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${step >= s ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 text-slate-400'}`}>
            {step > s ? <CheckCircle2 className="h-6 w-6" /> : <span className="font-semibold">{s}</span>}
          </div>
          {s !== 3 && <div className={`h-1 w-full mx-2 ${step > s ? 'bg-emerald-600' : 'bg-slate-100'}`} />}
        </div>
      ))}
    </div>

    <Card className="shadow-md border-slate-200">
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Student */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg mb-2">
                  <User className="h-5 w-5" /> Step 1: Student Details
                </div>
                <FormField control={form.control} name="p_name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="p_mobile" render={({ field }) => (
                  <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="9876543210" maxLength={10} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="pt-4">
                  <Button type="button" className="w-full h-11 text-base bg-slate-900 hover:bg-slate-800" onClick={() => setStep(2)}>
                    Next: Vehicle Info <ArrowRight className="ml-2 h-4 w-4"/>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Vehicle */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg mb-2">
                  <Car className="h-5 w-5" /> Step 2: Vehicle Details
                </div>
                <FormField control={form.control} name="v_number" render={({ field }) => (
                  <FormItem><FormLabel>Vehicle Registration No.</FormLabel><FormControl><Input placeholder="MH15AB1234" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="v_name" render={({ field }) => (
                  <FormItem><FormLabel>Model (e.g. Swift)</FormLabel><FormControl><Input placeholder="Maruti Swift" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back
                  </Button>
                  <Button type="button" className="flex-1 h-11 bg-slate-900 hover:bg-slate-800" onClick={() => setStep(3)}>
                    Next: Documents <ArrowRight className="ml-2 h-4 w-4"/>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Document */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg mb-2">
                  <FileText className="h-5 w-5" /> Step 3: Driving License
                </div>
                <FormField control={form.control} name="doc_number" render={({ field }) => (
                  <FormItem><FormLabel>DL Number</FormLabel><FormControl><Input placeholder="DL-XXXXX" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="exp_date" render={({ field }) => (
                  <FormItem><FormLabel>License Expiry Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back
                  </Button>
                  <Button type="submit" className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Complete Registration"}
                  </Button>
                </div>
              </div>
            )}

          </form>
        </Form>
      </CardContent>
    </Card>
  </div>
);
}