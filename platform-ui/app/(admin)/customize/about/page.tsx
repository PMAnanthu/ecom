'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomizeAboutPage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [about, setAbout] = useState({ title: '', description: '', email: '', phone: '', address: '', hours: '' });

  useEffect(() => {
    api.get('/store').then((r) => {
      const b = r.data.store?.branding || {};
      setAbout({
        title: b.aboutTitle || '',
        description: b.aboutDescription || '',
        email: b.contactEmail || '',
        phone: b.phone || '',
        address: b.address ? `${b.address}${b.city ? ', ' + b.city : ''}${b.country ? ', ' + b.country : ''}` : '',
        hours: b.businessHours || '',
      });
    }).catch(() => {});
  }, []);

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', {
        branding: {
          ...existing,
          aboutTitle: about.title,
          aboutDescription: about.description,
          contactEmail: about.email,
          businessHours: about.hours,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Customize About Page</h1>
      <form onSubmit={save} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">About Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Page Title</Label>
              <Input value={about.title} placeholder="About Us" onChange={e => setAbout({ ...about, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Description</Label>
              <Textarea value={about.description} placeholder="Tell your story…" rows={5}
                onChange={e => setAbout({ ...about, description: e.target.value })} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Contact Email</Label>
              <Input type="email" value={about.email} placeholder="hello@yourstore.com"
                onChange={e => setAbout({ ...about, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Business Hours</Label>
              <Input value={about.hours} placeholder="Mon–Fri, 9am–6pm"
                onChange={e => setAbout({ ...about, hours: e.target.value })} /></div>
          </CardContent>
        </Card>
        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save About Page'}</Button>
      </form>
    </div>
  );
}
