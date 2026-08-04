'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useStorefrontStore } from '@/lib/storefront-store';
import { useTemplate } from '@/lib/template-context';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStorefrontStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const template = useTemplate();
  const isCard = template === 'card';

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push(next);
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TemplateWrapper>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <Card className={`w-full max-w-sm ${isCard ? 'shadow-xl' : ''}`}>
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
            {next !== '/' && (
              <p className="text-sm text-neutral-500">Sign in to continue your purchase</p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className={`w-full ${isCard ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <p className="text-sm text-center text-neutral-500 mt-4">
              No account? <Link href={`/register?next=${encodeURIComponent(next)}`} className="underline">Register</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </TemplateWrapper>
  );
}
