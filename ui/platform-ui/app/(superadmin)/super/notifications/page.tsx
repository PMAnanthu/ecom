'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { StoreSelector } from '@/components/notifications/StoreSelector';
import { EmailConfigForm, WhatsAppConfigForm } from '@/components/notifications/NotificationConfigForms';

interface Store { id: string; name: string }

interface NotifConfig {
  smtpHost?: string; smtpPort?: string; smtpUser?: string;
  smtpFrom?: string; emailEnabled?: boolean;
  waProvider?: 'TWILIO' | 'META'; waPhoneId?: string; waEnabled?: boolean;
}

export default function NotificationsConfigPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [config, setConfig] = useState<NotifConfig | null>(null);
  const [configuredIds, setConfiguredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/store/all').then(r => setStores(r.data.stores ?? [])).catch(() => {});
  }, []);

  const loadConfig = useCallback(async (storeId: string) => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get(`/notifications/config/${storeId}`);
      setConfig(r.data.config ?? {});
      if (r.data.config) setConfiguredIds(prev => new Set([...prev, storeId]));
    } catch {
      setError('Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStoreChange = (id: string) => {
    setSelectedStoreId(id);
    setConfig(null);
    loadConfig(id);
  };

  const saveConfig = async (patch: Record<string, unknown>) => {
    await api.put(`/notifications/config/${selectedStoreId}`, patch);
    setConfiguredIds(prev => new Set([...prev, selectedStoreId]));
    await loadConfig(selectedStoreId);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Notification Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure email and WhatsApp notifications per store.
        </p>
      </div>

      <StoreSelector
        stores={stores}
        selectedId={selectedStoreId}
        onChange={handleStoreChange}
        configuredIds={configuredIds}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && selectedStoreId && config !== null && (
        <div className="space-y-4">
          <EmailConfigForm
            storeId={selectedStoreId}
            initial={config}
            onSave={data => saveConfig({
              smtpHost: data.smtpHost,
              smtpPort: Number(data.smtpPort),
              smtpUser: data.smtpUser,
              smtpPassword: data.smtpPassword || undefined,
              smtpFrom: data.smtpFrom,
              emailEnabled: data.emailEnabled,
            })}
          />
          <WhatsAppConfigForm
            storeId={selectedStoreId}
            initial={config}
            onSave={data => saveConfig({
              waProvider: data.waProvider,
              waApiKey: data.waApiKey || undefined,
              waPhoneId: data.waPhoneId,
              waEnabled: data.waEnabled,
            })}
          />
        </div>
      )}

      {!selectedStoreId && !loading && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Select a store above to configure its notifications.
        </p>
      )}
    </div>
  );
}
