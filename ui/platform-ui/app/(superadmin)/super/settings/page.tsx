'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SuperSettingsPage() {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const changePassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.newPw !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/admin-mgmt/change-password', { currentPassword: form.current, newPassword: form.newPw });
      setForm({ current: '', newPw: '', confirm: '' });
      setMsg('Password changed successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to change password');
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={22} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-3">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <Input type="password" value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input type="password" minLength={6} value={form.newPw} onChange={e => setForm({ ...form, newPw: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <Input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Saving…' : 'Update Password'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
