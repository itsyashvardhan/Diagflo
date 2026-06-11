import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

// Eagerly loaded — renders instantly as the lightest first chunk
import LandingNavbar from "./components/landing/LandingNavbar";

// Lazy-loaded pages for route-level code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const DocsPage = lazy(() => import("./pages/DocsPage"));
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

const queryClient = new QueryClient();

// Route-level loading fallback matching app theme
const PageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-muted-foreground">Loading page...</p>
    </div>
  </div>
);

// Keep above-the-fold content visible while LandingPage chunk loads
const LandingFallback = () => (
  <section className="relative overflow-hidden min-h-[calc(100dvh-3.5rem)] flex items-center border-b border-black/10 dark:border-white/10 bg-[#f4f6f8] dark:bg-[#090a0f]">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl bg-orange-300/30 dark:bg-orange-500/18" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl bg-amber-200/35 dark:bg-amber-500/10" />
    </div>
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.03] text-[#111827] dark:text-[#f5f7fb]">
        Turn complex ideas into clear diagrams.
      </h1>
      <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-black/65 dark:text-white/70">
        Describe. Visualise. Done.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-black/60 dark:text-white/65">Loading workspace preview...</span>
      </div>
    </div>
  </section>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Navbar is eagerly loaded and renders instantly.
                LandingPage body lazy-loads naturally behind it. */}
            <Route
              path="/"
              element={
                <div className="lg:h-screen lg:overflow-hidden lg:flex lg:flex-col">
                  <LandingNavbar />
                  <Suspense fallback={<LandingFallback />}>
                    <LandingPage />
                  </Suspense>
                </div>
              }
            />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/app" element={<Index />} />
            <Route path="/d/:shareId" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
