import { createSupabaseBrowser } from './supabase';
import { getCurrentProfile, getOrgId } from './auth';
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
            .eq('logging_date', date)
            .order('start_datetime', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getByDateRange(from: string, to: string): Promise<DsDrivingLogView[]> {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('v_ds_driving_logs')
            .select('*')
            .gte('logging_date', from)
            .lte('logging_date', to)
            .order('logging_date', { ascending: false })
            .order('start_datetime', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    /**
     * Create a new driving log entry.
     */
    async create(data: DsDrivingLogFormData): Promise<DsDrivingLogView> {
        const supabase = getClient();
        const orgId = await getOrgId();

        const startDatetime = data.start_datetime ?? new Date().toISOString();

        const { data: result, error } = await supabase
            .from('ds_driving_logs')
            .insert([{
                logging_date: data.logging_date,
                instructor_id: data.instructor_id,
                vehicle_id: data.vehicle_id,
                start_datetime: startDatetime,
                notes: data.notes || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;

        // Fetch instructor and vehicle in parallel to build the view object
        const [instRes, vehRes] = await Promise.all([
            supabase.from('ds_instructors').select('name, phone').eq('id', data.instructor_id).single(),
            supabase.from('ds_fleet_vehicles').select('v_number, v_name').eq('id', data.vehicle_id).single(),
        ]);

        return {
            id: result.id,
            logging_date: result.logging_date,
            instructor_id: result.instructor_id,
            instructor_name: instRes.data?.name ?? '',
            instructor_phone: instRes.data?.phone ?? '',
            vehicle_id: result.vehicle_id,
            vehicle_number: vehRes.data?.v_number ?? '',
            vehicle_name: vehRes.data?.v_name ?? null,
            start_datetime: result.start_datetime,
            end_datetime: result.end_datetime,
            status: result.end_datetime ? 'completed' : 'in_use',
            notes: result.notes,
            org_id: result.org_id,
            created_at: result.created_at,
            updated_at: result.updated_at,
        } as DsDrivingLogView;
    },

    /** Release / Opt-out a car from an active driving log */
    async release(id: string, endTime?: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase
            .from('ds_driving_logs')
            .update({ end_datetime: endTime || new Date().toISOString() })
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
                completion_date: data.completion_date || null,
                course_type: data.course_type || 'LMV',
                total_fee: data.total_fee ?? 0,
                notes: data.notes || null,
                customer_id: data.customer_id || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    /**
     * Update a student record.
     * FIX: Use partial payload — only send fields present in the form.
     * Use `?? 0` (not `|| 0`) so that 0 fee is not treated as falsy.
     * enrollment_date is intentionally excluded from updates.
     */
    async update(id: string, data: Partial<DsStudentFormData>): Promise<DsStudent> {
        const supabase = getClient();
        const payload: Record<string, unknown> = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.phone !== undefined) payload.phone = data.phone;
        if (data.email !== undefined) payload.email = data.email || null;
        if (data.address !== undefined) payload.address = data.address || null;
        if (data.dob !== undefined) payload.dob = data.dob || null;
        if (data.course_type !== undefined) payload.course_type = data.course_type || 'LMV';
        if (data.total_fee !== undefined) payload.total_fee = data.total_fee ?? 0;
        if (data.notes !== undefined) payload.notes = data.notes || null;
        if (data.status !== undefined) payload.status = data.status;
        if (data.completion_date !== undefined) payload.completion_date = data.completion_date || null;

        const { data: result, error } = await supabase
            .from('ds_students')
            .update(payload)
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
        if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error('Payment must be greater than zero.')
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

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('ds_fee_payments').delete().eq('id', id);
        if (error) throw error;
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

    /**
     * Mark attendance for a single student.
     * Auto-attaches the active driving log (vehicle) for the given instructor if one exists.
     */
    async mark(data: DsAttendanceFormData): Promise<DsAttendance> {
        const supabase = getClient();
        const orgId = await getOrgId();

        // Find the active (not released) driving log for this instructor on this date
        let activeLog = null;
        if (data.instructor_id) {
            const { data: logData } = await supabase
                .from('ds_driving_logs')
                .select('id, vehicle_id')
                .eq('instructor_id', data.instructor_id)
                .eq('logging_date', data.attendance_date || new Date().toISOString().split('T')[0])
                .is('end_datetime', null)
                .order('start_datetime', { ascending: false })
                .limit(1)
                .maybeSingle();
            activeLog = logData;
        }

        const { data: result, error } = await supabase
            .from('ds_attendance')
            .insert([{
                attendance_date: data.attendance_date || new Date().toISOString().split('T')[0],
                student_id: data.student_id,
                instructor_id: data.instructor_id || null,
                vehicle_id: activeLog?.vehicle_id ?? null,
                driving_log_id: activeLog?.id ?? null,
                notes: data.notes || null,
                org_id: orgId,
            }])
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    /**
     * Mark attendance for multiple students at once (batch).
     * Uses the same instructor for all, auto-attaches their active driving log.
     */
    async markBatch(params: {
        attendance_date: string;
        instructor_id?: string;
        student_ids: string[];
        notes?: string;
    }): Promise<{ success: number; skipped: number }> {
        const supabase = getClient();
        const orgId = await getOrgId();

        // Find the active driving log for this instructor on this date
        let activeLog = null;
        if (params.instructor_id) {
            const { data: logData } = await supabase
                .from('ds_driving_logs')
                .select('id, vehicle_id')
                .eq('instructor_id', params.instructor_id)
                .eq('logging_date', params.attendance_date)
                .is('end_datetime', null)
                .order('start_datetime', { ascending: false })
                .limit(1)
                .maybeSingle();
            activeLog = logData;
        }

        const rows = params.student_ids.map(student_id => ({
            attendance_date: params.attendance_date,
            student_id,
            instructor_id: params.instructor_id || null,
            vehicle_id: activeLog?.vehicle_id ?? null,
            driving_log_id: activeLog?.id ?? null,
            notes: params.notes || null,
            org_id: orgId,
        }));

        // Use upsert with onConflict to skip already-marked students gracefully
        const { data: inserted, error } = await supabase
            .from('ds_attendance')
            .upsert(rows, {
                onConflict: 'student_id,attendance_date',
                ignoreDuplicates: true,
            })
            .select();

        if (error) throw error;
        return {
            success: inserted?.length ?? 0,
            skipped: params.student_ids.length - (inserted?.length ?? 0),
        };
    },

    async delete(id: string): Promise<void> {
        const supabase = getClient();
        const { error } = await supabase.from('ds_attendance').delete().eq('id', id);
        if (error) throw error;
    },
};

export const dsDashboardApi = {
    /**
     * Single RPC call — all 4 stats aggregated server-side in one round-trip.
     */
    async getStats(): Promise<DsDashboardStats> {
        const supabase = getClient();
        const orgId = await getOrgId();
        const { data, error } = await supabase.rpc('get_ds_dashboard_stats', { p_org_id: orgId });
        if (error) throw error;
        const result = data as {
            activeLogsToday: number;
            activeStudents: number;
            feeCollectionThisMonth: number;
            pendingFeesTotal: number;
        };
        return {
            activeLogsToday: result.activeLogsToday || 0,
            activeStudents: result.activeStudents || 0,
            feeCollectionThisMonth: result.feeCollectionThisMonth || 0,
            pendingFeesTotal: result.pendingFeesTotal || 0,
        };
    },
};
