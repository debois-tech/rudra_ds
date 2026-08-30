'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { customerApi } from '@/lib/api';
import type { Customer } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save, User } from 'lucide-react';
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

const formSchema = z.object({
    c_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    c_mobile: z.string().regex(/^[0-9]{10}$/, { message: "Mobile number must be exactly 10 digits." }),
    c_whatsapp: z.string().regex(/^[0-9]{10}$/, { message: "WhatsApp number must be 10 digits." }).optional().or(z.literal('')),
    c_email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    c_address: z.string().optional(),
    c_dob: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [customer, setCustomer] = useState<Customer | null>(null);

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

    useEffect(() => {
        async function fetchCustomer() {
            try {
                const data = await customerApi.getById(customerId);
                if (data) {
                    setCustomer(data);
                    form.reset({
                        c_name: data.c_name,
                        c_mobile: data.c_mobile,
                        c_whatsapp: data.c_whatsapp || "",
                        c_email: data.c_email || "",
                        c_address: data.c_address || "",
                        c_dob: data.c_dob || "",
                    });
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                toast.error("Error loading customer: " + message);
            }
            setFetching(false);
        }
        fetchCustomer();
    }, [customerId, form]);

    async function onSubmit(values: FormData) {
        setLoading(true);
        try {
            await customerApi.update(customerId, {
                c_name: values.c_name,
                c_mobile: values.c_mobile,
                c_whatsapp: values.c_whatsapp || undefined,
                c_email: values.c_email || undefined,
                c_address: values.c_address || undefined,
                c_dob: values.c_dob || undefined,
            });
            toast.success("Customer updated successfully!");
            router.push(`/dashboard/customers/${customerId}`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error("Error updating customer: " + message);
        }
        setLoading(false);
    }

    if (fetching) {
        return (
            <div className="flex items-center justify-center py-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="text-center py-40 bg-white rounded-2xl shadow-sm border border-slate-200">
                <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-700 mb-4">Customer not found</h2>
                <Link href="/dashboard/customers">
                    <Button variant="outline" className="rounded-xl">Back to Customers</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 py-2 border-b border-slate-200 pb-6">
                <Link href={`/dashboard/customers/${customerId}`}>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Customer</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        ID: <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{customer.c_registration_id}</span>
                    </p>
                </div>
            </div>

            <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-amber-600" /> Customer Details
                    </CardTitle>
                    <CardDescription>Update the customer&apos;s information below.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-slate-50/30">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                            <FormField
                                control={form.control}
                                name="c_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Rahul Sharma" className="bg-white rounded-xl focus-visible:ring-amber-200 h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField
                                    control={form.control}
                                    name="c_mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mobile Number <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="9876543210" maxLength={10} className="bg-white rounded-xl focus-visible:ring-amber-200 h-11" {...field} />
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
                                            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">WhatsApp Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Same as mobile if empty" maxLength={10} className="bg-white rounded-xl focus-visible:ring-amber-200 h-11" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-[10px] uppercase font-semibold">Leave empty to use mobile number</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="c_email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="rahul@example.com" type="email" className="bg-white rounded-xl focus-visible:ring-amber-200 h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="c_address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Address</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Full residential address" className="resize-none bg-white rounded-xl focus-visible:ring-amber-200" rows={3} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="c_dob"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date of Birth</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="bg-white rounded-xl focus-visible:ring-amber-200 h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-xl h-10 text-base font-bold shadow-md tracking-wide border border-amber-600/20"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Changes...</>
                                    ) : (
                                        <><Save className="mr-2 h-5 w-5" /> Save Changes</>
                                    )}
                                </Button>
                                <Link href={`/dashboard/customers/${customerId}`}>
                                    <Button type="button" variant="outline" className="h-10 px-8 rounded-xl font-bold">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
