// Centralized API functions for MotoAdmin Service Platform (Multi-Tenant)
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
    InlineVehicleData,
    ServiceType,
    Service,
    ServiceOverview,
    VehicleServiceFormData,
    LicenceServiceFormData,
    DashboardStats,
} from './types';

// Helper to get the current user's org_id
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
            .from('services')
            .insert([{
                customer_id: formData.customer_id,
                service_type_id: formData.service_type_id,
                category: 'vehicle' as const,
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
            .from('services')
            .insert([{
                customer_id: formData.customer_id,
                service_type_id: formData.service_type_id,
                category: 'licence' as const,
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

    async updateStatus(id: string, status: 'active' | 'completed' | 'cancelled'): Promise<Service> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('services')
            .update({ status })
            .eq('s_id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('services').delete().eq('s_id', id);
        if (error) throw error;
    },
};

// =============================================
// DASHBOARD STATS
// =============================================

export const dashboardApi = {
    async getStats(): Promise<DashboardStats> {
        const supabase = getClient();
        const [customersRes, vehiclesRes, servicesRes, revenueRes] = await Promise.all([
            supabase.from('customers').select('*', { count: 'exact', head: true }),
            supabase.from('vehicles').select('*', { count: 'exact', head: true }),
            supabase.from('services').select('*', { count: 'exact', head: true }),
            supabase.from('services').select('total_cost'),
        ]);

        const totalRevenue = (revenueRes.data || []).reduce(
            (sum, row) => sum + (Number(row.total_cost) || 0), 0
        );

        return {
            totalCustomers: customersRes.count || 0,
            totalVehicles: vehiclesRes.count || 0,
            totalServices: servicesRes.count || 0,
            totalRevenue,
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
};
