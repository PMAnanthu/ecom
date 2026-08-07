'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, KeyRound, Ban, CheckCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const STOREFRONT_BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://ecom-storefront-m6jmogmpra-ue.a.run.app';

interface Store { subdomain?: string; name?: string }
interface AuthUser { id: string; email: string; storeId?: string; store?: Store; createdAt: string }
interface PlatformAdmin { id: string; email: string; status: string; subscriptionId?: string; renewsAt?: string; subscription?: { id: string; name: string } }
interface AdminRow extends AuthUser { platformId?: string; status: string; subscriptionId?: string; renewsAt?: string; subscriptionName?: string }
interface Customer { id: string; email: string; storeId?: string; createdAt: string }
interface Sub { id: string; name: string }
type Modal = { type: 'password'; id: string; email: string } | { type: 'own-password' } | { type: 'create' } | null;

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function RenewalBadge({ days }: Readonly<{ days: number | null }>) {
  if (days === null) return <span className="text-xs text-neutral-400">—</span>;
  if (days <= 0) return <span className="text-xs font-medium text-red-500">Expired</span>;
  if (days < 7) return <span className="text-xs font-medium text-red-500">{days}d left</span>;
  if (days < 30) return <span className="text-xs font-medium text-orange-500">{days}d left</span>;
  return <span className="text-xs font-medium text-green-600">{days}d left</span>;
}

