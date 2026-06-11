import { neon } from '@neondatabase/serverless';

function getDatabaseUrl(): string {
  const url = (
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    ''
  ).trim();

  if (!url) {
    throw new Error('Missing database connection string.');
  }
  return url;
}

export function getSqlClient() {
  let url = getDatabaseUrl();

  try {
    // The HTTP-based 'neon()' driver works best with the direct hostname (no -pooler)
    if (url.includes('-pooler.')) {
      url = url.replace('-pooler.', '.');
    }

    // Strip parameters that might cause issues with the HTTP proxy
    // especially channel_binding=require which is for TCP pooling
    const urlObj = new URL(url);
    urlObj.searchParams.delete('channel_binding');
    url = urlObj.toString();
  } catch (err) {
    // If URL parsing fails, we fallback to the original URL but it might crash later
    console.error('[db] URL sanitization failed', err);
  }

  return neon(url);
}
