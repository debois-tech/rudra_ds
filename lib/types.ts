// TypeScript types for MotoAdmin Service Platform (Multi-Tenant)

// =============================================
// MULTI-TENANT TYPES
// =============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  org_id: string | null;
  role: 'super_admin' | 'user';
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// CUSTOMER TYPES
// =============================================

export interface Customer {
  c_id: string;
  c_name: string;
  c_mobile: string;
  c_whatsapp: string | null;
  c_email: string | null;
  c_address: string | null;
  c_dob: string | null;
  c_registration_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  c_name: string;
  c_mobile: string;
  c_whatsapp?: string;
  c_email?: string;
  c_address?: string;
  c_dob?: string;
}

export interface CustomerDashboardView {
  c_id: string;
  c_name: string;
  c_mobile: string;
  c_whatsapp: string | null;
  c_email: string | null;
  c_address: string | null;
  c_dob: string | null;
  c_registration_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  vehicle_count: number;
  service_count: number;
  total_revenue: number;
}

// =============================================
// VEHICLE TYPES
// =============================================

export interface Vehicle {
  v_id: string;
  owner_id: string;
  v_number: string;
  v_name: string | null;
  v_type: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleWithOwner extends Vehicle {
  customers: {
    c_name: string;
    c_mobile: string;
  };
}

export interface VehicleFormData {
  owner_id: string;
  v_number: string;
  v_name?: string;
  v_type?: string;
}

// Inline vehicle data for adding during customer creation
export interface InlineVehicleData {
  v_number: string;
  v_name?: string;
  v_type?: string;
}

// =============================================
// SERVICE TYPES
// =============================================

export type ServiceCategory = 'vehicle' | 'licence';
export type ServiceStatus = 'active' | 'completed' | 'cancelled';

export type VehicleClass = 'NT' | 'Transport' | 'Conductor';

export type VehicleTypeLicence =
  | '3W-TR' | 'Others' | 'MCWOG' | 'MCWG' | 'LMV'
  | 'TRACTOR' | 'FLIFT' | 'LDRXCV' | 'INVCGZ'
  | 'TRANS' | 'PSVBUS' | 'CNEQP' | 'LMV-TR' | 'CONDUCTOR';

export interface ServiceType {
  st_id: number;
  category: ServiceCategory;
  name: string;
  org_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  s_id: string;
  customer_id: string;
  service_type_id: number;
  category: ServiceCategory;
  // Vehicle service fields
  vehicle_id: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  // Licence service fields
  vehicle_class: VehicleClass | null;
  vehicle_type_licence: VehicleTypeLicence | null;
  mdl_number: string | null;
  renewal_date: string | null;
  // Common
  issue_date: string;
  expiry_date: string | null;
  total_cost: number;
  status: ServiceStatus;
  notes: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceOverview extends Service {
  service_name: string;
  service_category: ServiceCategory;
  customer_name: string;
  customer_mobile: string;
}

export interface VehicleServiceFormData {
  customer_id: string;
  service_type_id: number;
  vehicle_id?: string;
  vehicle_type: string;
  vehicle_number: string;
  issue_date: string;
  expiry_date?: string;
  total_cost: number;
  notes?: string;
}

export interface LicenceServiceFormData {
  customer_id: string;
  service_type_id: number;
  vehicle_class: VehicleClass;
  vehicle_type_licence: VehicleTypeLicence;
  mdl_number?: string;
  renewal_date?: string;
  issue_date: string;
  expiry_date?: string;
  total_cost: number;
  notes?: string;
}

// =============================================
// UTILITY TYPES
// =============================================

export type UserRole = 'super_admin' | 'user';

export interface DashboardStats {
  totalCustomers: number;
  totalVehicles: number;
  totalServices: number;
  totalRevenue: number;
}
