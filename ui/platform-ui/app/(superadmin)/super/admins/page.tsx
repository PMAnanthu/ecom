'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, KeyRound, Ban, CheckCircle } from 'lucide-react';

interface AdminUser { id: string; email: string; role: string; storeId?: string; createdAt: string }
interface Sub { id: string; name: string }
type Modal = { type: 'password'; id: string; email: string } | { type: 'own-password' } | null;

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [suspendedIds, setSuspendedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ email: '', password: '', storeName: '', subdomain: '' });
  const [modal, setModal] = useState<Modal>(null);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [adminsRes, subsRes] = await Promise.all([
        api.get('/auth/admin-mgmt'),
        api.get('/platform/subscriptions'),
      ]);
      setAdmins(adminsRes.data.users || []);
      setSubs(subsRes.data.subscriptions || []);
    } catch { setError('Failed to load admins'); }
  };

  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const createAdmin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/admin-mgmt', {
        email: form.email, password: form.password,
        storeName: form.storeName || undefined,
        subdomain: form.subdomain || undefined,
      });
      setForm({ email: '', password: '', storeName: '', subdomain: '' });
      await load();
      flash('Admin created successfully');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create admin');
    } finally { setLoading(false); }
  };

  const toggleSuspend = async (admin: AdminUser) => {
    const isSuspended = suspendedIds.has(admin.id);
    try {
      await api.patch(`/platform/admins/${admin.id}/status`, {
        status: isSuspended ? 'ACTIVE' : 'SUSPENDED',
      });
      setSuspendedIds(prev => {
        const s = new Set(prev);
        if (isSuspended) s.delete(admin.id); else s.add(admin.id);
        return s;
      });
      flash(isSuspended ? `${admin.email} activated` : `${admin.email} suspended`);
    } catch { setError('Failed to update status'); }
  };

  const deleteAdmin = async (admin: AdminUser) => {
    if (!confirm(`Delete ${admin.email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/admin-mgmt/${admin.id}`);
      await load();
      flash('Admin deleted');
    } catch { setError('Failed to delete admin'); }
  };

  const changePassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      if (modal?.type === 'own-password') {
        await api.post('/auth/admin-mgmt/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      } else if (modal?.type === 'password') {
        await api.patch(`/auth/admin-mgmt/${modal.id}/password`, { password: pwForm.newPw });
      }
      setModal(null); setPwForm({ current: '', newPw: '', confirm: '' });
      flash('Password changed successfully');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to change password');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Admins</h1>
        <Button variant="outline" size="sm" onClick={() => { setModal({ type: 'own-password' }); setPwForm({ current: '', newPw: '', confirm: '' }); setError(''); }}>
          <KeyRound size={14} className="mr-1" /> Change My Password
        </Button>
      </div>

      {/* Create Admin */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Create Admin Account</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createAdmin} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" placeholder="admin@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" placeholder="Min 6 chars" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Store Name <span className="text-neutral-400 text-xs">(optional)</span></Label>
                <Input placeholder="My Jewellery Store" value={form.storeName}
                  onChange={e => setForm({ ...form, storeName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Subdomain <span className="text-neutral-400 text-xs">(optional)</span></Label>
                <div className="flex items-center gap-1">
                  <Input placeholder="mystore" value={form.subdomain}
                    onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                  <span className="text-xs text-neutral-400 whitespace-nowrap">.ecom.app</span>
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Admin'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Admin List */}
      <div className="space-y-2">
        {admins.length === 0 && <p className="text-sm text-neutral-400">No admin accounts yet.</p>}
        {admins.map((a) => {
          const suspended = suspendedIds.has(a.id);
          return (
            <div key={a.id} className={`flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border transition-opacity ${suspended ? 'opacity-60' : ''}`}>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{a.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-neutral-400">{new Date(a.createdAt).toLocaleDateString()}</p>
                  {a.storeId && <span className="text-xs text-indigo-500 font-mono">has store</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={suspended ? 'secondary' : 'default'}>{suspended ? 'SUSPENDED' : 'ACTIVE'}</Badge>

                {/* Assign subscription */}
                {subs.length > 0 && (
                  <Select onValueChange={async (subId) => {
                    try {
                      await api.patch(`/platform/admins/${a.id}/subscription`, { subscriptionId: subId === '__none__' ? null : subId });
                      flash('Subscription updated');
                    } catch { setError('Failed to update subscription'); }
                  }}>
                    <SelectTrigger className="h-8 text-xs w-32">
                      <SelectValue placeholder="Assign plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No plan</SelectItem>
                      {subs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                <Button size="sm" variant="outline"
                  onClick={() => { setModal({ type: 'password', id: a.id, email: a.email }); setPwForm({ current: '', newPw: '', confirm: '' }); setError(''); }}>
                  <KeyRound size={12} className="mr-1" /> PW
                </Button>
                <Button size="sm" variant={suspended ? 'default' : 'outline'} onClick={() => toggleSuspend(a)}>
                  {suspended ? <><CheckCircle size={12} className="mr-1" />Activate</> : <><Ban size={12} className="mr-1" />Suspend</>}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteAdmin(a)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Password Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-base">
                {modal.type === 'own-password' ? 'Change My Password' : `Change Password — ${modal.email}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className="space-y-3">
                {modal.type === 'own-password' && (
                  <div className="space-y-1">
                    <Label>Current Password</Label>
                    <Input type="password" value={pwForm.current}
                      onChange={e => setPwForm({ ...pwForm, current: e.target.value })} required />
                  </div>
                )}
                <div className="space-y-1">
                  <Label>New Password</Label>
                  <Input type="password" minLength={6} value={pwForm.newPw}
                    onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Confirm Password</Label>
                  <Input type="password" value={pwForm.confirm}
                    onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Saving…' : 'Save'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setModal(null); setError(''); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
