// Admin API — Client-side wrapper that calls server-side API routes
// The API routes use the service role key safely on the server
// This file runs in the browser and uses fetch() to call them

import type { Organization, Profile } from './types';

// Helper for JSON fetch with error handling
async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data as T;
}

// =============================================
// ORGANIZATION MANAGEMENT
// =============================================

export const adminOrgApi = {
    async getAll(): Promise<Organization[]> {
        return adminFetch<Organization[]>('/api/admin/organizations');
    },

    async getById(id: string): Promise<{
        organization: Organization;
        users: Profile[];
        stats: { customerCount: number; vehicleCount: number; documentCount: number };
    }> {
        return adminFetch(`/api/admin/organizations/${id}`);
    },

    async create(org: {
        name: string;
        slug: string;
        phone?: string;
        email?: string;
        address?: string;
    }): Promise<Organization> {
        return adminFetch<Organization>('/api/admin/organizations', {
            method: 'POST',
            body: JSON.stringify(org),
        });
    },

    async update(id: string, updates: Partial<Organization>): Promise<Organization> {
        return adminFetch<Organization>('/api/admin/organizations', {
            method: 'PATCH',
            body: JSON.stringify({ id, ...updates }),
        });
    },

    async toggleActive(id: string, isActive: boolean): Promise<Organization> {
        return adminFetch<Organization>('/api/admin/organizations', {
            method: 'PATCH',
            body: JSON.stringify({ id, is_active: isActive }),
        });
    },
};

// =============================================
// USER MANAGEMENT
// =============================================

export const adminUserApi = {
    async getAll(): Promise<(Profile & { org_name?: string })[]> {
        return adminFetch('/api/admin/users');
    },

    async createUser(userData: {
        email: string;
        password: string;
        full_name: string;
        org_id: string;
        role?: 'super_admin' | 'user';
    }): Promise<{ user: { id: string; email: string } }> {
        return adminFetch('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    async deleteUser(userId: string): Promise<void> {
        await adminFetch('/api/admin/users', {
            method: 'DELETE',
            body: JSON.stringify({ userId }),
        });
    },
};

// =============================================
// PLATFORM STATS
// =============================================

export const adminStatsApi = {
    async getPlatformStats(): Promise<{
        totalOrgs: number;
        activeOrgs: number;
        totalUsers: number;
        totalCustomers: number;
        totalDocuments: number;
    }> {
        return adminFetch('/api/admin/stats');
    },
};
