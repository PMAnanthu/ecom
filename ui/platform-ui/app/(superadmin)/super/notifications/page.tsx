'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { EmailConfigForm } from '@/components/notifications/EmailConfigForm';
import { WhatsAppConfigForm } from '@/components/notifications/WhatsAppConfigForm';

interface NotifConfig {
  smtpHost?: string; smtpPort?: string; smtpUser?: string;
  smtpPassword?: string; smtpFrom?: string; emailEnabled?: boolean;
  waProvider?: 'TWILIO' | 'META'; waApiKey?: string;
  waPhoneId?: string; waEnabled?: boolean;
}

export default function NotificationsConfigPage() {
  const [config, setConfig] = useState<NotifConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await api.get('/notifications/config');
      setConfig(r.data.config ?? {});
    } catch {
      setError('Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (patch: Record<string, unknown>) => {
    await api.put('/notifications/config', patch);
    await load();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Notification Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide email and WhatsApp configuration for all transaction notifications.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && config !== null && (
        <>
          <EmailConfigForm
            initial={config}
            onSave={data => save({
              smtpHost: data.smtpHost,
              smtpPort: Number(data.smtpPort),
              smtpUser: data.smtpUser,
              smtpPassword: data.smtpPassword,
              smtpFrom: data.smtpFrom,
              emailEnabled: data.emailEnabled,
            })}
          />
          <WhatsAppConfigForm
            initial={config}
            onSave={data => save({
              waProvider: data.waProvider,
              waApiKey: data.waApiKey,
              waPhoneId: data.waPhoneId,
              waEnabled: data.waEnabled,
            })}
          />
        </>
      )}
    </div>
  );
}
