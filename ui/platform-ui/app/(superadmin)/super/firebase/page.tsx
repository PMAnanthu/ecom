'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface FirebaseConfig {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseEnableGoogle: boolean;
  firebaseEnablePhone: boolean;
  firebaseEnableFacebook: boolean;
  firebaseFacebookAppId: string;
  firebaseServiceAccountJson: string;
}

const defaultConfig: FirebaseConfig = {
  firebaseApiKey: '',
  firebaseAuthDomain: '',
  firebaseProjectId: '',
  firebaseEnableGoogle: true,
  firebaseEnablePhone: true,
  firebaseEnableFacebook: false,
  firebaseFacebookAppId: '',
  firebaseServiceAccountJson: '',
};

export default function FirebaseConfigPage() {
  const [config, setConfig] = useState<FirebaseConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/platform/platform-config').then(r => {
      const fb = r.data.firebase || {};
      setConfig(prev => ({
        ...prev,
        firebaseApiKey: fb.apiKey || '',
        firebaseAuthDomain: fb.authDomain || '',
        firebaseProjectId: fb.projectId || '',
        firebaseEnableGoogle: fb.enableGoogle !== false,
        firebaseEnablePhone: fb.enablePhone !== false,
        firebaseEnableFacebook: !!fb.enableFacebook,
      }));
    }).catch(() => {});
  }, []);

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.patch('/platform/platform-config', {
        firebaseApiKey: config.firebaseApiKey,
        firebaseAuthDomain: config.firebaseAuthDomain,
        firebaseProjectId: config.firebaseProjectId,
        firebaseEnableGoogle: config.firebaseEnableGoogle,
        firebaseEnablePhone: config.firebaseEnablePhone,
        firebaseEnableFacebook: config.firebaseEnableFacebook,
        firebaseFacebookAppId: config.firebaseFacebookAppId,
        firebaseServiceAccountJson: config.firebaseServiceAccountJson,
      });
      setMsg('Saved!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Flame size={22} className="text-orange-500" />
        <h1 className="text-2xl font-bold">Firebase Auth Config</h1>
      </div>
      <p className="text-sm text-neutral-500 mb-6">
        Configure Firebase Authentication to allow customers to sign in with Google, Phone, or Facebook.
        Get these values from your <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline text-indigo-600">Firebase Console</a>.
      </p>

      <form onSubmit={save} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Firebase Web App Config</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-neutral-400">Project Settings → General → Your apps → Web app → firebaseConfig</p>
            <div className="space-y-1">
              <Label>API Key <span className="text-red-400">*</span></Label>
              <Input placeholder="AIzaSy..." value={config.firebaseApiKey} onChange={e => setConfig(c => ({ ...c, firebaseApiKey: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Auth Domain <span className="text-red-400">*</span></Label>
              <Input placeholder="your-project.firebaseapp.com" value={config.firebaseAuthDomain} onChange={e => setConfig(c => ({ ...c, firebaseAuthDomain: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Project ID <span className="text-red-400">*</span></Label>
              <Input placeholder="your-project-id" value={config.firebaseProjectId} onChange={e => setConfig(c => ({ ...c, firebaseProjectId: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Enabled Sign-in Methods</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { key: 'firebaseEnableGoogle', label: '🔵 Google Sign-In' },
              { key: 'firebaseEnablePhone', label: '📱 Phone (OTP)' },
              { key: 'firebaseEnableFacebook', label: '🔷 Facebook Login' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={config[key as keyof FirebaseConfig] as boolean}
                  onChange={e => setConfig(c => ({ ...c, [key]: e.target.checked }))}
                  className="accent-black w-4 h-4" />
                {label}
              </label>
            ))}
            {config.firebaseEnableFacebook && (
              <div className="space-y-1 pt-2">
                <Label>Facebook App ID</Label>
                <Input placeholder="1234567890" value={config.firebaseFacebookAppId} onChange={e => setConfig(c => ({ ...c, firebaseFacebookAppId: e.target.value }))} />
                <p className="text-xs text-neutral-400">From developers.facebook.com → Your App → Settings → Basic</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Service Account Key (for token verification)</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-xs text-neutral-400 mb-2">Project Settings → Service accounts → Generate new private key → paste JSON here</p>
            <textarea
              value={config.firebaseServiceAccountJson}
              onChange={e => setConfig(c => ({ ...c, firebaseServiceAccountJson: e.target.value }))}
              placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'}
              rows={8}
              className="w-full font-mono text-xs border rounded-lg p-3 resize-y focus:outline-none focus:ring-1 focus:ring-black"
            />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {msg && <p className="text-sm text-green-600">✓ {msg}</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save Firebase Config'}</Button>
      </form>
    </div>
  );
}
