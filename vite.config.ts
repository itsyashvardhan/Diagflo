import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Plugin } from "vite";

// Dev middleware that emulates Vercel serverless functions for /api/* routes
function vercelApiDevPlugin(apiBaseUrl?: string): Plugin {
  const PREVIEW_PROXY_TIMEOUT_MS = 15000;

  const apiMiddleware = async (req: any, res: any, next: () => void) => {
    // Only intercept /api/* requests
    if (!req.url?.startsWith("/api/")) {
      return next();
    }

    const route = req.url.replace(/^\/api\//, "").replace(/\?.*$/, "");
    const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";

    try {
      // Dynamically import the serverless function handler in dev.
      // Preview server does not expose ssrLoadModule in the same way.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const server = (req as any).__viteServer;
      const ssrLoadModule = server && typeof server.ssrLoadModule === "function"
        ? server.ssrLoadModule.bind(server)
        : null;

      if (!ssrLoadModule) {
        if (apiBaseUrl) {
          const target = `${apiBaseUrl.replace(/\/+$/, "")}/api/${route}${queryString}`;
          let targetUrl: URL;
          try {
            targetUrl = new URL(target);
          } catch {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              error: "Invalid VITE_API_BASE_URL",
              message: "Set VITE_API_BASE_URL to a valid absolute URL.",
            }));
            return;
          }

          // Guard against self-proxy loops (e.g. VITE_API_BASE_URL=http://localhost:4173)
          const requestHost = String(req.headers.host || "");
          if (
            targetUrl.host === requestHost &&
            targetUrl.pathname === `/api/${route}`
          ) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              error: "Preview proxy loop detected",
              message: "VITE_API_BASE_URL points to the same preview origin. Use your deployed backend URL.",
            }));
            return;
          }

          const hasRequestBody = !["GET", "HEAD"].includes(String(req.method).toUpperCase());
          let bodyStr = "";
          if (hasRequestBody) {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            bodyStr = Buffer.concat(chunks).toString("utf-8");
          }
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), PREVIEW_PROXY_TIMEOUT_MS);
          let upstream: Response;
          try {
            upstream = await fetch(target, {
              method: req.method,
              headers: {
                "Content-Type": req.headers["content-type"] || "application/json",
              },
              body: bodyStr || undefined,
              signal: controller.signal,
            });
          } catch (proxyErr: any) {
            if (proxyErr?.name === "AbortError") {
              res.statusCode = 504;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({
                error: "Preview upstream timeout",
                message: "Timed out reaching VITE_API_BASE_URL. Check backend availability.",
              }));
              return;
            }
            throw proxyErr;
          } finally {
            clearTimeout(timeout);
          }

          const text = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
          res.end(text);
          return;
        }

        res.statusCode = 501;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
          error: "Preview API unavailable",
          message: "Set VITE_API_BASE_URL to a deployed backend for /api/* calls in preview mode.",
        }));
        return;
      }

      const handlerModule = await ssrLoadModule(`./api/${route}.ts`);
      const handler = handlerModule.default;

      if (typeof handler !== "function") {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `No handler for /api/${route}` }));
        return;
      }

      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const bodyStr = Buffer.concat(chunks).toString("utf-8");
      let body: unknown = {};
      if (bodyStr) {
        try {
          body = JSON.parse(bodyStr);
        } catch {
          body = bodyStr;
        }
      }

      const parsedUrl = new URL(req.url, "http://localhost");
      const query: Record<string, string | string[]> = {};
      for (const [key, value] of parsedUrl.searchParams.entries()) {
        const existing = query[key];
        if (existing === undefined) {
          query[key] = value;
        } else if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          query[key] = [existing, value];
        }
      }

      // Build mock VercelRequest/VercelResponse
      const mockReq = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body,
        query,
      };

      const mockRes = {
        _statusCode: 200,
        _headers: {} as Record<string, string>,
        _body: null as any,
        status(code: number) {
          this._statusCode = code;
          return this;
        },
        setHeader(key: string, value: string) {
          this._headers[key] = value;
          return this;
        },
        json(data: any) {
          this._body = data;
          res.statusCode = this._statusCode;
          res.setHeader("Content-Type", "application/json");
          for (const [k, v] of Object.entries(this._headers)) {
            res.setHeader(k, v);
          }
          res.end(JSON.stringify(data));
        },
      };

      await handler(mockReq, mockRes);
    } catch (err: any) {
      console.error(`[vercel-api-dev] Error handling /api/${route}:`, err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err.message }));
    }
  };

  return {
    name: "vercel-api-dev",
    configureServer(server) {
      server.middlewares.use((req: any, _res: any, next: () => void) => {
        req.__viteServer = server;
        next();
      });
      server.middlewares.use(apiMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use((req: any, _res: any, next: () => void) => {
        req.__viteServer = server;
        next();
      });
      server.middlewares.use(apiMiddleware);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables so they're available to serverless function handlers
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL;
  // Inject non-VITE_ env vars into process.env for the API handlers
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith("VITE_")) {
      process.env[key] = value;
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), vercelApiDevPlugin(apiBaseUrl)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: "node",
      include: ["src/**/*.test.{ts,tsx}"],
    },
    esbuild: {
      pure: ["console.log"],
      drop: ["debugger"],
      legalComments: "none",
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
              return "vendor";
            }
          },
          chunkFileNames: "assets/[hash].js",
          entryFileNames: "assets/[hash].js",
          assetFileNames: "assets/[hash].[ext]",
        },
      },
    },
  };
});
