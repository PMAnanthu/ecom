'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useStorefrontStore } from '@/lib/storefront-store';
import { useTemplate } from '@/lib/template-context';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface FirebaseConfig {
  apiKey: string | null;
  authDomain: string | null;
  projectId: string | null;
  enableGoogle: boolean;
  enablePhone: boolean;
  enableFacebook: boolean;
}

function useStorePath() {
  const pathname = usePathname();
  const match = /^\/s\/([^/]+)/.exec(pathname);
  return match ? `/s/${match[1]}` : '';
}

function SocialButton({ icon, label, onClick, loading }: Readonly<{
  icon: React.ReactNode; label: string; onClick: () => void; loading: boolean;
}>) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="w-full flex items-center justify-center gap-3 border rounded-lg py-2.5 px-4 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-60">
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [fbConfig, setFbConfig] = useState<FirebaseConfig | null>(null);
  const { setAuth, store } = useStorefrontStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const base = useStorePath();
  const next = searchParams.get('next') || `${base}/`;
  const template = useTemplate();
  const isCard = template === 'card';

  // Load Firebase config
  useEffect(() => {
    api.get('/platform/platform-config').then(r => setFbConfig(r.data.firebase)).catch(() => {});
  }, []);

  const finishSocialAuth = async (idToken: string) => {
    const { data } = await api.post('/auth/firebase', { idToken, storeId: store?.id });
    setAuth(data.user, data.accessToken, data.refreshToken);
    router.push(next);
  };

  const handleGoogle = async () => {
    if (!fbConfig?.apiKey) { setError('Google sign-in not configured'); return; }
    setSocialLoading('google'); setError('');
    try {
      const { initFirebase } = await import('@/lib/firebase');
      const { auth } = initFirebase({ apiKey: fbConfig.apiKey!, authDomain: fbConfig.authDomain!, projectId: fbConfig.projectId! });
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();
      await finishSocialAuth(idToken);
    } catch (err: unknown) {
      setError((err as Error).message || 'Google sign-in failed');
    } finally { setSocialLoading(null); }
  };

  const handleFacebook = async () => {
    if (!fbConfig?.apiKey) { setError('Facebook sign-in not configured'); return; }
    setSocialLoading('facebook'); setError('');
    try {
      const { initFirebase } = await import('@/lib/firebase');
      const { auth } = initFirebase({ apiKey: fbConfig.apiKey!, authDomain: fbConfig.authDomain!, projectId: fbConfig.projectId! });
      const { FacebookAuthProvider, signInWithPopup } = await import('firebase/auth');
      const result = await signInWithPopup(auth, new FacebookAuthProvider());
      const idToken = await result.user.getIdToken();
      await finishSocialAuth(idToken);
    } catch (err: unknown) {
      setError((err as Error).message || 'Facebook sign-in failed');
    } finally { setSocialLoading(null); }
  };

  const handleSendOtp = async () => {
    if (!fbConfig?.apiKey || !phone) { setError('Enter a phone number'); return; }
    setSocialLoading('phone'); setError('');
    try {
      const { initFirebase } = await import('@/lib/firebase');
      const { auth } = initFirebase({ apiKey: fbConfig.apiKey!, authDomain: fbConfig.authDomain!, projectId: fbConfig.projectId! });
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      (window as unknown as Record<string, unknown>).__phoneConfirmation = confirmation;
      setOtpSent(true);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send OTP');
    } finally { setSocialLoading(null); }
  };

  const handleVerifyOtp = async () => {
    setSocialLoading('phone'); setError('');
    try {
      const confirmation = (window as unknown as Record<string, unknown>).__phoneConfirmation as { confirm: (otp: string) => Promise<{ user: { getIdToken: () => Promise<string> } }> };
      if (!confirmation) throw new Error('Please request OTP first');
      const result = await confirmation.confirm(otp);
      const idToken = await result.user.getIdToken();
      await finishSocialAuth(idToken);
    } catch (err: unknown) {
      setError((err as Error).message || 'OTP verification failed');
    } finally { setSocialLoading(null); }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push(next);
    } catch { setError('Invalid email or password'); }
    finally { setLoading(false); }
  };

  const hasGoogle = fbConfig?.enableGoogle && fbConfig?.apiKey;
  const hasFacebook = fbConfig?.enableFacebook && fbConfig?.apiKey;
  const hasPhone = fbConfig?.enablePhone && fbConfig?.apiKey;
  const hasSocial = hasGoogle || hasFacebook || hasPhone;

  return (
    <TemplateWrapper>
      <div id="recaptcha-container" />
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <Card className={`w-full max-w-sm ${isCard ? 'shadow-xl' : ''}`}>
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
            {next !== `${base}/` && <p className="text-sm text-neutral-500">Sign in to continue</p>}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Social buttons */}
            {hasSocial && (
              <div className="space-y-2">
                {hasGoogle && (
                  <SocialButton
                    icon={<svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
                    label="Continue with Google"
                    onClick={handleGoogle}
                    loading={socialLoading === 'google'}
                  />
                )}
                {hasFacebook && (
                  <SocialButton
                    icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                    label="Continue with Facebook"
                    onClick={handleFacebook}
                    loading={socialLoading === 'facebook'}
                  />
                )}
                {hasPhone && !otpSent && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className="flex-1" />
                      <Button type="button" variant="outline" size="sm" onClick={handleSendOtp} disabled={socialLoading === 'phone'}>
                        {socialLoading === 'phone' ? <Loader2 size={14} className="animate-spin" /> : 'Send OTP'}
                      </Button>
                    </div>
                  </div>
                )}
                {hasPhone && otpSent && (
                  <div className="flex gap-2">
                    <Input placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="flex-1" />
                    <Button type="button" size="sm" onClick={handleVerifyOtp} disabled={socialLoading === 'phone'}>
                      {socialLoading === 'phone' ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                )}
                <div className="relative flex items-center gap-3 py-1">
                  <div className="flex-1 border-t" />
                  <span className="text-xs text-neutral-400">or</span>
                  <div className="flex-1 border-t" />
                </div>
              </div>
            )}

            {/* Email/password */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className={`w-full ${isCard ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <p className="text-sm text-center text-neutral-500">
              No account? <Link href={`${base}/register?next=${encodeURIComponent(next)}`} className="underline">Register</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </TemplateWrapper>
  );
}
