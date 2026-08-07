'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmailConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  emailEnabled: boolean;
}

interface EmailConfigFormProps {
  readonly storeId: string;
  readonly initial: Partial<EmailConfig>;
  readonly onSave: (data: EmailConfig) => Promise<void>;
}

export function EmailConfigForm({ storeId: _storeId, initial, onSave }: EmailConfigFormProps) {
  const [form, setForm] = useState<EmailConfig>({
    smtpHost: initial.smtpHost ?? '',
    smtpPort: String(initial.smtpPort ?? 587),
    smtpUser: initial.smtpUser ?? '',
    smtpPassword: '',
    smtpFrom: initial.smtpFrom ?? '',
    emailEnabled: initial.emailEnabled ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof EmailConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Email (SMTP)</CardTitle>
          <Badge variant={form.emailEnabled ? 'default' : 'secondary'}>
            {form.emailEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>SMTP Host</Label>
          <Input placeholder="smtp.example.com" value={form.smtpHost} onChange={set('smtpHost')} />
        </div>
        <div className="space-y-1">
          <Label>SMTP Port</Label>
          <Input type="number" placeholder="587" value={form.smtpPort} onChange={set('smtpPort')} />
        </div>
        <div className="space-y-1">
          <Label>Username</Label>
          <Input placeholder="user@example.com" value={form.smtpUser} onChange={set('smtpUser')} />
        </div>
        <div className="space-y-1">
          <Label>Password</Label>
          <Input type="password" placeholder="••••••••" value={form.smtpPassword} onChange={set('smtpPassword')} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>From Address</Label>
          <Input placeholder="noreply@example.com" value={form.smtpFrom} onChange={set('smtpFrom')} />
        </div>
        <div className="col-span-2 flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.emailEnabled}
              onChange={e => setForm(f => ({ ...f, emailEnabled: e.target.checked }))} />
            Enable email notifications
          </label>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface WaConfig {
  waProvider: 'TWILIO' | 'META';
  waApiKey: string;
  waPhoneId: string;
  waEnabled: boolean;
}

interface WaConfigFormProps {
  readonly storeId: string;
  readonly initial: Partial<WaConfig>;
  readonly onSave: (data: WaConfig) => Promise<void>;
}

export function WhatsAppConfigForm({ storeId: _storeId, initial, onSave }: WaConfigFormProps) {
  const [form, setForm] = useState<WaConfig>({
    waProvider: initial.waProvider ?? 'META',
    waApiKey: '',
    waPhoneId: initial.waPhoneId ?? '',
    waEnabled: initial.waEnabled ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof WaConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">WhatsApp</CardTitle>
          <Badge variant={form.waEnabled ? 'default' : 'secondary'}>
            {form.waEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <Label>Provider</Label>
          <Select value={form.waProvider} onValueChange={v => setForm(f => ({ ...f, waProvider: v as WaConfig['waProvider'] }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="META">Meta (Cloud API)</SelectItem>
              <SelectItem value="TWILIO">Twilio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 col-span-2">
          <Label>{form.waProvider === 'TWILIO' ? 'API Key (AccountSid:AuthToken)' : 'Access Token'}</Label>
          <Input type="password" placeholder="••••••••" value={form.waApiKey} onChange={set('waApiKey')} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>{form.waProvider === 'TWILIO' ? 'WhatsApp From Number' : 'Phone Number ID'}</Label>
          <Input placeholder={form.waProvider === 'TWILIO' ? '+1234567890' : '123456789012345'} value={form.waPhoneId} onChange={set('waPhoneId')} />
        </div>
        <div className="col-span-2 flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.waEnabled}
              onChange={e => setForm(f => ({ ...f, waEnabled: e.target.checked }))} />
            Enable WhatsApp notifications
          </label>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
