'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { documentApi, documentTypeApi } from '@/lib/api';
import type { DocumentFullView, DocumentType } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { format, addDays } from 'date-fns';

const formSchema = z.object({
    doc_number: z.string().optional(),
    issue_date: z.string().optional(),
    exp_date: z.string().min(10, "Expiry date is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function EditDocumentPage() {
    const router = useRouter();
    const params = useParams();
    const documentId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [document, setDocument] = useState<DocumentFullView | null>(null);
    const [docType, setDocType] = useState<DocumentType | null>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            doc_number: "",
            issue_date: "",
            exp_date: "",
        },
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const doc = await documentApi.getById(documentId);
                if (doc) {
                    setDocument(doc);
                    form.reset({
                        doc_number: doc.doc_number || "",
                        issue_date: doc.issue_date || "",
                        exp_date: doc.exp_date,
                    });

                    // Get doc type for renewal suggestion
                    const types = await documentTypeApi.getAll();
                    const type = types.find(t => t.doc_type_id === doc.doc_type_id);
                    setDocType(type || null);
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                toast.error("Error loading document: " + message);
            }
            setFetching(false);
        }
        fetchData();
    }, [documentId, form]);

    const handleRenew = () => {
        if (!docType) return;
        const today = new Date();
        const newIssueDate = format(today, 'yyyy-MM-dd');
        const newExpDate = format(addDays(today, docType.default_validity_days), 'yyyy-MM-dd');
        form.setValue('issue_date', newIssueDate);
        form.setValue('exp_date', newExpDate);
        toast.info(`Set to renew for ${docType.default_validity_days} days`);
    };

    async function onSubmit(values: FormData) {
        setLoading(true);
        try {
            await documentApi.update(documentId, {
                doc_number: values.doc_number || undefined,
                issue_date: values.issue_date || undefined,
                exp_date: values.exp_date,
            });
            toast.success("Document updated successfully!");
            router.push('/dashboard/documents');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error("Error updating document: " + message);
        }
        setLoading(false);
    }

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500">Loading document...</p>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-slate-500">Document not found.</p>
                <Link href="/dashboard/documents">
                    <Button>Back to Documents</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/documents">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Edit Document</h1>
                    <p className="text-slate-500 text-sm">{document.doc_type_name} - {document.customer_name}</p>
                </div>
            </div>

            {/* Document Info Card */}
            <Card className="bg-slate-50">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500">Document Type</p>
                            <p className="font-medium">{document.doc_type_name}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Belongs To</p>
                            <p className="font-medium">
                                {document.entity_type === 'customer'
                                    ? `${document.customer_name} (Personal)`
                                    : `${document.vehicle_number} - ${document.customer_name}`
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Update Document</CardTitle>
                        <CardDescription>Update dates after renewal.</CardDescription>
                    </div>
                    {docType && (
                        <Button type="button" variant="outline" onClick={handleRenew}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Quick Renew ({docType.default_validity_days} days)
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

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

                            <div className="flex gap-4">
                                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                    ) : (
                                        <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                                    )}
                                </Button>
                                <Link href="/dashboard/documents">
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
