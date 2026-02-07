'use client';

import { useEffect, useState } from 'react';
import { settingsApi, notificationApi } from '@/lib/api';
import type { NotificationLog } from '@/lib/types';
import { Settings, Bell, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from 'date-fns';

export default function SettingsPage() {
    const [notificationDays, setNotificationDays] = useState<number[]>([]);
    const [notificationEnabled, setNotificationEnabled] = useState(false);
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSettings() {
            try {
                const [days, enabled, logsData] = await Promise.all([
                    settingsApi.getNotificationDays(),
                    settingsApi.isNotificationEnabled(),
                    notificationApi.getAll(),
                ]);
                setNotificationDays(days);
                setNotificationEnabled(enabled);
                setLogs(logsData);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                toast.error("Error loading settings: " + message);
            }
            setLoading(false);
        }
        loadSettings();
    }, []);

    const handleToggleNotifications = async (enabled: boolean) => {
        try {
            await settingsApi.setNotificationEnabled(enabled);
            setNotificationEnabled(enabled);
            toast.success(enabled ? "Notifications enabled" : "Notifications disabled");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error("Error updating setting: " + message);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="h-8 w-8" />
                    Settings
                </h1>
                <p className="text-slate-500 mt-1">Configure application settings and view notification logs.</p>
            </div>

            {/* WhatsApp Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        WhatsApp Notifications
                    </CardTitle>
                    <CardDescription>
                        Automated reminders are sent via WhatsApp Business API using GitHub Actions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <Label htmlFor="notification-toggle" className="text-base font-medium">
                                Enable Notifications
                            </Label>
                            <p className="text-sm text-slate-500">
                                Toggle to enable/disable automated WhatsApp notifications.
                            </p>
                        </div>
                        <Switch
                            id="notification-toggle"
                            checked={notificationEnabled}
                            onCheckedChange={handleToggleNotifications}
                            disabled={loading}
                        />
                    </div>

                    {/* Notification Days */}
                    <div className="p-4 rounded-lg border">
                        <Label className="text-base font-medium">Notification Schedule</Label>
                        <p className="text-sm text-slate-500 mb-3">
                            Reminders are sent on these days before document expiry:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {loading ? (
                                <span className="text-slate-400">Loading...</span>
                            ) : (
                                notificationDays.map(day => (
                                    <span
                                        key={day}
                                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                                    >
                                        {day === 0 ? 'On expiry day' : `${day} days before`}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    {/* API Configuration Note */}
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-sm text-slate-600">
                            <strong>Note:</strong> WhatsApp API credentials are configured via environment variables.
                            Make sure <code className="bg-slate-200 px-1 rounded">META_WHATSAPP_TOKEN</code> and
                            <code className="bg-slate-200 px-1 rounded">META_WHATSAPP_PHONE_ID</code> are set in your deployment.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Notification Logs</CardTitle>
                    <CardDescription>Last 100 notifications sent via the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center text-slate-500 py-8">Loading logs...</p>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No notifications sent yet.</p>
                            <p className="text-sm text-slate-400">Logs will appear here once the cron job runs.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {logs.map((log) => (
                                <div
                                    key={log.log_id}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-3">
                                        {log.status === 'sent' ? (
                                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {log.days_before === 0 ? 'Expiry day reminder' : `${log.days_before} day reminder`}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(log.sent_at), 'dd MMM yyyy, hh:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${log.status === 'sent'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {log.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* GitHub Actions Link */}
            <Card>
                <CardHeader>
                    <CardTitle>Cron Job</CardTitle>
                    <CardDescription>Notifications are triggered by GitHub Actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                        <ExternalLink className="h-4 w-4" />
                        View GitHub Actions workflow
                    </a>
                    <p className="text-sm text-slate-500 mt-2">
                        The workflow runs daily at 9:00 AM IST to send document expiry reminders.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
