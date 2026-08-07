'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Loader2, Zap } from 'lucide-react';

interface Plan {
  id: string; name: string; price: number; currency: string;
  billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'UNLIMITED';
}
interface SubStatus {
  subscribed: boolean; availableDays: number; expired: boolean;
  renewsAt?: string; subscription: { name: string } | null;
}

const PERIOD_DAYS: Record<string, number> = { MONTHLY: 30, QUARTERLY: 90, YEARLY: 365, UNLIMITED: 36500 };
const PERIOD_LABEL: Record<string, string> = { MONTHLY: '30 days', QUARTERLY: '90 days', YEARLY: '365 days', UNLIMITED: 'Unlimited' };

type PayStep = 'idle' | 'confirm' | 'processing' | 'success';

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [payStep, setPayStep] = useState<PayStep>('idle');
  const [payRef, setPayRef] = useState('');
  const [error, setError] = useState('');
  const [cardLast4, setCardLast4] = useState('4242');

  useEffect(() => {
    api.get('/platform/subscriptions').then(r => setPlans(r.data.subscriptions || [])).catch(() => {});
    api.get('/platform/subscription-status').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const openConfirm = (plan: Plan) => { setSelected(plan); setPayStep('confirm'); setError(''); };

  const pay = async () => {
    if (!selected || !user?.email) return;
    setPayStep('processing'); setError('');
    try {
      const { data } = await api.post('/platform/manage/buy', {
        subscriptionId: selected.id,
        adminEmail: user.email,
        paymentMethod: 'dummy',
        cardLast4,
      });
      setPayRef(data.paymentRef);
      setPayStep('success');
      // Refresh status
      api.get('/platform/subscription-status').then(r => setStatus(r.data)).catch(() => {});
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Payment failed');
      setPayStep('confirm');
    }
  };

  const done = () => { router.push('/dashboard'); };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Choose a Subscription Plan</h1>
        <p className="text-neutral-500 text-sm">Select a plan to activate or renew your store access.</p>
      </div>

      {/* Current status */}
      {status && (
        <div className={`rounded-xl p-4 mb-8 flex items-center gap-3 text-sm ${status.expired ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.expired ? 'bg-red-500' : 'bg-green-500'}`} />
          <div>
            {status.subscribed && status.subscription
              ? <span className="font-medium">{status.subscription.name}</span>
              : <span className="font-medium">No active plan</span>}
            {!status.expired && status.availableDays > 0 && (
              <span className="text-neutral-500 ml-2">· {status.availableDays} days remaining</span>
            )}
            {status.expired && <span className="text-red-600 ml-2">· Expired</span>}
          </div>
        </div>
      )}

      {/* Plans grid */}
      {plans.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <Zap size={32} className="mx-auto mb-3 opacity-30" />
          <p>No plans available. Contact your platform admin.</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {plans.map(plan => {
          const isCurrent = status?.subscription?.name === plan.name && !status?.expired;
          return (
            <Card key={plan.id} className={`relative cursor-pointer transition-all hover:shadow-lg ${isCurrent ? 'border-2 border-green-400 bg-green-50/30' : 'hover:border-black hover:border-2'}`}
              onClick={() => !isCurrent && openConfirm(plan)}>
              {isCurrent && (
                <div className="absolute -top-3 left-5">
                  <Badge className="bg-green-500 text-white text-xs px-3 py-1">Current Plan</Badge>
                </div>
              )}
              <CardHeader className="pb-2 pt-7">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-baseline gap-2 flex-wrap min-h-[2.5rem]">
                  <span className="text-3xl font-bold">{plan.price === 0 ? 'Free' : `${plan.currency} ${plan.price.toLocaleString()}`}</span>
                  {plan.price > 0 && <span className="text-neutral-400 text-sm">/ {plan.billingPeriod.toLowerCase()}</span>}
                </div>
                <p className="text-sm text-neutral-500 mb-5">{PERIOD_LABEL[plan.billingPeriod]} of access</p>
                <Button className="w-full" variant={isCurrent ? 'outline' : 'default'}
                  onClick={e => { e.stopPropagation(); openConfirm(plan); }}>
                  {isCurrent ? '+ Renew / Add Days' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment modal */}
      {payStep !== 'idle' && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            {payStep === 'success' ? (
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold mb-1">Payment Successful!</h2>
                <p className="text-neutral-500 text-sm mb-1">You are now subscribed to <strong>{selected.name}</strong></p>
                <p className="text-neutral-400 text-xs mb-1">Ref: {payRef}</p>
                <p className="text-neutral-400 text-xs mb-6">{PERIOD_DAYS[selected.billingPeriod]} days added to your account</p>
                <Button className="w-full" onClick={done}>Go to Dashboard</Button>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard size={16} /> Complete Purchase
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-neutral-50 rounded-xl p-4 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-500">Plan</span>
                      <span className="font-medium">{selected.name}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-500">Duration</span>
                      <span>{PERIOD_LABEL[selected.billingPeriod]}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2 mt-2">
                      <span>Total</span>
                      <span>{selected.price === 0 ? 'Free' : `${selected.currency} ${selected.price.toLocaleString()}`}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Payment Details (Demo)</p>
                    <div className="border rounded-lg p-3 space-y-2 bg-neutral-50">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-neutral-400 w-24 shrink-0">Card number</span>
                        <span className="font-mono">•••• •••• •••• </span>
                        <input value={cardLast4} onChange={e => setCardLast4(e.target.value.slice(0, 4))}
                          className="font-mono w-12 border rounded px-1 text-sm" maxLength={4} placeholder="4242" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="w-24 shrink-0">Expires</span>
                        <span className="font-mono">12/99</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="w-24 shrink-0">CVV</span>
                        <span className="font-mono">•••</span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400">🔒 This is a demo payment — no real charge will be made.</p>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <div className="flex gap-2">
                    {(() => {
                      const priceLabel = selected.price === 0 ? 'Free' : `${selected.currency} ${selected.price.toLocaleString()}`;
                      const btnContent = payStep === 'processing'
                        ? <><Loader2 size={14} className="mr-2 animate-spin" />Processing…</>
                        : `Pay ${priceLabel}`;
                      return <Button className="flex-1" onClick={pay} disabled={payStep === 'processing'}>{btnContent}</Button>;
                    })()}
                    <Button variant="outline" onClick={() => setPayStep('idle')}>Cancel</Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
