import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSqlClient } from './_db';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ApiError = { error: string };
type WaitlistResponse = { ok: true; inserted: boolean };

function sendError(res: VercelResponse, status: number, error: string): void {
  res.status(status).json({ error });
}

function parseBody<T>(req: VercelRequest): T {
  if (!req.body) {
    return {} as T;
  }
  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as T;
  }
  return req.body as T;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      sendError(res, 405, 'Method not allowed.');
      return;
    }

    const body = parseBody<{ email?: unknown }>(req);
    if (typeof body.email !== 'string') {
      sendError(res, 400, 'Email is required.');
      return;
    }

    const email = body.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      sendError(res, 400, 'A valid email address is required.');
      return;
    }

    const sql = getSqlClient();
    const existingResult = await sql`
      SELECT email
      FROM public.waitlist
      WHERE lower(email) = lower(${email})
      LIMIT 1
    `;
    const existing = Array.isArray(existingResult) ? (existingResult as Array<{ email: string }>) : [];

    if (existing.length > 0) {
      res.status(200).json({ ok: true, inserted: false });
      return;
    }

    await sql`
      INSERT INTO public.waitlist (email)
      VALUES (${email})
    `;

    res.status(200).json({ ok: true, inserted: true });
  } catch (error: any) {
    console.error('[api/waitlist] Request failed', error);
    if (error instanceof Error && /Missing database connection string/i.test(error.message)) {
      sendError(res, 503, 'Database connection is not configured. Set NEON_DATABASE_URL.');
      return;
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
      sendError(res, 503, 'Database table is not initialized. Please run db/schema.sql.');
      return;
    }
    if (error && typeof error === 'object' && 'code' in error && (error.code === '28P01' || error.code === '3D000')) {
      sendError(res, 503, 'Database credentials are invalid for the configured connection string.');
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    sendError(res, 500, `Server error while handling waitlist: ${message}`);
  }
}
