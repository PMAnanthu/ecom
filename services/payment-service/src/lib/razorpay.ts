import Razorpay from 'razorpay';
import crypto from 'crypto';

export function createRazorpayClient(keyId: string, keySecret: string): Razorpay {
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function verifySignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string, keySecret: string): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
  return expected === signature;
}
