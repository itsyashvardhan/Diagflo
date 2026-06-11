import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Boxes,
  CheckCircle2,
  Code2,
  Database,
  Download,
  GitBranch,
  GraduationCap,
  Lock,
  MessageSquareText,
  Network,
  Route,
  Share2,
  Sparkles,
} from "lucide-react";
import { useCanonical } from "@/hooks/use-canonical";
import { HeroAnimation } from "@/components/landing/HeroAnimation";

// --- Mobile Reveal Hook ---
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  return { ref, visible };
}

const capabilityCards = [
  {
    icon: MessageSquareText,
    title: "Prompt-to-diagram",
    description: "Describe any process, system, workflow, or plan in plain language and iterate conversationally.",
  },
  {
    icon: Network,
    title: "20+ diagram formats",
    description: "Flowcharts, sequence, ER, C4, timelines, mindmaps, Sankey and more.",
  },
  {
    icon: Code2,
    title: "Editable code first",
    description: "Inspect and edit Mermaid/Chart DSL directly, then re-render instantly.",
  },
  {
    icon: Sparkles,
    title: "Self-healing output",
    description: "Auto-sanitization and validation reduce broken diagram states.",
  },
  {
    icon: Share2,
    title: "Shareable reviews",
    description: "Generate links for async feedback without requiring account setup.",
  },
  {
    icon: Download,
    title: "Export-ready assets",
    description: "Move from ideation to docs and handoff with minimal friction.",
  },
];

const workflowSteps = [
  {
    id: "01",
    title: "Describe the problem",
    body: "Start with your context: product flow, ops process, architecture, research map, or decision tree.",
  },
  {
    id: "02",
    title: "Generate and refine",
    body: "Diagflo drafts the diagram, then you iterate with follow-up prompts or direct code edits.",
  },
  {
    id: "03",
    title: "Ship and share",
    body: "Export outputs, restore past versions, and share links for review or documentation.",
  },
];

const useCaseTracks = [
  {
    icon: GitBranch,
    title: "Engineering & Design"
  },
  {
    icon: Briefcase,
    title: "Product & Operations"
  },
  {
    icon: BarChart3,
    title: "Data & Analytics"
  },
  {
    icon: GraduationCap,
    title: "Education & Research"
  },
];

const switchReasons = [
  {
    icon: Boxes,
    title: "Flexible by design",
    body: "Keep output in open, editable diagram formats that are easy to review and reuse.",
  },
  {
    icon: Route,
    title: "Built for iteration",
    body: "Chat, code editing, history restore, and retries are all in one continuous workspace.",
  },
  {
    icon: Lock,
    title: "Practical trust model",
    body: "Clear controls for local history, explicit sharing, and provider-bound key handling.",
  },
];

const dataHandling = [
  "Gemini mode uses your personal API key from browser settings.",
  "Shared links are created only when you explicitly publish.",
  "Local history stays in your browser storage.",
];

const techStack = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Vercel",
  "Gemini API",
];

const SLIDES = ["hero", "features", "workflow", "security"];

