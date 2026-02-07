'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { customerApi } from '@/lib/api';
import type { Customer } from '@/lib/types';
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
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500">Loading customer...</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-slate-500">Customer not found.</p>
                <Link href="/dashboard/customers">
                    <Button>Back to Customers</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/customers/${customerId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Edit Customer</h1>
                    <p className="text-slate-500 text-sm font-mono">{customer.c_registration_id}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customer Details</CardTitle>
                    <CardDescription>Update customer information below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

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
                                            <FormDescription className="text-xs">Used for notifications</FormDescription>
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
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="rahul@example.com" type="email" {...field} />
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
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Full address" className="resize-none" rows={2} {...field} />
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
                                        <FormLabel>Date of Birth</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-4">
                                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                    ) : (
                                        <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                                    )}
                                </Button>
                                <Link href={`/dashboard/customers/${customerId}`}>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
