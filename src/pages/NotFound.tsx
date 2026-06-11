import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { DiagfloLogo } from "@/components/logo/DiagfloLogo";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Page Not Found | Diagflo";
    logger.warn("404 - Non-existent route accessed: " + location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-md">
        {/* Logo */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 shadow-2xl backdrop-blur-sm">
          <DiagfloLogo className="w-14 h-14 opacity-80" />
        </div>

        {/* 404 number */}
        <h1 className="text-8xl sm:text-9xl font-bold tracking-tighter gradient-text select-none leading-none">
          404
        </h1>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Page not found
          </h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            The path{" "}
            <code className="glass-panel px-2 py-0.5 rounded text-xs font-mono text-primary">
              {location.pathname}
            </code>{" "}
            doesn't exist. It may have been moved or removed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button asChild className="gap-2 w-full sm:w-auto">
            <Link to="/">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 glass-panel w-full sm:w-auto">
            <Link to="/app">
              <Search className="w-4 h-4" />
              Open App
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="gap-2 w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>

        {/* Subtle decorative broken graph nodes */}
        <div className="mt-6 flex items-center gap-4 opacity-20 select-none" aria-hidden="true">
          <div className="w-10 h-10 rounded border border-white/30 flex items-center justify-center text-xs text-white/40">A</div>
          <div className="w-8 border-t border-dashed border-white/20" />
          <div className="w-3 h-3 rounded-full border border-white/30 bg-destructive/30" />
          <div className="w-8 border-t border-dashed border-white/20" />
          <div className="w-10 h-10 rounded border border-white/30 flex items-center justify-center text-xs text-white/40">?</div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
