'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PaymentConfig {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  enabled: boolean;
}

const empty: PaymentConfig = { razorpayKeyId: '', razorpayKeySecret: '', enabled: false };

export default function PaymentConfigPage() {
  const [config, setConfig] = useState<PaymentConfig>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await api.get('/payment/platform-config');
      if (r.data.config) setConfig({ ...empty, ...r.data.config });
    } catch { setError('Failed to load config'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.put('/payment/platform-config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { setError('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Payment Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure Razorpay credentials for subscription payments. Money from admin subscriptions will go to this account.
        </p>
      </div>

      <form onSubmit={save}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Razorpay — Subscription Account</CardTitle>
              <Badge variant={config.enabled ? 'default' : 'secondary'}>
                {config.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Key ID</Label>
              <Input
                placeholder="rzp_live_xxxxxxxxxxxx"
                value={config.razorpayKeyId}
                onChange={e => setConfig(c => ({ ...c, razorpayKeyId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">From Razorpay Dashboard → Settings → API Keys</p>
            </div>
            <div className="space-y-1">
              <Label>Key Secret</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={config.razorpayKeySecret}
                onChange={e => setConfig(c => ({ ...c, razorpayKeySecret: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))}
              />
              Enable Razorpay for subscription payments
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving} className="w-full">
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
