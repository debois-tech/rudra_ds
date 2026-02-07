// TypeScript types for Rudra Driving School Database

// =============================================
// DATABASE TABLE TYPES
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

export interface Vehicle {
  v_id: string;
  owner_id: string;
  v_number: string;
  v_name: string | null;
  v_type: string;
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

export interface DocumentType {
  doc_type_id: number;
  doc_type_name: string;
  entity_type: 'customer' | 'vehicle';
  default_validity_days: number;
}

export interface Document {
  doc_id: string;
  doc_type_id: number;
  entity_type: 'customer' | 'vehicle';
  entity_id: string;
  doc_number: string | null;
  issue_date: string | null;
  exp_date: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentFormData {
  doc_type_id: number;
  entity_type: 'customer' | 'vehicle';
  entity_id: string;
  doc_number?: string;
  issue_date?: string;
  exp_date: string;
}

export interface NotificationLog {
  log_id: string;
  doc_id: string;
  customer_id: string;
  days_before: number;
  status: string;
  whatsapp_message_id: string | null;
  sent_at: string;
}

export interface AppSetting {
  key: string;
  value: unknown;
  updated_at: string;
}

// =============================================
// VIEW TYPES
// =============================================

export interface DocumentFullView {
  doc_id: string;
  doc_type_id: number;
  doc_type_name: string;
  entity_type: 'customer' | 'vehicle';
  entity_id: string;
  doc_number: string | null;
  issue_date: string | null;
  exp_date: string;
  days_left: number;
  status: 'expired' | 'critical' | 'warning' | 'valid';
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  customer_whatsapp: string;
  vehicle_number: string | null;
  vehicle_name: string | null;
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
  created_at: string;
  updated_at: string;
  vehicle_count: number;
  personal_doc_count: number;
  vehicle_doc_count: number;
  expiring_soon_count: number;
}

// =============================================
// UTILITY TYPES
// =============================================

export type EntityType = 'customer' | 'vehicle';

export type DocumentStatus = 'expired' | 'critical' | 'warning' | 'valid';

export interface DashboardStats {
  totalCustomers: number;
  totalVehicles: number;
  totalDocuments: number;
  expiringSoon: number;
}
