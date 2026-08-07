import { Storage } from '@google-cloud/storage';

const BUCKET = process.env.GCS_BUCKET || 'ecom-uploads-e-com-504518';
const USE_GCS = process.env.NODE_ENV === 'production' || !!process.env.GCS_BUCKET;

interface StoreConfigPayload {
  id: string;
  name: string;
  subdomain: string;
  storeUrlId?: string | null;
  domain?: string | null;
  email?: string | null;
  phone?: string | null;
  template: string;
  branding: unknown;
  published: boolean;
  updatedAt: Date;
}

// Publishes store config as a static JSON to GCS so the storefront
// can fetch it directly without hitting the DB on every page load.
export async function publishStoreConfig(store: StoreConfigPayload): Promise<void> {
  if (!USE_GCS) return; // skip in local dev

  try {
    const storage = new Storage();
    const bucket = storage.bucket(BUCKET);
    const filename = `config/${store.subdomain}.json`;
    const file = bucket.file(filename);
    const content = JSON.stringify({
      id: store.id,
      name: store.name,
      subdomain: store.subdomain,
      storeUrlId: store.storeUrlId ?? null,
      domain: store.domain ?? null,
      email: store.email ?? null,
      phone: store.phone ?? null,
      template: store.template,
      branding: store.branding,
      published: store.published,
      updatedAt: store.updatedAt,
    });
    await file.save(Buffer.from(content), { contentType: 'application/json', public: true });
  } catch (err) {
    // Non-fatal — storefront falls back to resolve API
    console.error('[configPublisher] Failed to publish config for', store.subdomain, err);
  }
}
