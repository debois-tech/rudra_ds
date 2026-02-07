// Centralized API functions for Rudra Driving School
// This ensures tight coupling between code and database

import { supabase } from './supabase';
import type {
    Customer,
    CustomerFormData,
    CustomerDashboardView,
    Vehicle,
    VehicleWithOwner,
    VehicleFormData,
    Document,
    DocumentFormData,
    DocumentFullView,
    DocumentType,
    NotificationLog,
    DashboardStats,
} from './types';

// =============================================
// CUSTOMER OPERATIONS
// =============================================

export const customerApi = {
    // Get all customers with their stats
    async getAll(): Promise<CustomerDashboardView[]> {
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    // Get single customer by ID
    async getById(id: string): Promise<Customer | null> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('c_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // Get customer with full stats
    async getByIdWithStats(id: string): Promise<CustomerDashboardView | null> {
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .eq('c_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // Create new customer
    async create(customer: CustomerFormData): Promise<Customer> {
        const payload = {
            c_name: customer.c_name,
            c_mobile: customer.c_mobile,
            c_whatsapp: customer.c_whatsapp || null,
            c_email: customer.c_email || null,
            c_address: customer.c_address || null,
            c_dob: customer.c_dob || null,
        };
        const { data, error } = await supabase
            .from('customers')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Update customer
    async update(id: string, customer: CustomerFormData): Promise<Customer> {
        const payload = {
            c_name: customer.c_name,
            c_mobile: customer.c_mobile,
            c_whatsapp: customer.c_whatsapp || null,
            c_email: customer.c_email || null,
            c_address: customer.c_address || null,
            c_dob: customer.c_dob || null,
        };
        const { data, error } = await supabase
            .from('customers')
            .update(payload)
            .eq('c_id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Delete customer
    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('customers').delete().eq('c_id', id);
        if (error) throw error;
    },

    // Search customers
    async search(query: string): Promise<CustomerDashboardView[]> {
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .or(`c_name.ilike.%${query}%,c_mobile.ilike.%${query}%,c_registration_id.ilike.%${query}%`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
};

// =============================================
// VEHICLE OPERATIONS
// =============================================

export const vehicleApi = {
    // Get all vehicles with owner info
    async getAll(): Promise<VehicleWithOwner[]> {
        const { data, error } = await supabase
            .from('vehicles')
            .select(`*, customers(c_name, c_mobile)`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    // Get vehicles by owner
    async getByOwner(ownerId: string): Promise<Vehicle[]> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    // Get single vehicle
    async getById(id: string): Promise<VehicleWithOwner | null> {
        const { data, error } = await supabase
            .from('vehicles')
            .select(`*, customers(c_name, c_mobile)`)
            .eq('v_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // Create vehicle
    async create(vehicle: VehicleFormData): Promise<Vehicle> {
        const { data, error } = await supabase
            .from('vehicles')
            .insert([{
                owner_id: vehicle.owner_id,
                v_number: vehicle.v_number.toUpperCase(),
                v_name: vehicle.v_name || null,
                v_type: vehicle.v_type || 'car',
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Update vehicle
    async update(id: string, vehicle: VehicleFormData): Promise<Vehicle> {
        const { data, error } = await supabase
            .from('vehicles')
            .update({
                owner_id: vehicle.owner_id,
                v_number: vehicle.v_number.toUpperCase(),
                v_name: vehicle.v_name || null,
                v_type: vehicle.v_type || 'car',
            })
            .eq('v_id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Delete vehicle
    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('vehicles').delete().eq('v_id', id);
        if (error) throw error;
    },
};

// =============================================
// DOCUMENT OPERATIONS
// =============================================

export const documentApi = {
    // Get all documents with full info
    async getAll(): Promise<DocumentFullView[]> {
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .order('days_left', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    // Get expiring documents (within X days)
    async getExpiring(withinDays: number = 30): Promise<DocumentFullView[]> {
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .lte('days_left', withinDays)
            .gte('days_left', -30) // Include expired up to 30 days
            .order('days_left', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    // Get documents by entity
    async getByEntity(entityType: 'customer' | 'vehicle', entityId: string): Promise<DocumentFullView[]> {
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('days_left', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    // Get documents by customer (including their vehicles)
    async getByCustomer(customerId: string): Promise<DocumentFullView[]> {
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .eq('customer_id', customerId)
            .order('days_left', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    // Get single document
    async getById(id: string): Promise<DocumentFullView | null> {
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .eq('doc_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    // Create document
    async create(doc: DocumentFormData): Promise<Document> {
        const { data, error } = await supabase
            .from('documents')
            .insert([{
                doc_type_id: doc.doc_type_id,
                entity_type: doc.entity_type,
                entity_id: doc.entity_id,
                doc_number: doc.doc_number || null,
                issue_date: doc.issue_date || null,
                exp_date: doc.exp_date,
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Update document (for renewals)
    async update(id: string, doc: Partial<DocumentFormData>): Promise<Document> {
        const payload: Record<string, unknown> = {};
        if (doc.doc_number !== undefined) payload.doc_number = doc.doc_number || null;
        if (doc.issue_date !== undefined) payload.issue_date = doc.issue_date || null;
        if (doc.exp_date !== undefined) payload.exp_date = doc.exp_date;

        const { data, error } = await supabase
            .from('documents')
            .update(payload)
            .eq('doc_id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Delete document
    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('documents').delete().eq('doc_id', id);
        if (error) throw error;
    },
};

// =============================================
// DOCUMENT TYPES
// =============================================

export const documentTypeApi = {
    async getAll(): Promise<DocumentType[]> {
        const { data, error } = await supabase
            .from('document_types')
            .select('*')
            .order('doc_type_name');
        if (error) throw error;
        return data || [];
    },

    async getByEntityType(entityType: 'customer' | 'vehicle'): Promise<DocumentType[]> {
        const { data, error } = await supabase
            .from('document_types')
            .select('*')
            .eq('entity_type', entityType)
            .order('doc_type_name');
        if (error) throw error;
        return data || [];
    },
};

// =============================================
// NOTIFICATION LOGS
// =============================================

export const notificationApi = {
    async getAll(): Promise<NotificationLog[]> {
        const { data, error } = await supabase
            .from('notification_logs')
            .select('*')
            .order('sent_at', { ascending: false })
            .limit(100);
        if (error) throw error;
        return data || [];
    },

    async getByDocument(docId: string): Promise<NotificationLog[]> {
        const { data, error } = await supabase
            .from('notification_logs')
            .select('*')
            .eq('doc_id', docId)
            .order('sent_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
};

// =============================================
// SETTINGS
// =============================================

export const settingsApi = {
    async getNotificationDays(): Promise<number[]> {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'notification_days')
            .single();
        if (error) throw error;
        return (data?.value as number[]) || [30, 15, 7, 3, 1, 0];
    },

    async updateNotificationDays(days: number[]): Promise<void> {
        const { error } = await supabase
            .from('app_settings')
            .update({ value: days, updated_at: new Date().toISOString() })
            .eq('key', 'notification_days');
        if (error) throw error;
    },

    async isNotificationEnabled(): Promise<boolean> {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'notification_enabled')
            .single();
        if (error) throw error;
        return data?.value === true || data?.value === 'true';
    },

    async setNotificationEnabled(enabled: boolean): Promise<void> {
        const { error } = await supabase
            .from('app_settings')
            .update({ value: enabled, updated_at: new Date().toISOString() })
            .eq('key', 'notification_enabled');
        if (error) throw error;
    },
};

// =============================================
// DASHBOARD STATS
// =============================================

export const dashboardApi = {
    async getStats(): Promise<DashboardStats> {
        const [customersRes, vehiclesRes, docsRes, expiringRes] = await Promise.all([
            supabase.from('customers').select('*', { count: 'exact', head: true }),
            supabase.from('vehicles').select('*', { count: 'exact', head: true }),
            supabase.from('documents').select('*', { count: 'exact', head: true }),
            supabase.from('v_documents_full').select('*', { count: 'exact', head: true }).lte('days_left', 30).gte('days_left', 0),
        ]);

        return {
            totalCustomers: customersRes.count || 0,
            totalVehicles: vehiclesRes.count || 0,
            totalDocuments: docsRes.count || 0,
            expiringSoon: expiringRes.count || 0,
        };
    },

    async getRecentCustomers(limit: number = 5): Promise<CustomerDashboardView[]> {
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    async getUpcomingExpirations(limit: number = 10): Promise<DocumentFullView[]> {
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .gte('days_left', 0)
            .lte('days_left', 30)
            .order('days_left', { ascending: true })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },
};
