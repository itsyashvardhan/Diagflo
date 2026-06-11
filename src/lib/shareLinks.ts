import { logger } from './logger';

/**
 * Share Link Storage - Manages short shareable links for diagrams
 * Using Neon-backed server endpoints for true cross-device sharing.
 * Includes automatic retry logic for transient network/521 errors.
 */

interface SharedDiagram {
    id: string;
    code: string;
    title?: string;
    createdAt: string;
}

interface CreateShareLinkResponse {
    id: string;
}

interface SharedDiagramResponse {
    id: string;
    code: string;
    title?: string | null;
    createdAt: string;
}

class RetryableError extends Error {}

const SHARE_LINKS_ENDPOINT = '/api/share-links';

async function parseJson<T>(response: Response): Promise<T | null> {
    try {
        return (await response.json()) as T;
    } catch {
        return null;
    }
}

/**
 * Retry wrapper for share-link API operations.
 * Handles transient 521 (origin down) and network errors with exponential backoff.
 */
async function withRetry<T>(
    operation: () => Promise<T>,
    label: string,
    maxRetries = 2,
    baseDelayMs = 1000
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (err: unknown) {
            lastError = err;
            const isRetryable =
                err instanceof RetryableError ||
                err instanceof TypeError || // Network error / CORS failure
                (err instanceof Error && /fetch|network|521|CORS/i.test(err.message));

            if (!isRetryable || attempt === maxRetries) {
                throw err;
            }

            const delay = baseDelayMs * Math.pow(2, attempt);
            logger.warn(`[${label}] Transient error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, {
                error: err instanceof Error ? err.message : String(err),
            });
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError; // Should never reach here, but satisfies TypeScript
}

/**
 * Generate a short alphanumeric ID in format xxxx-xxxx-xxxx
 */
export function generateShareId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const segment = () => {
        let result = "";
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };
    return `${segment()}-${segment()}-${segment()}`;
}

/**
 * Create a shareable link for a diagram in Neon (via API)
 * Returns the short ID and full URL
 */
export async function createShareLink(code: string, title?: string): Promise<{ id: string; url: string }> {
    if (!code.trim()) {
        throw new Error("Cannot create a share link for an empty diagram.");
    }

    return withRetry(async () => {
        logger.info("Creating share link...", { codeLength: code.length, title });

        const response = await fetch(SHARE_LINKS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, title }),
        });
        const payload = await parseJson<CreateShareLinkResponse & { error?: string }>(response);

        if (response.status >= 500 || response.status === 429) {
            throw new RetryableError(payload?.error || `Server error (${response.status}) while creating share link`);
        }

        if (!response.ok) {
            throw new Error(payload?.error || `Failed to create share link (${response.status})`);
        }

        if (!payload?.id) {
            throw new Error("Share link creation succeeded but response is missing ID.");
        }

        logger.info("Share link created successfully", payload.id);
        return {
            id: payload.id,
            url: `${window.location.origin}/d/${payload.id}`,
        };
    }, "createShareLink");
}

/**
 * Retrieve a shared diagram by ID from Neon (via API)
 */
export async function getSharedDiagram(id: string): Promise<SharedDiagram | null> {
    if (!id.trim()) {
        return null;
    }

    return withRetry(async () => {
        logger.info("Fetching shared diagram", id);

        const response = await fetch(`${SHARE_LINKS_ENDPOINT}?id=${encodeURIComponent(id)}`, {
            method: 'GET',
        });
        const payload = await parseJson<SharedDiagramResponse & { error?: string }>(response);

        if (response.status === 404) {
            logger.warn("Shared diagram not found", { id });
            return null;
        }

        if (response.status >= 500 || response.status === 429) {
            throw new RetryableError(payload?.error || `Server error (${response.status}) while loading shared diagram`);
        }

        if (!response.ok || !payload) {
            logger.error("Failed to fetch shared diagram", { id, status: response.status, error: payload?.error });
            return null;
        }

        logger.info("Shared diagram found", { id: payload.id, title: payload.title });
        return {
            id: payload.id,
            code: payload.code,
            title: payload.title || undefined,
            createdAt: payload.createdAt
        };
    }, "getSharedDiagram");
}
