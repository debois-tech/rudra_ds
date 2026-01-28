'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch data from the 'document_types' table
      const { data, error } = await supabase.from('document_types').select('*');

      if (error) {
        console.error('Error fetching:', error);
        setError(error.message);
      } else {
        setDocTypes(data || []);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen p-24 bg-slate-950 text-white">
      <h1 className="text-4xl font-bold mb-8 text-emerald-400">Rudra DS Connectivity Test</h1>

      {error ? (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded text-red-200">
          Connection Failed: {error}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xl">✅ Connected to Mumbai DB!</p>
          <p className="text-slate-400">Found {docTypes.length} Document Types:</p>
          <ul className="list-disc pl-6 space-y-2">
            {docTypes.map((doc) => (
              <li key={doc.doc_type_id} className="text-lg">
                {doc.doc_type_name} <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">({doc.entity_type})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}