// Centralized API functions for MotoAdmin Service Platform (Multi-Tenant)
// RLS handles tenant scoping automatically on SELECT/UPDATE/DELETE.
// For INSERT, we must include org_id in the payload.

import { createSupabaseBrowser } from './supabase';
import { getCurrentProfile, getOrgId } from './auth';
import type {
    Customer,
    CustomerFormData,
    CustomerDashboardView,
    Vehicle,
    VehicleWithOwner,
    VehicleFormData,
    InlineVehicleData,
    ServiceType,
    Service,
    ServiceStatus,
    ServiceOverview,
    VehicleServiceFormData,
    LicenceServiceFormData,
    DashboardStats,
    ExpiringDocument,
    ServiceBreakdown,
    MonthlyRevenue,
    StatusBreakdown,
} from './types';

function getClient() {
    return createSupabaseBrowser();
}

// =============================================
// CUSTOMER OPERATIONS
// =============================================

export const customerApi = {
    async getAll(): Promise<CustomerDashboardView[]> {
        const supabase = getClient();
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

    async create(customer: CustomerFormData, vehicles?: InlineVehicleData[]): Promise<Customer> {
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

        // Create vehicles if provided
        if (vehicles && vehicles.length > 0) {
            const vehiclePayloads = vehicles.map(v => ({
                owner_id: data.c_id,
                v_number: v.v_number.toUpperCase(),
                v_name: v.v_name || null,
                v_type: v.v_type || 'car',
                org_id: orgId,
            }));
            const { error: vError } = await supabase
                .from('vehicles')
                .insert(vehiclePayloads);
            if (vError) throw vError;
        }

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
// SERVICE TYPE OPERATIONS
// =============================================

export const serviceTypeApi = {
    async getAll(): Promise<ServiceType[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('service_types')
            .select('*')
            .eq('is_active', true)
            .order('name');
        if (error) throw error;
        return data || [];
    },

    async getByCategory(category: 'vehicle' | 'licence'): Promise<ServiceType[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('service_types')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('name');
        if (error) throw error;
        return data || [];
    },
};

// =============================================
// SERVICE OPERATIONS
// =============================================

export const serviceApi = {
    async getAll(): Promise<ServiceOverview[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_services_overview')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getByCustomer(customerId: string): Promise<ServiceOverview[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_services_overview')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<ServiceOverview | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_services_overview')
            .select('*')
            .eq('s_id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async createVehicleService(formData: VehicleServiceFormData): Promise<Service> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data, error } = await supabase
            .from('vehicle_services')
            .insert([{
                customer_id: formData.customer_id,
                service_type_id: formData.service_type_id,
                vehicle_id: formData.vehicle_id || null,
                vehicle_type: formData.vehicle_type,
                vehicle_number: formData.vehicle_number,
                issue_date: formData.issue_date,
                expiry_date: formData.expiry_date || null,
                total_cost: formData.total_cost,
                notes: formData.notes || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async createLicenceService(formData: LicenceServiceFormData): Promise<Service> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data, error } = await supabase
            .from('document_services')
            .insert([{
                customer_id: formData.customer_id,
                service_type_id: formData.service_type_id,
                vehicle_class: formData.vehicle_class,
                vehicle_type_licence: formData.vehicle_type_licence,
                mdl_number: formData.mdl_number || null,
                renewal_date: formData.renewal_date || null,
                issue_date: formData.issue_date,
                expiry_date: formData.expiry_date || null,
                total_cost: formData.total_cost,
                notes: formData.notes || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateStatus(id: string, status: ServiceStatus): Promise<Service> {
        const supabase = getClient();
        const { data: existing, error: lookupError } = await supabase.from('v_services_overview').select('category').eq('s_id', id).single();
        if (lookupError) throw lookupError;
        const { data, error } = await supabase.from(existing.category === 'vehicle' ? 'vehicle_services' : 'document_services').update({ status }).eq('s_id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { data: existing, error: lookupError } = await supabase.from('v_services_overview').select('category').eq('s_id', id).single();
        if (lookupError) throw lookupError;
        const { error } = await supabase.from(existing.category === 'vehicle' ? 'vehicle_services' : 'document_services').delete().eq('s_id', id);
        if (error) throw error;
    },
};

// =============================================
// DASHBOARD STATS
// =============================================

export const dashboardApi = {
    /**
     * Single RPC call returns all dashboard stats, charts, and breakdowns.
     * Replaces 7 separate queries — DB does all aggregation in one round-trip.
     */
    async getAllStats(): Promise<{
        stats: DashboardStats;
        serviceBreakdown: ServiceBreakdown[];
        statusBreakdown: StatusBreakdown[];
        revenueByMonth: MonthlyRevenue[];
    }> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data, error } = await supabase.rpc('get_dashboard_stats', { p_org_id: orgId });
        if (error) throw error;
        const result = data as {
            totalCustomers: number;
            totalVehicles: number;
            totalServices: number;
            totalRevenue: number;
            serviceBreakdown: Array<{ category: string; count: number }> | null;
            statusBreakdown: Array<{ status: string; count: number }> | null;
            revenueByMonth: Array<{ month: string; month_key: string; revenue: number }> | null;
        };
        return {
            stats: {
                totalCustomers: result.totalCustomers || 0,
                totalVehicles: result.totalVehicles || 0,
                totalServices: result.totalServices || 0,
                totalRevenue: result.totalRevenue || 0,
            },
            serviceBreakdown: result.serviceBreakdown || [],
            statusBreakdown: result.statusBreakdown || [],
            revenueByMonth: (result.revenueByMonth || []).map(r => ({ month: r.month, month_key: r.month_key, revenue: r.revenue })),
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

    async getRecentServices(limit: number = 10): Promise<ServiceOverview[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_services_overview')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    /**
     * Get services with expiry dates within the next N days.
     * RLS scopes this to the logged-in user's org automatically.
     */
    async getExpiringDocuments(daysThreshold: number = 15): Promise<ExpiringDocument[]> {
        const supabase = getClient();
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysThreshold);
        const todayStr = today.toISOString().split('T')[0];
        const futureStr = futureDate.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('v_services_overview')
            .select('s_id, customer_id, customer_name, service_name, category, expiry_date, vehicle_number')
            .not('expiry_date', 'is', null)
            .gte('expiry_date', todayStr)
            .lte('expiry_date', futureStr)
            .eq('status', 'active')
            .order('expiry_date', { ascending: true });

        if (error) throw error;

        return (data || []).map((row: {
            s_id: string; customer_id: string; customer_name: string;
            service_name: string; category: 'vehicle' | 'licence';
            expiry_date: string; vehicle_number: string | null;
        }) => {
            const expiry = new Date(row.expiry_date);
            const diffMs = expiry.getTime() - today.getTime();
            const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return { ...row, days_remaining: daysRemaining };
        });
    },
};
