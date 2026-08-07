'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface Customer { id: string; email: string; storeId?: string; blocked: boolean; createdAt: string }

export default function SuperCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const r = await api.get('/auth/admin-mgmt/customers');
    setCustomers(r.data.users || []);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const filtered = customers.filter(c => !search || c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Users size={22} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Customers</h1>
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-neutral-400">{filtered.length} customers</p>
        <Input placeholder="Search by email…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-sm w-64" />
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Store ID</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">No customers yet.</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} className={c.blocked ? 'opacity-60 bg-neutral-50' : 'hover:bg-neutral-50/50'}>
                <td className="px-4 py-3 font-medium">{c.email}</td>
                <td className="px-4 py-3 text-xs font-mono text-neutral-400">{c.storeId ? c.storeId.slice(0, 8) + '…' : '—'}</td>
                <td className="px-4 py-3"><Badge variant={c.blocked ? 'secondary' : 'default'}>{c.blocked ? 'BLOCKED' : 'ACTIVE'}</Badge></td>
                <td className="px-4 py-3 text-xs text-neutral-400">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