const LandingPage = () => {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  const [heroReady, setHeroReady] = useState(false);

  // Desktop Horizontal State
  const [isDesktop, setIsDesktop] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const isScrolling = useRef(false);

  // Mobile Reveals
  const capabilitiesRevealMobile = useReveal();
  const workflowRevealMobile = useReveal();
  const trustRevealMobile = useReveal();
  const ctaRevealMobile = useReveal();

  useCanonical("/");

  // Check viewport size
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia("(min-width: 1024px)").matches);
    };
    checkDesktop(); // call initially
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Handle global theme
  useEffect(() => {
    document.title = "Diagflo — AI Diagram Workspace for Teams";
    const onThemeChange = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    window.addEventListener("theme-changed", onThemeChange);

    const t = requestAnimationFrame(() => setHeroReady(true));
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("theme-changed", onThemeChange);
    };
  }, []);

  // Handle external navigation events (from Navbar) for Desktop
  useEffect(() => {
    if (!isDesktop) return;
    const handleNavEvent = (e: Event) => {
      const targetId = (e as CustomEvent).detail.id;
      const index = SLIDES.indexOf(targetId);
      if (index !== -1 && index !== currentSlide) {
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
      }
    };
    window.addEventListener("nav-to-section", handleNavEvent);
    return () => window.removeEventListener("nav-to-section", handleNavEvent);
  }, [currentSlide, isDesktop]);

  // Handle wheel scrolling for Desktop
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isDesktop) return;

    // Always prevent default native scrolling on desktop to block rubber-banding and bleed
    e.preventDefault();

    if (isScrolling.current) return;

    const threshold = 50;
    // Support horizontal trackpad swipes as well for presentation deck feel
    const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    const delta = isHorizontal ? e.deltaX : e.deltaY;

    if (Math.abs(delta) < threshold) return;

    if (delta > 0) {
      if (currentSlide < SLIDES.length - 1) {
        isScrolling.current = true;
        setDirection(1);
        setCurrentSlide((prev) => prev + 1);
        setTimeout(() => { isScrolling.current = false; }, 800);
      }
    } else {
      if (currentSlide > 0) {
        isScrolling.current = true;
        setDirection(-1);
        setCurrentSlide((prev) => prev - 1);
        setTimeout(() => { isScrolling.current = false; }, 800);
      }
    }
  }, [currentSlide, isDesktop]);

  // Handle keyboard navigation for Desktop
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isDesktop) return;
    if (isScrolling.current) return;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      if (currentSlide < SLIDES.length - 1) {
        e.preventDefault();
        isScrolling.current = true;
        setDirection(1);
        setCurrentSlide((prev) => prev + 1);
        setTimeout(() => { isScrolling.current = false; }, 600);
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      if (currentSlide > 0) {
        e.preventDefault();
        isScrolling.current = true;
        setDirection(-1);
        setCurrentSlide((prev) => prev - 1);
        setTimeout(() => { isScrolling.current = false; }, 600);
      }
    }
  }, [currentSlide, isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleWheel, handleKeyDown, isDesktop]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("active-slide-changed", { detail: { id: SLIDES[currentSlide] } })
    );
  }, [currentSlide, isDesktop]);

  // Lock body scroll completely on Desktop
  useEffect(() => {
    if (isDesktop) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isDesktop]);

  // Framer Motion variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const transitionProps = {
    x: { type: "tween", duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
    opacity: { duration: 0.4 },
  };

  const SlideContainerDesktop = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`h-full w-full flex items-center justify-center overflow-hidden ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 w-full py-8 text-left">
        {children}
      </div>
    </div>
  );

  // === RENDER LOGIC ===
  if (!isDesktop) {
    // === MOBILE VERTICAL LAYOUT ===
    return (
      <div
        className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${isDark ? "bg-[#090a0f] text-[#f5f7fb]" : "bg-[#f4f6f8] text-[#111827]"
          }`}
      >
        <main id="main-content">
          <section
            className={`relative overflow-hidden border-b min-h-[calc(100dvh-3.5rem)] flex flex-col ${isDark ? "border-white/10" : "border-black/10"
              }`}
            aria-labelledby="hero-heading"
          >
            <div className="pointer-events-none absolute inset-0">
              <div
                className={`absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl ${isDark ? "bg-orange-500/18" : "bg-orange-300/30"
                  }`}
              />
              <div
                className={`absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl ${isDark ? "bg-amber-500/10" : "bg-amber-200/35"
                  }`}
              />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 flex-1 flex flex-col justify-center">
              <div className="grid min-w-0 items-center gap-4">
                <div
                  className={`min-w-0 transition-all duration-700 ${heroReady
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                    }`}
                >
                  <h1
                    id="hero-heading"
                    className="mt-4 text-4xl font-semibold tracking-tight leading-[1.03]"
                  >
                    Turn complex ideas into clear diagrams.
                  </h1>
                  <p
                    className={`mt-5 max-w-2xl text-base leading-relaxed ${isDark ? "text-white/70" : "text-black/65"
                      }`}
                  >
                    Describe. Visualise. Done.
                  </p>
                </div>
                <div className="relative flex items-center justify-center">
                  <HeroAnimation />
                </div>
                <div className={`flex flex-row items-center gap-3 transition-all duration-700 ${heroReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                  <Link
                    to="/docs"
                    className={`flex-1 justify-center inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${isDark
                      ? "border-white/20 text-white/90 hover:bg-white/10"
                      : "border-black/15 text-black/80 hover:bg-black/5"
                      }`}
                  >
                    View Docs
                  </Link>
                  <Link
                    to="/app"
                    className={`flex-1 justify-center inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${isDark
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-[#111827] text-white hover:bg-[#1f2937]"
                      }`}
                  >
                    Open Workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section
            id="features"
            className={`py-14 border-b ${isDark ? "border-white/10" : "border-black/10"}`}
          >
            <div
              ref={capabilitiesRevealMobile.ref}
              className={`mx-auto max-w-7xl px-4 sm:px-6 transition-all duration-700 ${capabilitiesRevealMobile.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-7"
                }`}
            >
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Built for real team workflows, not just demos.
                </h2>
                <p
                  className={`mt-4 text-base ${isDark ? "text-white/70" : "text-black/65"
                    }`}
                >
                  Every part of the product is optimized for fast iteration, clean
                  output, and fewer broken diagram states.
                </p>
              </div>

              <div className="mt-10 grid gap-4">
                {capabilityCards.map((card) => (
                  <div
                    key={card.title}
                    className={`rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${isDark
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-black/10 bg-white"
                      }`}
                  >
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <p
                      className={`mt-2 text-sm leading-relaxed ${isDark ? "text-white/65" : "text-black/60"
                        }`}
                    >
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="use-cases"
            className={`py-14 border-b ${isDark ? "border-white/10" : "border-black/10"}`}
          >
            <div className="mx-auto max-w-7xl px-4">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Not just system design.
                </h2>
                <p
                  className={`mt-4 text-base ${isDark ? "text-white/70" : "text-black/65"
                    }`}
                >
                  Teams use Diagflo for anything that benefits from clear, shareable visual logic.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4">
                {useCaseTracks.map((track) => (
                  <div
                    key={track.title}
                    className={`rounded-2xl border p-5 ${isDark
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-black/10 bg-white"
                      }`}
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                      <track.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{track.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-white/65" : "text-black/60"}`}>
                      {track.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="workflow"
            className={`py-14 border-b ${isDark ? "border-white/10" : "border-black/10"}`}
          >
            <div
              ref={workflowRevealMobile.ref}
              className={`mx-auto max-w-7xl px-4 transition-all duration-700 ${workflowRevealMobile.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-7"
                }`}
            >
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold tracking-tight">
                  From rough idea to shippable artifact.
                </h2>
              </div>

              <div className="mt-10 grid gap-4">
                {workflowSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`rounded-2xl border p-6 ${isDark
                      ? "border-white/10 bg-black/35"
                      : "border-black/10 bg-white"
                      }`}
                  >
                    <div
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-widest ${isDark
                        ? "bg-orange-500/15 text-orange-300"
                        : "bg-orange-50 text-orange-700"
                        }`}
                    >
                      STEP {step.id}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                    <p
                      className={`mt-3 text-sm leading-relaxed ${isDark ? "text-white/65" : "text-black/60"
                        }`}
                    >
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="security"
            className={`py-14 border-b ${isDark ? "border-white/10" : "border-black/10"}`}
          >
            <div
              ref={trustRevealMobile.ref}
              className={`mx-auto max-w-7xl px-4 transition-all duration-700 ${trustRevealMobile.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
                }`}
            >
              <div className="grid gap-8">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Transparent by default.
                  </h2>
                  <p
                    className={`mt-4 text-base ${isDark ? "text-white/70" : "text-black/65"
                      }`}
                  >
                    Clear boundaries on where data lives and when it is shared.
                  </p>

                  <div className="mt-6 space-y-3">
                    {dataHandling.map((item) => (
                      <div key={item} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                        <p className={isDark ? "text-white/70" : "text-black/65"}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-6 ${isDark
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-black/10 bg-white"
                    }`}
                >
                  <h3 className="text-lg font-semibold">Operational posture</h3>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Credential isolation</p>
                        <p className={`text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                          API credentials are scoped to provider mode.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Controlled persistence</p>
                        <p className={`text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                          Local history is browser-bound.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-14 border-b border-black/10 dark:border-white/10">
            <div className="mx-auto max-w-7xl px-4">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Why teams pick Diagflo over generic tools.
                </h2>
              </div>

              <div className="mt-10 grid gap-4">
                {switchReasons.map((reason) => (
                  <div
                    key={reason.title}
                    className={`rounded-2xl border p-6 ${isDark
                      ? "border-white/10 bg-black/35"
                      : "border-black/10 bg-white"
                      }`}
                  >
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                      <reason.icon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{reason.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-white/65" : "text-black/60"}`}>
                      {reason.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="py-8">
            <div className="mx-auto px-4 flex flex-col items-center gap-4 text-center">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm mt-4">
                <Link to="/privacy" className={isDark ? "text-white/65 hover:text-white" : "text-black/65 hover:text-black"}>Privacy</Link>
                <Link to="/terms" className={isDark ? "text-white/65 hover:text-white" : "text-black/65 hover:text-black"}>Terms</Link>
                <a href="https://github.com/itsyashvardhan/diagflo" target="_blank" rel="noopener noreferrer" className={isDark ? "text-white/65 hover:text-white" : "text-black/65 hover:text-black"}>GitHub</a>
                <a href="https://www.linkedin.com/company/diagflo" target="_blank" rel="noopener noreferrer" className={isDark ? "text-white/65 hover:text-white" : "text-black/65 hover:text-black"}>LinkedIn</a>
              </div>
              <p className={isDark ? "text-white/55 text-sm" : "text-black/55 text-sm"}>
                © {new Date().getFullYear()} Diagflo
              </p>
            </div>
          </footer>
        </main>
      </div>
    );
  }

  // === DESKTOP HORIZONTAL DECK LAYOUT ===
  return (
    <div
      className={`flex-1 min-h-0 w-full overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-[#090a0f] text-[#f5f7fb]" : "bg-[#f4f6f8] text-[#111827]"
        }`}
    >
      <main id="main-content" className="h-full relative w-full pt-0">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transitionProps}
            className="absolute inset-0 w-full h-full overflow-hidden"
          >
            {/* --- SLIDE 0: HERO --- */}
            {currentSlide === 0 && (
              <SlideContainerDesktop>
                <div className="pointer-events-none absolute inset-0 z-0">
                  <div
                    className={`absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl ${isDark ? "bg-orange-500/18" : "bg-orange-300/30"
                      }`}
                  />
                  <div
                    className={`absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl ${isDark ? "bg-amber-500/10" : "bg-amber-200/35"
                      }`}
                  />
                </div>

                <div className="relative z-10 grid min-w-0 items-center gap-8 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr]">
                  <div
                    className={`min-w-0 transition-all duration-700 ${heroReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                      }`}
                  >
                    <h1 className="mt-4 sm:mt-5 text-4xl font-semibold tracking-tight leading-[1.03] sm:text-5xl lg:text-7xl">
                      Turn complex ideas into clear diagrams.
                    </h1>
                    <p
                      className={`mt-5 sm:mt-6 max-w-2xl text-base sm:text-lg leading-relaxed ${isDark ? "text-white/70" : "text-black/65"
                        }`}
                    >
                      Describe. Visualise. Done.
                    </p>

                    <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                      <Link
                        to="/app"
                        className={`w-full sm:w-auto justify-center inline-flex items-center gap-2 rounded-full px-5 sm:px-6 py-3 text-sm font-semibold transition-all duration-200 ${isDark
                          ? "bg-white text-black hover:bg-white/90"
                          : "bg-[#111827] text-white hover:bg-[#1f2937]"
                          }`}
                      >
                        Open Workspace
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        to="/docs"
                        className={`w-full sm:w-auto justify-center inline-flex items-center gap-2 rounded-full border px-5 sm:px-6 py-3 text-sm font-semibold transition-colors ${isDark
                          ? "border-white/20 text-white/90 hover:bg-white/10"
                          : "border-black/15 text-black/80 hover:bg-black/5"
                          }`}
                      >
                        View Docs
                      </Link>
                    </div>
                  </div>
                  <div className="relative mt-8 sm:mt-0 flex items-center justify-center">
                    <HeroAnimation />
                  </div>
                </div>
              </SlideContainerDesktop>
            )}

            {/* --- SLIDE 1: FEATURES --- */}
            {currentSlide === 1 && (
              <SlideContainerDesktop>
                <div className="max-w-3xl">
                  <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight">
                    Built for real team workflows, not just demos.
                  </h2>
                  <p
                    className={`mt-4 text-base sm:text-lg ${isDark ? "text-white/70" : "text-black/65"
                      }`}
                  >
                    Every part of the product is optimized for fast iteration, clean
                    output, and fewer broken diagram states.
                  </p>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {capabilityCards.map((card) => (
                    <div
                      key={card.title}
                      className={`rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${isDark
                        ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                        : "border-black/10 bg-white hover:bg-[#fffaf5]"
                        }`}
                    >
                      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold">{card.title}</h3>
                      <p
                        className={`mt-2 text-sm leading-relaxed ${isDark ? "text-white/65" : "text-black/60"
                          }`}
                      >
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>
              </SlideContainerDesktop>
            )}

            {/* --- SLIDE 2: WORKFLOW & USE CASES --- */}
            {currentSlide === 2 && (
              <SlideContainerDesktop>
                <div className="max-w-3xl mb-8">
                  <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight">
                    From rough idea to shippable artifact.
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-10">
                  {workflowSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-black/35" : "border-black/10 bg-white"
                        }`}
                    >
                      <div
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-widest ${isDark
                          ? "bg-orange-500/15 text-orange-300"
                          : "bg-orange-50 text-orange-700"
                          }`}
                      >
                        STEP {step.id}
                      </div>
                      <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                      <p
                        className={`mt-3 text-sm leading-relaxed ${isDark ? "text-white/65" : "text-black/60"
                          }`}
                      >
                        {step.body}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {useCaseTracks.map((track) => (
                    <div
                      key={track.title}
                      className={`rounded-2xl border p-5 ${isDark
                        ? "border-white/10 bg-white/[0.03]"
                        : "border-black/10 bg-white"
                        }`}
                    >
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                        <track.icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">{track.title}</h3>
                      <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-white/65" : "text-black/60"}`}>
                        {track.body}
                      </p>
                    </div>
                  ))}
                </div>
              </SlideContainerDesktop>
            )}

            {/* --- SLIDE 3: SECURITY & CTA --- */}
            {currentSlide === 3 && (
              <SlideContainerDesktop>
                <div className="grid gap-8 lg:grid-cols-[1fr_1fr] mb-12">
                  <div>
                    <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight">
                      Transparent by default.
                    </h2>
                    <p
                      className={`mt-4 text-base sm:text-lg ${isDark ? "text-white/70" : "text-black/65"
                        }`}
                    >
                      Clear boundaries on where data lives and when it is shared.
                    </p>

                    <div className="mt-6 space-y-3">
                      {dataHandling.map((item) => (
                        <div key={item} className="flex items-start gap-2.5">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                          <p className={isDark ? "text-white/70" : "text-black/65"}>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white"
                      }`}
                  >
                    <h3 className="text-lg font-semibold">Operational posture</h3>
                    <div className="mt-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                          <Lock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Credential isolation</p>
                          <p className={`text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                            API credentials are scoped to provider mode and explicit user configuration.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                          <Database className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Controlled persistence</p>
                          <p className={`text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                            Local history is browser-bound; remote persistence occurs only for deliberate sharing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-3xl border p-6 sm:p-10 text-center ${isDark
                    ? "border-white/10 bg-gradient-to-b from-[#131923] to-[#0b0f15]"
                    : "border-black/10 bg-gradient-to-b from-[#fff9f2] to-white"
                    }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                    Ready To Build
                  </p>
                  <h2 className="mt-3 text-2xl sm:text-4xl font-semibold tracking-tight">
                    Create your next diagram.
                  </h2>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link
                      to="/app"
                      className={`w-full sm:w-auto justify-center inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-[#111827] text-white hover:bg-[#1f2937]"
                        }`}
                    >
                      Launch App
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <footer className="mt-12 text-center pb-8 border-t border-black/10 dark:border-white/10 pt-6">
                  <div className="flex items-center justify-center gap-4 text-sm mb-4">
                    <Link to="/privacy" className={isDark ? "text-white/65 hover:text-white" : "text-black/65 hover:text-black"}>Privacy</Link>
                    <Link to="/terms" className={isDark ? "text-white/65 hover:text-white" : "text-black/65 hover:text-black"}>Terms</Link>
                    <a href="https://github.com/itsyashvardhan/diagflo" target="_blank" rel="noopener noreferrer" className={isDark ? "text-white/65 hover:text-white" : "text-black/65 hover:text-black"}>GitHub</a>
                    <a href="https://www.linkedin.com/company/diagflo" target="_blank" rel="noopener noreferrer" className={isDark ? "text-white/65 hover:text-white" : "text-black/65 hover:text-black"}>LinkedIn</a>
                  </div>
                  <p className={isDark ? "text-white/55 text-sm" : "text-black/55 text-sm"}>
                    © {new Date().getFullYear()} Diagflo
                  </p>
                </footer>
              </SlideContainerDesktop>
            )}
          </motion.div>
        </AnimatePresence>

        {/* --- PAGINATION INDICATORS --- */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i !== currentSlide) {
                  setDirection(i > currentSlide ? 1 : -1);
                  setCurrentSlide(i);
                }
              }}
              className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide
                ? `w-8 ${isDark ? "bg-orange-500" : "bg-orange-600"}`
                : `w-2 hover:bg-orange-400/50 ${isDark ? "bg-white/20" : "bg-black/20"}`
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
