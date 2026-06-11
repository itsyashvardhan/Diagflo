import type { VercelRequest, VercelResponse } from '@vercel/node';
import shareLinksHandler from './share-links';

// Backward-compat route alias.
// Supports:
// - POST /api/shared_diagram
// - GET /api/shared_diagram?id=xxxx-xxxx-xxxx
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return shareLinksHandler(req, res);
}
