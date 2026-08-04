'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Admin { id: string; email: string; status: string; subscription?: { name: string } }

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/platform/admins').then((r) => setAdmins(r.data.admins));
  useEffect(() => { load(); }, []);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.post('/platform/admins', { email });
    setEmail('');
    await load();
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/platform/admins/${id}/status`, { status });
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Admins</h1>
      <Card className="mb-6 max-w-md">
        <CardHeader><CardTitle className="text-base">Add Admin</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createAdmin} className="flex gap-2">
            <Input placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            <Button type="submit" disabled={loading}>Add</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {admins.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <p className="font-medium text-sm">{a.email}</p>
              <p className="text-xs text-neutral-400">{a.subscription?.name ?? 'No plan'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={a.status === 'ACTIVE' ? 'default' : 'secondary'}>{a.status}</Badge>
              {a.status === 'ACTIVE'
                ? <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'SUSPENDED')}>Suspend</Button>
                : <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'ACTIVE')}>Activate</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
