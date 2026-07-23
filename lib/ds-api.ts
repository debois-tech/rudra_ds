import { createSupabaseBrowser } from './supabase';
import { getCurrentProfile } from './auth';
import type {
    DsInstructor,
    DsInstructorFormData,
    DsFleetVehicle,
    DsFleetVehicleFormData,
    DsDrivingLogFormData,
    DsDrivingLogView,
    DsStudent,
    DsStudentFormData,
    DsStudentDashboardView,
    DsFeePayment,
    DsFeePaymentFormData,
    DsAttendance,
    DsAttendanceFormData,
    DsAttendanceView,
    DsDashboardStats,
} from './types';

async function getOrgId(): Promise<string> {
    const profile = await getCurrentProfile();
    if (!profile?.org_id) throw new Error('No organization found. Please contact your administrator.');
    return profile.org_id;
}

function getClient() {
    return createSupabaseBrowser();
}

export const instructorApi = {
    async getAll(): Promise<DsInstructor[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('ds_instructors')
            .select('*')
            .order('name');
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<DsInstructor | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('ds_instructors')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async create(data: DsInstructorFormData): Promise<DsInstructor> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data: result, error } = await supabase
            .from('ds_instructors')
            .insert([{
                name: data.name,
                phone: data.phone,
                licence_no: data.licence_no || null,
                photo_url: data.photo_url || null,
                is_active: data.is_active ?? true,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    async update(id: string, data: DsInstructorFormData): Promise<DsInstructor> {
        const supabase = getClient();
        const payload: Record<string, unknown> = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.phone !== undefined) payload.phone = data.phone;
        if (data.licence_no !== undefined) payload.licence_no = data.licence_no || null;
        if (data.photo_url !== undefined) payload.photo_url = data.photo_url || null;
        if (data.is_active !== undefined) payload.is_active = data.is_active;
        const { data: result, error } = await supabase
            .from('ds_instructors')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('ds_instructors').delete().eq('id', id);
        if (error) throw error;
    },
};

export const fleetVehicleApi = {
    async getAll(): Promise<DsFleetVehicle[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('ds_fleet_vehicles')
            .select('*')
            .order('v_number');
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<DsFleetVehicle | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('ds_fleet_vehicles')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async create(data: DsFleetVehicleFormData): Promise<DsFleetVehicle> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data: result, error } = await supabase
            .from('ds_fleet_vehicles')
            .insert([{
                v_number: data.v_number.toUpperCase(),
                v_name: data.v_name || null,
                v_type: data.v_type || 'car',
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    async update(id: string, data: DsFleetVehicleFormData): Promise<DsFleetVehicle> {
        const supabase = getClient();
        const payload: Record<string, unknown> = {};
        if (data.v_number !== undefined) payload.v_number = data.v_number.toUpperCase();
        if (data.v_name !== undefined) payload.v_name = data.v_name || null;
        if (data.v_type !== undefined) payload.v_type = data.v_type || 'car';
        if (data.is_active !== undefined) payload.is_active = data.is_active;
        const { data: result, error } = await supabase
            .from('ds_fleet_vehicles')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('ds_fleet_vehicles').delete().eq('id', id);
        if (error) throw error;
    },
};

export const drivingLogApi = {
    async getByDate(date: string): Promise<DsDrivingLogView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_ds_driving_logs')
            .select('*')
            .eq('log_date', date)
            .order('opted_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getByDateRange(from: string, to: string): Promise<DsDrivingLogView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_ds_driving_logs')
            .select('*')
            .gte('log_date', from)
            .lte('log_date', to)
            .order('log_date', { ascending: false })
            .order('opted_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async create(data: DsDrivingLogFormData): Promise<DsDrivingLogView> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data: result, error } = await supabase
            .from('ds_driving_logs')
            .insert([{
                log_date: data.log_date,
                instructor_id: data.instructor_id,
                vehicle_id: data.vehicle_id,
                opted_at: data.opted_at || new Date().toISOString(),
                notes: data.notes || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;

        const view = await supabase
            .from('v_ds_driving_logs')
            .select('*')
            .eq('id', result.id)
            .single();
        if (view.error) throw view.error;
        return view.data;
    },

    async release(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase
            .from('ds_driving_logs')
            .update({ released_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    },
};

export const studentApi = {
    async getAll(): Promise<DsStudentDashboardView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_ds_student_dashboard')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<DsStudent | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('ds_students')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async getByIdWithStats(id: string): Promise<DsStudentDashboardView | null> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_ds_student_dashboard')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async search(query: string): Promise<DsStudentDashboardView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_ds_student_dashboard')
            .select('*')
            .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async create(data: DsStudentFormData): Promise<DsStudent> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data: result, error } = await supabase
            .from('ds_students')
            .insert([{
                name: data.name,
                phone: data.phone,
                email: data.email || null,
                address: data.address || null,
                dob: data.dob || null,
                enrollment_date: data.enrollment_date || new Date().toISOString().split('T')[0],
                course_type: data.course_type || 'LMV',
                total_fee: data.total_fee || 0,
                notes: data.notes || null,
                customer_id: data.customer_id || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    async update(id: string, data: DsStudentFormData): Promise<DsStudent> {
        const supabase = getClient();
        const { data: result, error } = await supabase
            .from('ds_students')
            .update({
                name: data.name,
                phone: data.phone,
                email: data.email || null,
                address: data.address || null,
                dob: data.dob || null,
                course_type: data.course_type || 'LMV',
                total_fee: data.total_fee || 0,
                notes: data.notes || null,
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('ds_students').delete().eq('id', id);
        if (error) throw error;
    },
};

export const feePaymentApi = {
    async getByStudent(studentId: string): Promise<DsFeePayment[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('ds_fee_payments')
            .select('*')
            .eq('student_id', studentId)
            .order('payment_date', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async create(data: DsFeePaymentFormData): Promise<DsFeePayment> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data: result, error } = await supabase
            .from('ds_fee_payments')
            .insert([{
                student_id: data.student_id,
                amount: data.amount,
                payment_date: data.payment_date || new Date().toISOString().split('T')[0],
                payment_mode: data.payment_mode || 'cash',
                note: data.note || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return result;
    },
};

export const attendanceApi = {
    async getByDate(date: string): Promise<DsAttendanceView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_ds_attendance')
            .select('*')
            .eq('attendance_date', date)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getByStudent(studentId: string): Promise<DsAttendanceView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_ds_attendance')
            .select('*')
            .eq('student_id', studentId)
            .order('attendance_date', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async mark(data: DsAttendanceFormData): Promise<DsAttendance> {
        const supabase = getClient();
        const orgId = await getOrgId();

        const { data: activeLog, error: logError } = await supabase
            .from('ds_driving_logs')
            .select('id, vehicle_id')
            .eq('instructor_id', data.instructor_id)
            .is('released_at', null)
            .order('opted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (logError) throw logError;

        const { data: result, error } = await supabase
            .from('ds_attendance')
            .insert([{
                attendance_date: data.attendance_date || new Date().toISOString().split('T')[0],
                student_id: data.student_id,
                instructor_id: data.instructor_id,
                vehicle_id: activeLog?.vehicle_id || null,
                driving_log_id: activeLog?.id || null,
                notes: data.notes || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('ds_attendance').delete().eq('id', id);
        if (error) throw error;
    },
};

export const dsDashboardApi = {
    async getStats(): Promise<DsDashboardStats> {
        const supabase = getClient();
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        const [activeLogsRes, activeStudentsRes, feesRes, pendingRes] = await Promise.all([
            supabase.from('ds_driving_logs').select('id', { count: 'exact', head: true })
                .eq('log_date', today).is('released_at', null),
            supabase.from('ds_students').select('id', { count: 'exact', head: true })
                .eq('status', 'active'),
            supabase.from('ds_fee_payments').select('amount')
                .gte('payment_date', monthStart),
            supabase.from('v_ds_student_dashboard').select('pending_balance'),
        ]);

        const feeThisMonth = (feesRes.data || []).reduce(
            (sum, row) => sum + (Number(row.amount) || 0), 0
        );
        const pendingTotal = (pendingRes.data || []).reduce(
            (sum, row) => sum + (Number(row.pending_balance) || 0), 0
        );

        return {
            activeLogsToday: activeLogsRes.count || 0,
            activeStudents: activeStudentsRes.count || 0,
            feeCollectionThisMonth: feeThisMonth,
            pendingFeesTotal: pendingTotal,
        };
    },
};
