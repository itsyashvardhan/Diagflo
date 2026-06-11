import type { VercelRequest, VercelResponse } from '@vercel/node';
import shareLinksHandler from './share-links';

// Alias route for diagram APIs.
// Supports:
// - POST /api/diagram
// - GET /api/diagram?id=xxxx-xxxx-xxxx
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return shareLinksHandler(req, res);
}
