/**
 * Minimalist Logger - Integrated with Diagflo's clean design philosophy
 * Only logs significant events in development, stays silent in production.
 */

const isDev = import.meta.env.DEV;

export const logger = {
    info: (message: string, ...args: unknown[]) => {
        if (isDev) {
            console.log(`%c[Diagflo]%c ${message}`, 'color: #f97316; font-weight: bold;', 'color: inherit;', ...args);
        }
    },
    warn: (message: string, ...args: unknown[]) => {
        if (isDev) {
            console.warn(`%c[Diagflo]%c ${message}`, 'color: #f97316; font-weight: bold;', 'color: inherit;', ...args);
        }
    },
    error: (message: string, ...args: unknown[]) => {
        // Errors are always logged for troubleshooting
        console.error(`%c[Diagflo Error]%c ${message}`, 'color: #ef4444; font-weight: bold;', 'color: inherit;', ...args);
    }
};