export default function AdminsPage() {
  const searchParams = useSearchParams();

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAdmins, setShowAdmins] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState({ email: '', password: '', storeName: '', subdomain: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    const [authRes, platformRes, subsRes, custRes] = await Promise.all([
      api.get('/auth/admin-mgmt'),
      api.get('/platform/admins'),
      api.get('/platform/subscriptions'),
      api.get('/auth/admin-mgmt/customers'),
    ]);
    const authUsers: AuthUser[] = authRes.data.users || [];
    const platformAdmins: PlatformAdmin[] = platformRes.data.admins || [];
    setSubs(subsRes.data.subscriptions || []);
    setCustomers(custRes.data.users || []);
    const platformByEmail = new Map(platformAdmins.map(a => [a.email, a]));
    setAdmins(authUsers.map(u => {
      const p = platformByEmail.get(u.email);
      return { ...u, platformId: p?.id, status: p?.status || 'ACTIVE', subscriptionId: p?.subscriptionId, renewsAt: p?.renewsAt, subscriptionName: p?.subscription?.name };
    }));
  }, []);

  useEffect(() => { loadAll().catch(() => {}); }, [loadAll]);

  // Preserve scroll/section state from URL
  useEffect(() => {
    if (searchParams.get('section') === 'admins') setShowAdmins(true);
  }, [searchParams]);

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
      setModal(null);
      await loadAll();
      flash('Admin created');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create admin');
    } finally { setLoading(false); }
  };

  const toggleSuspend = async (admin: AdminRow) => {
    if (!admin.platformId) { setError('Admin not synced to platform'); return; }
    const newStatus = admin.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await api.patch(`/platform/admins/${admin.platformId}/status`, { status: newStatus });
    await loadAll();
    flash(`${admin.email} ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}`);
  };

  const deleteAdmin = async (admin: AdminRow) => {
    if (!confirm(`Delete ${admin.email}? This cannot be undone.`)) return;
    await api.delete(`/auth/admin-mgmt/${admin.id}`);
    await loadAll();
    flash('Admin deleted');
  };

  const assignSub = async (admin: AdminRow, subId: string) => {
    if (!admin.platformId) return;
    const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await api.patch(`/platform/admins/${admin.platformId}/subscription`, {
      subscriptionId: subId === '__none__' ? null : subId,
      renewsAt: subId === '__none__' ? null : renewsAt,
    });
    await loadAll();
    flash('Subscription updated');
  };

  const changePassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      if (modal?.type === 'own-password') await api.post('/auth/admin-mgmt/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      else if (modal?.type === 'password') await api.patch(`/auth/admin-mgmt/${modal.id}/password`, { password: pwForm.newPw });
      setModal(null); setPwForm({ current: '', newPw: '', confirm: '' }); flash('Password changed');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const filteredAdmins = admins.filter(a => !adminSearch || a.email.toLowerCase().includes(adminSearch.toLowerCase()));
  const filteredCustomers = customers.filter(c => !customerSearch || c.email.toLowerCase().includes(customerSearch.toLowerCase()));

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers & Admins</h1>
        <div className="flex items-center gap-2">
          {msg && <span className="text-sm text-green-600">{msg}</span>}
          <Button variant="outline" size="sm" onClick={() => { setModal({ type: 'own-password' }); setPwForm({ current: '', newPw: '', confirm: '' }); setError(''); }}>
            <KeyRound size={14} className="mr-1" /> My Password
          </Button>
        </div>
      </div>

      {/* ── CUSTOMERS ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Customers <span className="text-sm font-normal text-neutral-400 ml-1">({filteredCustomers.length})</span></h2>
          <Input placeholder="Search by email…" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="max-w-xs h-8 text-sm" />
        </div>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500">Store</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCustomers.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-neutral-400">No customers yet.</td></tr>}
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3 font-medium">{c.email}</td>
                  <td className="px-4 py-3 text-xs text-neutral-400 font-mono">{c.storeId ? c.storeId.slice(0, 8) + '…' : '—'}</td>
                  <td className="px-4 py-3 text-xs text-neutral-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── ADMINS ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <button className="flex items-center gap-2 text-lg font-semibold hover:text-neutral-600" onClick={() => setShowAdmins(v => !v)}>
            Admins <span className="text-sm font-normal text-neutral-400">({filteredAdmins.length})</span>
            {showAdmins ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <div className="flex items-center gap-2">
            <Input placeholder="Search…" value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="max-w-xs h-8 text-sm" />
            <Button size="sm" onClick={() => { setModal({ type: 'create' }); setError(''); }}>+ Create Admin</Button>
          </div>
        </div>
        {showAdmins && (
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
                {filteredAdmins.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No admins yet.</td></tr>}
                {filteredAdmins.map((a) => {
                  const suspended = a.status === 'SUSPENDED';
                  const storefront = a.store?.subdomain ? `${STOREFRONT_BASE}/s/${a.store.subdomain}` : null;
                  return (
                    <tr key={a.id} className={suspended ? 'opacity-60 bg-neutral-50' : 'hover:bg-neutral-50/50'}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{a.email}</p>
                        <p className="text-xs text-neutral-400">{new Date(a.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        {storefront
                          ? <a href={storefront} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline text-xs font-mono">{a.store?.subdomain}.ecom.app <ExternalLink size={11} /></a>
                          : <span className="text-xs text-neutral-400">No store</span>}
                      </td>
                      <td className="px-4 py-3"><Badge variant={suspended ? 'secondary' : 'default'}>{a.status}</Badge></td>
                      <td className="px-4 py-3">
                        <Select onValueChange={(v) => { if (v) assignSub(a, v); }}>
                          <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder={a.subscriptionName || 'No plan'} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">No plan</SelectItem>
                            {subs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3"><RenewalBadge days={daysUntil(a.renewsAt)} /></td>
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
        )}
      </section>

      {/* Create Admin Modal */}
      {modal?.type === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader><CardTitle className="text-base">Create Admin Account</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createAdmin} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input type="email" placeholder="admin@example.com" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} required autoFocus />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input type="password" placeholder="Min 6 chars" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                  </div>
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
                <div className="flex gap-2 pt-1">
                  <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Creating…' : 'Create Admin'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setModal(null); setError(''); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Password Modal */}
      {(modal?.type === 'password' || modal?.type === 'own-password') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader><CardTitle className="text-base">{modal.type === 'own-password' ? 'Change My Password' : `Change Password — ${modal.email}`}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className="space-y-3">
                {modal.type === 'own-password' && (
                  <div className="space-y-1"><Label>Current Password</Label>
                    <Input type="password" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} required />
                  </div>
                )}
                <div className="space-y-1"><Label>New Password</Label>
                  <Input type="password" minLength={6} value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} required />
                </div>
                <div className="space-y-1"><Label>Confirm Password</Label>
                  <Input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
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
