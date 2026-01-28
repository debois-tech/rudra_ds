'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Car, AlertCircle, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    students: 0,
    vehicles: 0,
    expiringSoon: 0,
  });

  useEffect(() => {
    async function getStats() {
      const { count: sCount } = await supabase.from('persons').select('*', { count: 'exact', head: true });
      const { count: vCount } = await supabase.from('vehicles').select('*', { count: 'exact', head: true });
      const { data: dData } = await supabase.from('v_documents_full').select('*').lte('days_left', 30).gte('days_left', 0);

      setStats({
        students: sCount || 0,
        vehicles: vCount || 0,
        expiringSoon: dData?.length || 0,
      });
    }
    getStats();
  }, []);

  const cards = [
    { title: "Total Students", value: stats.students, icon: Users, color: "text-blue-600" },
    { title: "Registered Vehicles", value: stats.vehicles, icon: Car, color: "text-orange-600" },
    { title: "Expiring (30 Days)", value: stats.expiringSoon, icon: AlertCircle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, Rudra Driving School</h1>
        <p className="text-slate-500 mt-1">Here is what is happening with your students today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* You can add a 'Recent Activity' or 'Quick Links' section here later */}
    </div>
  );
}