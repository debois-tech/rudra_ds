'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  User, Car, FileText, Plus, Trash2, 
  Loader2, CheckCircle2, ArrowRight, ArrowLeft, Info 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

export default function ComprehensiveQuickAdd() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const router = useRouter();

  // Fetch classifications from DBA reference table
  useEffect(() => {
    async function loadMeta() {
      const { data } = await supabase.from('document_types').select('*');
      if (data) setDocTypes(data);
    }
    loadMeta();
  }, []);

  const personDocTypes = docTypes.filter(t => t.entity_type === 'person');
  const vehicleDocTypes = docTypes.filter(t => t.entity_type === 'vehicle');

  const form = useForm({
    defaultValues: {
      p_name: "",
      p_mobile: "",
      personDocs: [{ doc_type_id: "", doc_number: "", exp_date: "" }],
      vehicles: [
        { v_number: "", v_name: "", documents: [{ doc_type_id: "", doc_number: "", exp_date: "" }] }
      ]
    }
  });

  const { fields: vehicleFields, append: appendVehicle, remove: removeVehicle } = useFieldArray({
    control: form.control,
    name: "vehicles"
  });

  async function onSubmit(values: any) {
    setLoading(true);
    try {
      // 1. Create Person record
      const { data: person, error: pError } = await supabase
        .from('persons')
        .insert([{ p_name: values.p_name, p_mobile: values.p_mobile }])
        .select().single();
      if (pError) throw pError;

      // 2. Insert Personal Docs (e.g., Driving License)
      const pDocs = values.personDocs.filter((d: any) => d.doc_type_id).map((d: any) => ({
        entity_id: person.p_id,
        entity_type: 'person',
        doc_type_id: parseInt(d.doc_type_id),
        doc_number: d.doc_number,
        exp_date: d.exp_date
      }));
      if (pDocs.length > 0) await supabase.from('documents').insert(pDocs);

      // 3. Process Vehicles and their specific Docs
      for (const v of values.vehicles) {
        if (!v.v_number) continue;
        const { data: vehicle, error: vError } = await supabase
          .from('vehicles')
          .insert([{ p_id: person.p_id, v_number: v.v_number.toUpperCase(), v_name: v.v_name, v_type: 'car' }])
          .select().single();
        if (vError) throw vError;

        const vDocs = v.documents.filter((d: any) => d.doc_type_id).map((d: any) => ({
          entity_id: vehicle.v_id,
          entity_type: 'vehicle',
          doc_type_id: parseInt(d.doc_type_id),
          doc_number: d.doc_number,
          exp_date: d.exp_date
        }));
        if (vDocs.length > 0) await supabase.from('documents').insert(vDocs);
      }

      toast.success("Client onboarded with full document compliance!");
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Compliance Onboarding</h1>
        <p className="text-slate-500">DBA Optimized: Multi-entity data entry for Rudra Driving School.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* STEP 1: IDENTITY & PERSONAL DOCS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="border-t-4 border-t-blue-600 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-blue-700 font-bold mb-6 text-lg">
                    <User className="h-5 w-5" /> 1. Student Identity
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="p_name" render={({ field }) => (
                      <FormItem><FormLabel>Full Legal Name</FormLabel><FormControl><Input placeholder="Omkar Kokane" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="p_mobile" render={({ field }) => (
                      <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="9876543210" maxLength={10} {...field} /></FormControl></FormItem>
                    )} />
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-sm font-semibold text-slate-600 flex items-center gap-2 mb-4"><FileText className="h-4 w-4"/> Personal Documents (License, etc.)</p>
                    {form.watch(`personDocs`).map((_, dIndex) => (
                      <div key={dIndex} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4 bg-slate-50 p-3 rounded-lg">
                        <FormField control={form.control} name={`personDocs.${dIndex}.doc_type_id`} render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Type</FormLabel>
                            <select {...field} className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm">
                              <option value="">Select</option>
                              {personDocTypes.map(t => <option key={t.doc_type_id} value={t.doc_type_id}>{t.doc_type_name}</option>)}
                            </select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`personDocs.${dIndex}.doc_number`} render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Number</FormLabel><FormControl><Input className="h-9 bg-white" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name={`personDocs.${dIndex}.exp_date`} render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Expiry</FormLabel><FormControl><Input type="date" className="h-9 bg-white" {...field} /></FormControl></FormItem>
                        )} />
                        <Button type="button" variant="ghost" className="text-red-500 h-9" onClick={() => {
                          const current = form.getValues('personDocs');
                          if(current.length > 1) form.setValue('personDocs', current.filter((_, i) => i !== dIndex));
                        }}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" className="text-blue-600" onClick={() => form.setValue('personDocs', [...form.getValues('personDocs'), { doc_type_id: "", doc_number: "", exp_date: "" }])}>+ Add Document</Button>
                  </div>
                </CardContent>
              </Card>
              <Button type="button" className="w-full h-12 text-lg bg-slate-900" onClick={() => setStep(2)}>Next: Register Vehicles <ArrowRight className="ml-2 h-5 w-5"/></Button>
            </div>
          )}

          {/* STEP 2: ASSETS & COMPLIANCE */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {vehicleFields.map((vField, vIndex) => (
                <Card key={vField.id} className="border-t-4 border-t-emerald-600 shadow-sm overflow-hidden">
                  <div className="bg-emerald-50 px-6 py-3 flex justify-between items-center border-b border-emerald-100">
                    <h3 className="font-bold text-emerald-800 flex items-center gap-2"><Car className="h-5 w-5"/> Vehicle #{vIndex + 1}</h3>
                    {vIndex > 0 && <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeVehicle(vIndex)}><Trash2 className="h-4 w-4"/></Button>}
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <FormField control={form.control} name={`vehicles.${vIndex}.v_number`} render={({ field }) => (
                        <FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input placeholder="MH15AB1234" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name={`vehicles.${vIndex}.v_name`} render={({ field }) => (
                        <FormItem><FormLabel>Model / Name</FormLabel><FormControl><Input placeholder="Swift" {...field} /></FormControl></FormItem>
                      )} />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Info className="h-4 w-4 text-emerald-600"/> Compliance Documents (PUC, Insurance, etc.)</p>
                      {form.watch(`vehicles.${vIndex}.documents`).map((_, dIndex) => (
                        <div key={dIndex} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end pb-4 border-b border-slate-200 last:border-0">
                          <FormField control={form.control} name={`vehicles.${vIndex}.documents.${dIndex}.doc_type_id`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Classification</FormLabel>
                              <select {...field} className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm">
                                <option value="">Select Type</option>
                                {vehicleDocTypes.map(t => <option key={t.doc_type_id} value={t.doc_type_id}>{t.doc_type_name}</option>)}
                              </select>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`vehicles.${vIndex}.documents.${dIndex}.doc_number`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Document No.</FormLabel><FormControl><Input className="h-9 bg-white" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`vehicles.${vIndex}.documents.${dIndex}.exp_date`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Expiry Date</FormLabel><FormControl><Input type="date" className="h-9 bg-white" {...field} /></FormControl></FormItem>
                          )} />
                          <Button type="button" variant="ghost" className="text-red-500 h-9" onClick={() => {
                            const current = form.getValues(`vehicles.${vIndex}.documents`);
                            if(current.length > 1) form.setValue(`vehicles.${vIndex}.documents`, current.filter((_, i) => i !== dIndex));
                          }}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" className="w-full bg-white border-dashed text-emerald-700" onClick={() => {
                        const current = form.getValues(`vehicles.${vIndex}.documents`);
                        form.setValue(`vehicles.${vIndex}.documents`, [...current, { doc_type_id: "", doc_number: "", exp_date: "" }]);
                      }}>+ Add Compliance Doc</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button type="button" variant="outline" className="w-full h-14 border-2 border-dashed border-slate-300 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-all" onClick={() => appendVehicle({ v_number: "", v_name: "", documents: [{ doc_type_id: "", doc_number: "", exp_date: "" }] })}>
                <Plus className="mr-2 h-5 w-5"/> Add Another Vehicle for this Student
              </Button>

              <div className="flex gap-4 pt-8">
                <Button type="button" variant="ghost" size="lg" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-5 w-5"/> Back to Identity</Button>
                <Button type="submit" size="lg" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-lg shadow-lg" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2 h-5 w-5"/>}
                  Finalize & Sync Records
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}