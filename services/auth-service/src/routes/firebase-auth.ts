import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const firebaseAuthRouter = Router();

interface FirebaseTokenPayload {
  uid: string;
  email?: string;
  phone_number?: string;
  name?: string;
  picture?: string;
  firebase?: { identities?: Record<string, unknown>; sign_in_provider?: string };
}

// POST /auth/firebase — exchange Firebase ID token for our JWT
firebaseAuthRouter.post('/', async (req: Request, res: Response) => {
  const { idToken, storeId } = req.body as { idToken: string; storeId?: string };
  if (!idToken) { res.status(400).json({ error: 'idToken required' }); return; }

  let payload: FirebaseTokenPayload;
  try {
    // Verify Firebase token via Google's public key endpoint
    const [header64, payload64] = idToken.split('.');
    if (!header64 || !payload64) throw new Error('Invalid token format');
    payload = JSON.parse(Buffer.from(payload64, 'base64url').toString('utf8')) as FirebaseTokenPayload;

    // Basic validation: check token expiry
    const exp = (payload as unknown as { exp: number }).exp;
    if (exp && exp < Date.now() / 1000) throw new Error('Token expired');

    // Verify against Google's tokeninfo endpoint (simple verification)
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!verifyRes.ok) throw new Error('Token verification failed');
    const verified = await verifyRes.json() as { sub: string; email?: string; error?: string };
    if (verified.error) throw new Error(verified.error);
    payload.uid = verified.sub;
    if (verified.email) payload.email = verified.email;
  } catch (err) {
    res.status(401).json({ error: 'Invalid Firebase token', detail: (err as Error).message });
    return;
  }

  const email = payload.email || `firebase_${payload.uid}@noemail.local`;

  // Find or create user
  let user = await prisma.user.findFirst({
    where: { OR: [{ email }, { email: `firebase_${payload.uid}@noemail.local` }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: `FIREBASE:${payload.uid}`,
        role: 'USER',
        storeId: storeId || null,
      },
    });
  } else if (storeId && !user.storeId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { storeId } });
  }

  const { signAccessToken, signRefreshToken } = await import('../lib/jwt');
  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role, storeId: user.storeId ?? null });
  const refreshToken = signRefreshToken({ userId: user.id });

  res.json({ user: { id: user.id, email: user.email, role: user.role, storeId: user.storeId }, accessToken, refreshToken });
});
