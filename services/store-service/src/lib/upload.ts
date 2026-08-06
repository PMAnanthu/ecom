import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import { Request, Response } from 'express';

const BUCKET = process.env.GCS_BUCKET || 'ecom-uploads-e-com-504518';
const USE_GCS = process.env.NODE_ENV === 'production' || !!process.env.GCS_BUCKET;

// Use memory storage — files go to GCS in prod, disk in dev
export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export async function saveUpload(req: Request, res: Response): Promise<string> {
  if (!req.file) throw new Error('No file uploaded');

  if (USE_GCS) {
    const storage = new Storage();
    const bucket = storage.bucket(BUCKET);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const file = bucket.file(filename);
    await file.save(req.file.buffer, { contentType: req.file.mimetype, public: true });
    return `https://storage.googleapis.com/${BUCKET}/${filename}`;
  }

  // Local dev: save to disk
  const fs = await import('node:fs');
  const path = await import('node:path');
  const crypto = await import('node:crypto');
  const uploadDir = path.join(__dirname, '../../uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const filename = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
  return `/uploads/${filename}`;
}
