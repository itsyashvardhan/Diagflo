import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { DiagfloLogo } from "@/components/logo/DiagfloLogo";

const LandingNavbar = () => {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState("hero");

  useEffect(() => {
    const handler = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  // Listen for slide changes from LandingPage
  useEffect(() => {
    const handleActiveSlide = (e: Event) => {
      setActiveSlide((e as CustomEvent).detail.id);
    };
    window.addEventListener("active-slide-changed", handleActiveSlide);
    return () => window.removeEventListener("active-slide-changed", handleActiveSlide);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    const nowDark = document.documentElement.classList.contains("dark");
    setIsDark(nowDark);
    window.dispatchEvent(new Event("theme-changed"));
  };

  const handleNavClick = (id: string, mobile = false) => {
    if (mobile) setMobileMenuOpen(false);

    // Check if we are on desktop layout
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;

    // Only dispatch custom event if on landing page AND desktop layout
    if (window.location.pathname === "/" && isDesktop) {
      window.dispatchEvent(new CustomEvent("nav-to-section", { detail: { id } }));
    } else {
      // Fallback to native hash scrolling for mobile layout or external pages
      window.location.href = `/#${id}`;
    }
  };

  const getNavLinkTone = (id: string) => {
    const isActive = activeSlide === id;
    if (isDark) {
      return `transition-colors ${isActive
        ? "bg-white/10 text-white font-medium"
        : "text-white/75 hover:bg-white/10 hover:text-white"
        }`;
    }
    return `transition-colors ${isActive
      ? "bg-black/5 text-black font-medium"
      : "text-black/70 hover:bg-black/5 hover:text-black"
      }`;
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-orange-500 focus:text-white focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      <nav
        className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${isDark
          ? "bg-[#090a0f]/85 border-white/10 text-white"
          : "bg-[#f4f6f8]/85 border-black/10 text-[#111827]"
          }`}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {window.location.pathname === "/" ? (
              <button
                onClick={() => handleNavClick("hero")}
                className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
              >
                <DiagfloLogo className="w-8 h-8 shrink-0" />
                <div className="leading-tight min-w-0">
                  <span className="text-sm font-bold tracking-tight block truncate">Diagflo</span>
                </div>
              </button>
            ) : (
              <Link to="/" className="flex items-center gap-2.5 min-w-0">
                <DiagfloLogo className="w-8 h-8 shrink-0" />
                <div className="leading-tight min-w-0">
                  <span className="text-sm font-bold tracking-tight block truncate">Diagflo</span>
                </div>
              </Link>
            )}
          </div>

          <div
            className={`hidden md:flex items-center gap-1.5 rounded-full border px-2 py-1 ${isDark ? "border-white/15 bg-white/[0.03]" : "border-black/10 bg-white/70"
              }`}
          >
            {window.location.pathname === "/" ? (
              <>
                <button onClick={() => handleNavClick("hero")} className={`px-3 py-1.5 rounded-full text-sm ${getNavLinkTone("hero")}`} aria-label="Home">
                  <Home className="h-4 w-4" />
                </button>
                <button onClick={() => handleNavClick("features")} className={`px-3 py-1.5 rounded-full text-sm ${getNavLinkTone("features")}`}>
                  Features
                </button>
                <button onClick={() => handleNavClick("workflow")} className={`px-3 py-1.5 rounded-full text-sm ${getNavLinkTone("workflow")}`}>
                  Workflow
                </button>
                <button onClick={() => handleNavClick("security")} className={`px-3 py-1.5 rounded-full text-sm ${getNavLinkTone("security")}`}>
                  Security
                </button>
              </>
            ) : (
              <>
                <Link to="/#features" className={`px-3 py-1.5 rounded-full text-sm ${getNavLinkTone("features")}`}>Features</Link>
                <Link to="/#how-it-works" className={`px-3 py-1.5 rounded-full text-sm ${getNavLinkTone("workflow")}`}>Workflow</Link>
                <Link to="/#security" className={`px-3 py-1.5 rounded-full text-sm ${getNavLinkTone("security")}`}>Security</Link>
              </>
            )}
            <Link to="/docs" className={`px-3 py-1.5 rounded-full text-sm transition-colors ${isDark ? "text-white/75 hover:bg-white/10 hover:text-white" : "text-black/70 hover:bg-black/5 hover:text-black"
              }`}>
              Docs
            </Link>

          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${isDark
                ? "border-white/15 bg-white/[0.03] text-white/80 hover:bg-white/10"
                : "border-black/10 bg-white text-black/70 hover:bg-black/5"
                }`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/app"
              className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${isDark
                ? "bg-white text-black hover:bg-white/90"
                : "bg-[#111827] text-white hover:bg-[#1f2937]"
                }`}
            >
              <Sparkles className="h-4 w-4" />
              <span className="sm:hidden">App</span>
              <span className="hidden sm:inline">Open App</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-nav"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className={`md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${isDark
                ? "border-white/15 bg-white/[0.03] text-white/80 hover:bg-white/10"
                : "border-black/10 bg-white text-black/70 hover:bg-black/5"
                }`}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div
          id="landing-mobile-nav"
          className={`md:hidden overflow-hidden transition-[max-height,opacity,padding] duration-200 ${mobileMenuOpen ? "max-h-80 opacity-100 pb-3" : "max-h-0 opacity-0 pointer-events-none"
            }`}
        >
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <div
              className={`rounded-2xl border p-2.5 ${isDark ? "border-white/15 bg-white/[0.03]" : "border-black/10 bg-white/80"
                }`}
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                {window.location.pathname === "/" ? (
                  <>
                    <button onClick={() => handleNavClick("features", true)} className={`rounded-xl px-3 py-2 text-left ${getNavLinkTone("features")}`}>Features</button>
                    <button onClick={() => handleNavClick("workflow", true)} className={`rounded-xl px-3 py-2 text-left ${getNavLinkTone("workflow")}`}>Workflow</button>
                    <button onClick={() => handleNavClick("security", true)} className={`rounded-xl px-3 py-2 text-left ${getNavLinkTone("security")}`}>Security</button>
                  </>
                ) : (
                  <>
                    <Link to="/#features" onClick={() => setMobileMenuOpen(false)} className={`rounded-xl px-3 py-2 text-left transition-colors ${isDark ? "text-white/75 hover:bg-white/10" : "text-black/70 hover:bg-black/5"
                      }`}>Features</Link>
                    <Link to="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className={`rounded-xl px-3 py-2 text-left transition-colors ${isDark ? "text-white/75 hover:bg-white/10" : "text-black/70 hover:bg-black/5"
                      }`}>Workflow</Link>
                    <Link to="/#security" onClick={() => setMobileMenuOpen(false)} className={`rounded-xl px-3 py-2 text-left transition-colors ${isDark ? "text-white/75 hover:bg-white/10" : "text-black/70 hover:bg-black/5"
                      }`}>Security</Link>
                  </>
                )}
                <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className={`rounded-xl px-3 py-2 text-left transition-colors ${isDark ? "text-white/75 hover:bg-white/10" : "text-black/70 hover:bg-black/5"
                  }`}>
                  Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default LandingNavbar;
