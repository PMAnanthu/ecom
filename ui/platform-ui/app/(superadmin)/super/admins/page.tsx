'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, KeyRound, Ban, CheckCircle, Users } from 'lucide-react';

interface Admin { id: string; email: string; createdAt: string }
interface PlatformAdmin { id: string; email: string; status: string }
interface AdminRow extends Admin { platformId?: string; status: string }
type Modal = { type: 'pw'; id: string; email: string } | { type: 'create' } | null;

export default function SuperAdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [authRes, platformRes] = await Promise.all([api.get('/auth/admin-mgmt'), api.get('/platform/admins')]);
    const auth: Admin[] = authRes.data.users || [];
    const platform: PlatformAdmin[] = platformRes.data.admins || [];
    const byEmail = new Map(platform.map(p => [p.email, p]));
    setAdmins(auth.map(u => ({ ...u, platformId: byEmail.get(u.email)?.id, status: byEmail.get(u.email)?.status || 'ACTIVE' })));
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const close = () => { setModal(null); setError(''); };

  const create = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await api.post('/auth/admin-mgmt', { email: form.email, password: form.password });
      setForm({ email: '', password: '' }); close(); await load(); flash('Admin created');
    } catch (err: unknown) { setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const toggleSuspend = async (a: AdminRow) => {
    if (!a.platformId) return;
    const s = a.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await api.patch(`/platform/admins/${a.platformId}/status`, { status: s });
    await load(); flash(`${a.email} ${s === 'ACTIVE' ? 'activated' : 'suspended'}`);
  };

  const del = async (a: AdminRow) => {
    if (!confirm(`Delete ${a.email}?`)) return;
    await api.delete(`/auth/admin-mgmt/${a.id}`); await load(); flash('Deleted');
  };

  const changePw = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      if (modal?.type === 'pw') await api.patch(`/auth/admin-mgmt/${modal.id}/password`, { password: pwForm.newPw });
      close(); flash('Password changed');
    } catch (err: unknown) { setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const filtered = admins.filter(a => !search || a.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Users size={22} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Admins</h1>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {msg && <span className="text-sm text-green-600">{msg}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-sm w-56" />
          <Button size="sm" onClick={() => { setForm({ email: '', password: '' }); setModal({ type: 'create' }); setError(''); }}>+ Add Admin</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">No admins yet.</td></tr>}
            {filtered.map(a => {
              const suspended = a.status === 'SUSPENDED';
              return (
                <tr key={a.id} className={suspended ? 'opacity-60 bg-neutral-50' : 'hover:bg-neutral-50/50'}>
                  <td className="px-4 py-3 font-medium">{a.email}</td>
                  <td className="px-4 py-3"><Badge variant={suspended ? 'secondary' : 'default'}>{a.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-neutral-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { setModal({ type: 'pw', id: a.id, email: a.email }); setPwForm({ current: '', newPw: '', confirm: '' }); setError(''); }}><KeyRound size={12} /></Button>
                      <Button size="sm" variant={suspended ? 'default' : 'outline'} className="h-7 px-2" onClick={() => toggleSuspend(a)}>{suspended ? <CheckCircle size={12} /> : <Ban size={12} />}</Button>
                      <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => del(a)}><Trash2 size={12} /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal?.type === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader><CardTitle className="text-base">Add Admin</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={create} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Email</Label><Input type="email" placeholder="admin@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required autoFocus /></div>
                  <div className="space-y-1"><Label>Password</Label><Input type="password" placeholder="Min 6 chars" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2"><Button type="submit" disabled={loading} className="flex-1">{loading ? 'Creating…' : 'Create Admin'}</Button><Button type="button" variant="outline" onClick={close}>Cancel</Button></div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {modal?.type === 'pw' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader><CardTitle className="text-base">Change Password — {modal.email}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={changePw} className="space-y-3">
                <div className="space-y-1"><Label>New Password</Label><Input type="password" minLength={6} value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} required autoFocus /></div>
                <div className="space-y-1"><Label>Confirm</Label><Input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required /></div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2"><Button type="submit" disabled={loading} className="flex-1">{loading ? 'Saving…' : 'Save'}</Button><Button type="button" variant="outline" onClick={close}>Cancel</Button></div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
