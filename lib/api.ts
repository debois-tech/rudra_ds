// Centralized API functions for Rudra Driving School (Multi-Tenant)
// RLS handles tenant scoping automatically on SELECT/UPDATE/DELETE.
// For INSERT, we must include org_id in the payload.

import { createSupabaseBrowser } from './supabase';
import { getCurrentProfile } from './auth';
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

// Helper to get the current user's org_id.
// NOTE: No module-level caching here — a stale cache could leak one user's
// org_id into another user's session if they share the same browser tab.
// getCurrentProfile() uses the live Supabase auth session, which is safe.
async function getOrgId(): Promise<string> {
    const profile = await getCurrentProfile();
    if (!profile?.org_id) throw new Error('No organization found. Please contact your administrator.');
    return profile.org_id;
}

function getClient() {
    return createSupabaseBrowser();
}

// =============================================
// CUSTOMER OPERATIONS
// =============================================

export const customerApi = {
    async getAll(): Promise<CustomerDashboardView[]> {
        const supabase = getClient();
        // RLS automatically filters by user's org_id
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Customer | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('c_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async getByIdWithStats(id: string): Promise<CustomerDashboardView | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .eq('c_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async create(customer: CustomerFormData): Promise<Customer> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const payload = {
            c_name: customer.c_name,
            c_mobile: customer.c_mobile,
            c_whatsapp: customer.c_whatsapp || null,
            c_email: customer.c_email || null,
            c_address: customer.c_address || null,
            c_dob: customer.c_dob || null,
            org_id: orgId,
        };
        const { data, error } = await supabase
            .from('customers')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id: string, customer: CustomerFormData): Promise<Customer> {
        const supabase = getClient();
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

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('customers').delete().eq('c_id', id);
        if (error) throw error;
    },

    async search(query: string): Promise<CustomerDashboardView[]> {
        const supabase = getClient();
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
    async getAll(): Promise<VehicleWithOwner[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('vehicles')
            .select(`*, customers(c_name, c_mobile)`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getByOwner(ownerId: string): Promise<Vehicle[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<VehicleWithOwner | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('vehicles')
            .select(`*, customers(c_name, c_mobile)`)
            .eq('v_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async create(vehicle: VehicleFormData): Promise<Vehicle> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data, error } = await supabase
            .from('vehicles')
            .insert([{
                owner_id: vehicle.owner_id,
                v_number: vehicle.v_number.toUpperCase(),
                v_name: vehicle.v_name || null,
                v_type: vehicle.v_type || 'car',
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id: string, vehicle: VehicleFormData): Promise<Vehicle> {
        const supabase = getClient();
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

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('vehicles').delete().eq('v_id', id);
        if (error) throw error;
    },
};

// =============================================
// DOCUMENT OPERATIONS
// =============================================

export const documentApi = {
    async getAll(): Promise<DocumentFullView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .order('days_left', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getExpiring(withinDays: number = 30): Promise<DocumentFullView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .lte('days_left', withinDays)
            .gte('days_left', -30)
            .order('days_left', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getByEntity(entityType: 'customer' | 'vehicle', entityId: string): Promise<DocumentFullView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('days_left', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getByCustomer(customerId: string): Promise<DocumentFullView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .eq('customer_id', customerId)
            .order('days_left', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<DocumentFullView | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_documents_full')
            .select('*')
            .eq('doc_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async create(doc: DocumentFormData): Promise<Document> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data, error } = await supabase
            .from('documents')
            .insert([{
                doc_type_id: doc.doc_type_id,
                entity_type: doc.entity_type,
                entity_id: doc.entity_id,
                doc_number: doc.doc_number || null,
                issue_date: doc.issue_date || null,
                exp_date: doc.exp_date,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id: string, doc: Partial<DocumentFormData>): Promise<Document> {
        const supabase = getClient();
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

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('documents').delete().eq('doc_id', id);
        if (error) throw error;
    },
};

// =============================================
// DOCUMENT TYPES
// =============================================

export const documentTypeApi = {
    async getAll(): Promise<DocumentType[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('document_types')
            .select('*')
            .order('doc_type_name');
        if (error) throw error;
        return data || [];
    },

    async getByEntityType(entityType: 'customer' | 'vehicle'): Promise<DocumentType[]> {
        const supabase = getClient();
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
        const supabase = getClient();
        const { data, error } = await supabase
            .from('notification_logs')
            .select('*')
            .order('sent_at', { ascending: false })
            .limit(100);
        if (error) throw error;
        return data || [];
    },

    async getByDocument(docId: string): Promise<NotificationLog[]> {
        const supabase = getClient();
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
// SETTINGS (per-org)
// =============================================

export const settingsApi = {
    async getNotificationDays(): Promise<number[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'notification_days')
            .single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return (data?.value as number[]) || [30, 15, 7, 3, 1, 0];
    },

    async updateNotificationDays(days: number[]): Promise<void> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'notification_days',
                value: days,
                org_id: orgId,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key,org_id' });
        if (error) throw error;
    },

    async isNotificationEnabled(): Promise<boolean> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'notification_enabled')
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data?.value === true || data?.value === 'true';
    },

    async setNotificationEnabled(enabled: boolean): Promise<void> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'notification_enabled',
                value: enabled,
                org_id: orgId,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key,org_id' });
        if (error) throw error;
    },
};

// =============================================
// DASHBOARD STATS
// =============================================

export const dashboardApi = {
    async getStats(): Promise<DashboardStats> {
        const supabase = getClient();
        // RLS automatically scopes counts to user's org
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
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_customer_dashboard')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    async getUpcomingExpirations(limit: number = 10): Promise<DocumentFullView[]> {
        const supabase = getClient();
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
