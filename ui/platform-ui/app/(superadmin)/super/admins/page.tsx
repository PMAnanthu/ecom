'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, KeyRound, Ban, CheckCircle, ExternalLink } from 'lucide-react';

const STOREFRONT_BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://ecom-storefront-m6jmogmpra-ue.a.run.app';

interface Store { subdomain?: string; name?: string }
interface AuthUser { id: string; email: string; storeId?: string; store?: Store; createdAt: string }
interface PlatformAdmin { id: string; email: string; status: string; subscriptionId?: string; renewsAt?: string; subscription?: { id: string; name: string } }
interface AdminRow extends AuthUser { platformId?: string; status: string; subscriptionId?: string; renewsAt?: string; subscriptionName?: string }
interface Sub { id: string; name: string }
type Modal = { type: 'password'; id: string; email: string } | { type: 'own-password' } | null;

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [form, setForm] = useState({ email: '', password: '', storeName: '', subdomain: '' });
  const [modal, setModal] = useState<Modal>(null);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [authRes, platformRes, subsRes] = await Promise.all([
        api.get('/auth/admin-mgmt'),
        api.get('/platform/admins'),
        api.get('/platform/subscriptions'),
      ]);
      const authUsers: AuthUser[] = authRes.data.users || [];
      const platformAdmins: PlatformAdmin[] = platformRes.data.admins || [];
      setSubs(subsRes.data.subscriptions || []);

      const platformByEmail = new Map(platformAdmins.map(a => [a.email, a]));
      const rows: AdminRow[] = authUsers.map(u => {
        const p = platformByEmail.get(u.email);
        return {
          ...u,
          platformId: p?.id,
          status: p?.status || 'ACTIVE',
          subscriptionId: p?.subscriptionId,
          renewsAt: p?.renewsAt,
          subscriptionName: p?.subscription?.name,
        };
      });
      setAdmins(rows);
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

  const toggleSuspend = async (admin: AdminRow) => {
    if (!admin.platformId) { setError('Admin not synced to platform yet — delete and recreate'); return; }
    const newStatus = admin.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/platform/admins/${admin.platformId}/status`, { status: newStatus });
      await load();
      flash(`${admin.email} ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}`);
    } catch { setError('Failed to update status'); }
  };

  const deleteAdmin = async (admin: AdminRow) => {
    if (!confirm(`Delete ${admin.email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/admin-mgmt/${admin.id}`);
      await load();
      flash('Admin deleted');
    } catch { setError('Failed to delete admin'); }
  };

  const assignSub = async (admin: AdminRow, subId: string) => {
    if (!admin.platformId) return;
    const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await api.patch(`/platform/admins/${admin.platformId}/subscription`, {
        subscriptionId: subId === '__none__' ? null : subId,
        renewsAt: subId === '__none__' ? null : renewsAt,
      });
      await load();
      flash('Subscription updated');
    } catch { setError('Failed to update subscription'); }
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
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Admins</h1>
        <Button variant="outline" size="sm" onClick={() => { setModal({ type: 'own-password' }); setPwForm({ current: '', newPw: '', confirm: '' }); setError(''); }}>
          <KeyRound size={14} className="mr-1" /> Change My Password
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Create Admin Account</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createAdmin} className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              <div className="space-y-1">
                <Label>Store Name</Label>
                <Input placeholder="My Jewellery Store" value={form.storeName}
                  onChange={e => setForm({ ...form, storeName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Subdomain</Label>
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

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Admin</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Storefront</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Subscription</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Renewal</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {admins.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No admin accounts yet.</td></tr>
            )}
            {admins.map((a) => {
              const suspended = a.status === 'SUSPENDED';
              const days = daysUntil(a.renewsAt);
              const storefront = a.store?.subdomain ? `${STOREFRONT_BASE}/s/${a.store.subdomain}` : null;
              return (
                <tr key={a.id} className={suspended ? 'opacity-60 bg-neutral-50' : 'hover:bg-neutral-50/50'}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.email}</p>
                    <p className="text-xs text-neutral-400">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    {storefront ? (
                      <a href={storefront} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-indigo-600 hover:underline text-xs font-mono">
                        {a.store?.subdomain}.ecom.app <ExternalLink size={11} />
                      </a>
                    ) : <span className="text-xs text-neutral-400">No store</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={suspended ? 'secondary' : 'default'}>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Select onValueChange={v => assignSub(a, v)}>
                      <SelectTrigger className="h-7 text-xs w-36">
                        <SelectValue placeholder={a.subscriptionName || 'No plan'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No plan</SelectItem>
                        {subs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {days !== null ? (
                      <span className={`text-xs font-medium ${days < 7 ? 'text-red-500' : days < 30 ? 'text-orange-500' : 'text-green-600'}`}>
                        {days > 0 ? `${days}d left` : 'Expired'}
                      </span>
                    ) : <span className="text-xs text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Button size="sm" variant="outline" className="h-7 px-2"
                        onClick={() => { setModal({ type: 'password', id: a.id, email: a.email }); setPwForm({ current: '', newPw: '', confirm: '' }); setError(''); }}>
                        <KeyRound size={12} />
                      </Button>
                      <Button size="sm" variant={suspended ? 'default' : 'outline'} className="h-7 px-2" onClick={() => toggleSuspend(a)}>
                        {suspended ? <CheckCircle size={12} /> : <Ban size={12} />}
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => deleteAdmin(a)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
