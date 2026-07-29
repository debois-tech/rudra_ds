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

// =============================================
// ANALYTICAL DASHBOARD TYPES
// =============================================

export interface ExpiringDocument {
  s_id: string;
  customer_name: string;
  customer_id: string;
  service_name: string;
  category: ServiceCategory;
  expiry_date: string;
  days_remaining: number;
  vehicle_number: string | null;
}

export interface ServiceBreakdown {
  category: string;
  count: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

// =============================================
// DRIVING SCHOOL TYPES
// =============================================

export type DsInstructorStatus = 'active' | 'inactive';
export type DsVehicleType = 'car' | 'bike' | 'truck' | 'other';
export type DsVehicleStatus = 'available' | 'in_use' | 'maintenance';
export type DsCourseType = 'LMV' | 'MCWG' | 'MCWOG' | 'HMV' | 'LMV-TR' | 'HMV-TR' | 'OTHER';
export type DsStudentStatus = 'active' | 'completed' | 'dropped';
export type DsPaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'other';
export type DsLogStatus = 'in_use' | 'completed';

// Instructor
export interface DsInstructor {
  id: string;
  name: string;
  phone: string;
  licence_no: string | null;
  photo_url: string | null;
  is_active: boolean;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface DsInstructorFormData {
  name: string;
  phone: string;
  licence_no?: string;
  photo_url?: string;
  is_active?: boolean;
}

// Fleet Vehicle
export interface DsFleetVehicle {
  id: string;
  v_number: string;
  v_name: string | null;
  v_type: string;
  is_active: boolean;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface DsFleetVehicleFormData {
  v_number: string;
  v_name?: string;
  v_type?: string;
  is_active?: boolean;
}

// Driving Log
export interface DsDrivingLog {
  id: string;
  logging_date: string;
  instructor_id: string;
  vehicle_id: string;
  start_datetime: string;
  end_datetime: string | null;
  notes: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface DsDrivingLogFormData {
  logging_date: string;
  instructor_id: string;
  vehicle_id: string;
  start_datetime?: string;
  notes?: string;
}

export interface DsDrivingLogView {
  id: string;
  logging_date: string;
  instructor_id: string;
  instructor_name: string;
  instructor_phone: string;
  vehicle_id: string;
  vehicle_number: string;
  vehicle_name: string | null;
  start_datetime: string;
  end_datetime: string | null;
  status: DsLogStatus;
  notes: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

// Student
export interface DsStudent {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  dob: string | null;
  enrollment_date: string;
  course_type: string;
  total_fee: number;
  status: DsStudentStatus;
  notes: string | null;
  customer_id: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface DsStudentFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dob?: string;
  enrollment_date?: string;
  course_type?: string;
  total_fee?: number;
  status?: DsStudentStatus;
  notes?: string;
  customer_id?: string;
}

export interface DsStudentDashboardView {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  dob: string | null;
  enrollment_date: string;
  course_type: string;
  total_fee: number;
  status: DsStudentStatus;
  notes: string | null;
  customer_id: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
  total_paid: number;
  pending_balance: number;
  attendance_count: number;
}

// Fee Payment
export interface DsFeePayment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_mode: DsPaymentMode;
  note: string | null;
  org_id: string;
  created_at: string;
}

export interface DsFeePaymentFormData {
  student_id: string;
  amount: number;
  payment_date?: string;
  payment_mode?: string;
  note?: string;
}

// Attendance
export interface DsAttendance {
  id: string;
  attendance_date: string;
  student_id: string;
  instructor_id: string;
  vehicle_id: string | null;
  driving_log_id: string | null;
  notes: string | null;
  org_id: string;
  created_at: string;
}

export interface DsAttendanceFormData {
  attendance_date?: string;
  student_id: string;
  instructor_id: string;
  notes?: string;
}

export interface DsAttendanceView {
  id: string;
  attendance_date: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  instructor_id: string;
  instructor_name: string;
  vehicle_id: string | null;
  vehicle_number: string | null;
  driving_log_date: string | null;
  notes: string | null;
  org_id: string;
  created_at: string;
}

// Dashboard
export interface DsDashboardStats {
  activeLogsToday: number;
  activeStudents: number;
  feeCollectionThisMonth: number;
  pendingFeesTotal: number;
}
