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

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const s = document.createElement('script');
    s.id = 'razorpay-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [payStep, setPayStep] = useState<PayStep>('idle');
  const [payRef, setPayRef] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/platform/subscriptions').then(r => setPlans(r.data.subscriptions || [])).catch(() => {});
    api.get('/platform/subscription-status').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const openConfirm = (plan: Plan) => { setSelected(plan); setPayStep('confirm'); setError(''); };

  const activateSubscription = async (plan: Plan, paymentRef: string) => {
    await api.post('/platform/manage/buy', {
      subscriptionId: plan.id,
      adminEmail: user?.email,
      paymentMethod: 'razorpay',
      paymentRef,
    });
    setPayRef(paymentRef);
    setPayStep('success');
    api.get('/platform/subscription-status').then(r => setStatus(r.data)).catch(() => {});
  };

  const pay = async () => {
    if (!selected || !user?.email) return;
    setPayStep('processing'); setError('');

    try {
      // Free plan — activate directly
      if (selected.price === 0) {
        await activateSubscription(selected, `FREE-${Date.now()}`);
        return;
      }

      // Try Razorpay — fall back to dummy if not configured
      let rzData: { orderId: string; amount: number; currency: string; keyId: string } | null = null;
      try {
        const amountPaise = Math.round(selected.price * 100);
        const { data } = await api.post('/payment/subscriptions/create', {
          amount: amountPaise,
          currency: 'INR',
          referenceId: selected.id,
        });
        rzData = data;
      } catch {
        // Payment service not configured — use dummy payment
        await activateSubscription(selected, `DUMMY-${Date.now()}`);
        return;
      }

      if (!rzData) {
        await activateSubscription(selected, `DUMMY-${Date.now()}`);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Razorpay script failed to load');

      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay({
          key: rzData!.keyId,
          amount: rzData!.amount,
          currency: rzData!.currency,
          order_id: rzData!.orderId,
          name: 'Platform Subscription',
          description: `${selected.name} — ${PERIOD_LABEL[selected.billingPeriod]}`,
          prefill: { email: user.email },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await api.post('/payment/subscriptions/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              await activateSubscription(selected, response.razorpay_payment_id);
              resolve();
            } catch { reject(new Error('Payment verification failed')); }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
        });
        rzp.open();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Payment failed');
      setPayStep('confirm');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Choose a Subscription Plan</h1>
        <p className="text-neutral-500 text-sm">Select a plan to activate or renew your store access.</p>
      </div>

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
            <Card key={plan.id} className={`cursor-pointer transition-all hover:shadow-lg ${isCurrent ? 'border-2 border-green-500 bg-green-50/30' : 'hover:border-2 hover:border-black'}`}
              onClick={() => openConfirm(plan)}>
              <CardHeader className="pb-2 pt-6">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {isCurrent && <Badge className="bg-green-500 text-white text-xs shrink-0">Current Plan</Badge>}
                </div>
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
                <Button className="w-full" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
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

                  {selected.price > 0 && (
                    <p className="text-xs text-neutral-500 text-center">
                      You will be redirected to Razorpay to complete payment securely.
                    </p>
                  )}

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <div className="flex gap-2">
                    {(() => {
                      const priceLabel = selected.price === 0 ? 'Activate Free' : `Pay ${selected.currency} ${selected.price.toLocaleString()}`;
                      const btnContent = payStep === 'processing'
                        ? <><Loader2 size={14} className="mr-2 animate-spin" />Processing…</>
                        : priceLabel;
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
