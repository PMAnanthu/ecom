'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Pencil, Store as StoreIcon } from 'lucide-react';

const STOREFRONT_BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://ecom-storefront-m6jmogmpra-ue.a.run.app';

interface StoreRow {
  id: string; name: string; subdomain: string; storeUrlId?: string;
  domain?: string; email?: string; phone?: string; adminId: string;
  published: boolean; availableDays: number; createdAt: string;
}
interface Admin { id: string; email: string }
interface PlatformAdmin { id: string; email: string; availableDays: number; renewsAt?: string; daysUntilExpiry?: number | null }
type Modal = { type: 'create' } | { type: 'edit'; store: StoreRow } | null;

const emptyForm = { name: '', subdomain: '', email: '', phone: '', adminId: '', domain: '' };

function StoreModal({ modal, form, setForm, admins, stores, loading, error, onSave, onClose }: {
  readonly modal: Modal;
  readonly form: typeof emptyForm;
  readonly setForm: (f: typeof emptyForm) => void;
  readonly admins: Admin[];
  readonly stores: StoreRow[];
  readonly loading: boolean;
  readonly error: string;
  readonly onSave: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  readonly onClose: () => void;
}) {
  if (!modal) return null;
  const isCreate = modal.type === 'create';
  const title = isCreate ? 'Add Store' : `Edit — ${modal.store.name}`;

  const saveLabel = isCreate ? 'Create Store' : 'Save Changes';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Store Name</Label>
                <Input placeholder="My Jewellery Store" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
              </div>

              {isCreate && (
                <>
                  <div className="space-y-1 col-span-2">
                    <Label>Store ID <span className="text-neutral-400 text-xs">(unique, used in URL — e.g. my-store)</span></Label>
                    <Input placeholder="my-store" value={form.subdomain}
                      onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} required />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Assign Admin <span className="text-neutral-400 text-xs">(unassigned only)</span></Label>
                    <select value={form.adminId} onChange={e => setForm({ ...form, adminId: e.target.value })} required
                      className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                      <option value="">Select admin…</option>
                      {admins.filter(a => !stores.some(s => s.adminId === a.id)).map(a => (
                        <option key={a.id} value={a.id}>{a.email}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {!isCreate && (
                <>
                  <div className="space-y-1 col-span-2">
                    <Label>Store ID <span className="text-neutral-400 text-xs">(URL identifier)</span></Label>
                    <Input placeholder="my-store" value={form.subdomain}
                      onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Custom Domain <span className="text-neutral-400 text-xs">(opt — e.g. mystore.com)</span></Label>
                    <Input placeholder="mystore.com" value={form.domain}
                      onChange={e => setForm({ ...form, domain: e.target.value })} />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label>Email <span className="text-neutral-400 text-xs">(opt)</span></Label>
                <Input type="email" placeholder="store@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Phone <span className="text-neutral-400 text-xs">(opt)</span></Label>
                <Input placeholder="+91 98765 43210" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving…' : saveLabel}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuperStoresPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [storesRes, adminsRes, platformRes] = await Promise.all([
      api.get('/store/all'),
      api.get('/auth/admin-mgmt'),
      api.get('/platform/manage'),
    ]);
    const authAdmins: Admin[] = adminsRes.data.users || [];
    const platformAdmins: PlatformAdmin[] = platformRes.data.admins || [];
    const daysByEmail = new Map(platformAdmins.map(p => [p.email, p.daysUntilExpiry ?? p.availableDays ?? 0]));
    const adminEmailMap = new Map(authAdmins.map(a => [a.id, { email: a.email, availableDays: daysByEmail.get(a.email) ?? 0 }]));
    const rawStores = (storesRes.data.stores || []) as StoreRow[];
    setStores(rawStores.map(s => ({ ...s, availableDays: adminEmailMap.get(s.adminId)?.availableDays ?? 0 })));
    setAdmins(authAdmins);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const close = () => { setModal(null); setError(''); };

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError('');
    const isCreate = modal?.type === 'create';
    try {
      if (isCreate) {
        await api.post('/store/admin-create', { name: form.name, subdomain: form.subdomain, storeUrlId: form.subdomain, email: form.email || undefined, phone: form.phone || undefined, adminId: form.adminId });
      } else if (modal?.type === 'edit') {
        await api.patch(`/store/admin-update/${modal.store.id}`, { name: form.name, subdomain: form.subdomain || undefined, domain: form.domain || undefined, email: form.email || undefined, phone: form.phone || undefined });
      }
      close(); await load(); flash(isCreate ? 'Store created' : 'Store updated');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const openEdit = (s: StoreRow) => {
    setForm({ name: s.name, subdomain: s.subdomain, email: s.email || '', phone: s.phone || '', adminId: s.adminId, domain: s.domain || '' });
    setModal({ type: 'edit', store: s });
    setError('');
  };

  const filtered = stores.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.subdomain.includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <StoreIcon size={22} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Stores</h1>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {msg && <span className="text-sm text-green-600">{msg}</span>}
        <div className="flex items-center gap-2 ml-auto">
          <Input placeholder="Search stores…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-sm w-56" />
          <Button size="sm" onClick={() => { setForm(emptyForm); setModal({ type: 'create' }); setError(''); }}>+ Add Store</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Store Name</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Store ID</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">URL</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Email / Phone</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Admin</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Days Left</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-400">No stores yet.</td></tr>
            )}
            {filtered.map(s => {
              const adminEmail = admins.find(a => a.id === s.adminId)?.email || s.adminId.slice(0, 8) + '…';
              return (
                <tr key={s.id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-xs font-mono text-neutral-500">{s.subdomain}</td>
                  <td className="px-4 py-3">
                    <a href={`${STOREFRONT_BASE}/s/${s.subdomain}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-600 hover:underline text-xs">
                      View <ExternalLink size={11} />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{s.email || '—'}</p>
                    <p className="text-xs text-neutral-400">{s.phone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{adminEmail}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{s.availableDays} days</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.published ? 'default' : 'secondary'}>{s.published ? 'Published' : 'Draft'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => openEdit(s)}>
                      <Pencil size={12} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <StoreModal modal={modal} form={form} setForm={setForm} admins={admins} stores={stores}
        loading={loading} error={error} onSave={save} onClose={close} />
    </div>
  );
}
