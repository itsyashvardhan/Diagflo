import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { SuperSearch } from "@/components/modals/SuperSearchModal";
import { useCanonical } from "@/hooks/use-canonical";
import { DiagfloLogo } from "@/components/logo/DiagfloLogo";
import {
  BookOpen,
  Zap,
  Key,
  MessageSquare,
  Image,
  Code2,
  Share2,
  History,
  Keyboard,
  BarChart3,
  ChevronRight,
  Copy,
  Check,
  ArrowLeft,
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
  ArrowRight,
  Plug,
} from "lucide-react";

type DocSection = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
};

type IconListItem = {
  title?: string;
  description: string;
};

const SIDEBAR_ITEMS: DocSection[] = [
  { id: "getting-started", title: "Getting Started", icon: Zap },
  { id: "api-key", title: "API Key Setup", icon: Key },
  { id: "creating-diagrams", title: "Creating Diagrams", icon: MessageSquare },
  { id: "diagram-types", title: "Supported Diagrams", icon: BarChart3 },
  { id: "chart-js", title: "Chart.js Support", icon: BarChart3 },
  { id: "image-input", title: "Image Input", icon: Image },
  { id: "code-editing", title: "Code Editing", icon: Code2 },
  { id: "export-share", title: "Export & Share", icon: Share2 },
  { id: "history", title: "History & Undo", icon: History },
  { id: "keyboard-shortcuts", title: "Keyboard Shortcuts", icon: Keyboard },
  { id: "mcp-server", title: "MCP Server", icon: Plug },
  { id: "privacy", title: "Privacy & Security", icon: Key },
];



const PROMPT_EXAMPLES = [
  { emoji: "🔐", text: "Create a user authentication flow with MFA, SSO, and error handling" },
  { emoji: "🏗️", text: "Draw a microservices architecture for an e-commerce platform on AWS" },
  { emoji: "🔄", text: "Visualize a CI/CD pipeline with staging and production environments" },
  { emoji: "📊", text: "Design an ER diagram for a blog with users, posts, comments, and tags" },
  { emoji: "🧬", text: "Show the React component lifecycle with hooks" },
  { emoji: "🌊", text: "Create a state machine for an order processing system" },
];

const DIAGRAM_TYPES = [
  { name: "Flowchart", desc: "Process flows, decision trees", syntax: "flowchart TD" },
  { name: "Sequence Diagram", desc: "API calls, message passing", syntax: "sequenceDiagram" },
  { name: "Class Diagram", desc: "OOP structures, interfaces", syntax: "classDiagram" },
  { name: "State Diagram", desc: "State machines, transitions", syntax: "stateDiagram-v2" },
  { name: "ER Diagram", desc: "Database schemas, relations", syntax: "erDiagram" },
  { name: "Gantt Chart", desc: "Project timelines, scheduling", syntax: "gantt" },
  { name: "Pie Chart", desc: "Distribution, proportions", syntax: "pie" },
  { name: "Git Graph", desc: "Branch strategies, merges", syntax: "gitGraph" },
  { name: "Mindmap", desc: "Brainstorming, hierarchies", syntax: "mindmap" },
  { name: "Timeline", desc: "Chronological events", syntax: "timeline" },
  { name: "Quadrant", desc: "Priority matrices, 2x2 grids", syntax: "quadrantChart" },
  { name: "Sankey", desc: "Flow quantities, energy diagrams", syntax: "sankey-beta" },
  { name: "Block Diagram", desc: "System architecture blocks", syntax: "block-beta" },
  { name: "XY Chart", desc: "Line and bar charts", syntax: "xychart-beta" },
  { name: "Requirement", desc: "Requirements traceability", syntax: "requirementDiagram" },
];

const EXPORT_FORMATS = [
  { format: "SVG", desc: "Vector format, infinitely scalable. Best for documentation and web." },
  { format: "PNG", desc: "Raster image with transparent background. Good for presentations." },
  { format: "Code", desc: "Copy the raw Mermaid/Chart.js code for use in other tools." },
];

const SHORTCUTS = [
  ["Search Docs", "Ctrl + F"],
  ["Help", "Ctrl + ?"],
  ["Undo", "Ctrl + Z"],
  ["Redo", "Ctrl + Y / Ctrl + Shift + Z"],
  ["Zoom In", "Ctrl + +"],
  ["Zoom Out", "Ctrl + -"],
  ["Reset Zoom", "Ctrl + 0"],
  ["Fullscreen", "Ctrl + F"],
  ["Close Modals", "Ctrl + Escape"],
] as const;

const PRIVACY_ITEMS = [
  {
    title: "API Key Storage",
    desc: "Your Gemini API key is stored only in your browser's localStorage. It is never transmitted to Diagflo servers.",
  },
  {
    title: "Direct API Communication",
    desc: "Diagram generation requests go directly from your browser to Google's Gemini API. Diagflo acts as a client-only application.",
  },
  {
    title: "Shared Diagrams",
    desc: "When you share a diagram, only the diagram code and title are stored in Neon Postgres. No personal data, API keys, or chat history is included.",
  },
  {
    title: "Security Headers",
    desc: "The production deployment includes X-Content-Type-Options, X-Frame-Options (DENY), and X-XSS-Protection headers.",
  },
];

const isDarkTheme = () => document.documentElement.classList.contains("dark");

const toggleGlobalTheme = () => {
  document.documentElement.classList.toggle("dark");
  window.dispatchEvent(new Event("theme-changed"));
};

const fallbackCopyText = (text: string): boolean => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
};

const SectionHeading = ({ title, isDark }: { title: string; isDark: boolean }) => (
  <h2 className={`text-2xl font-semibold tracking-tight mb-4 ${isDark ? "text-white" : "text-black"}`}>
    {title}
  </h2>
);

const IconBulletList = ({
  isDark,
  items,
}: {
  isDark: boolean;
  items: IconListItem[];
}) => (
  <ul className={`space-y-2 text-[15px] leading-relaxed ${isDark ? "text-white/60" : "text-black/60"}`}>
    {items.map((item, index) => (
      <li key={`${item.description}-${index}`} className="flex items-start gap-2">
        <ChevronRight className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
        {item.title ? (
          <span>
            <strong>{item.title}</strong> {item.description}
          </span>
        ) : (
          <span>{item.description}</span>
        )}
      </li>
    ))}
  </ul>
);


const DocsPage = () => {
  const [isDark, setIsDark] = useState(isDarkTheme());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyFailedId, setCopyFailedId] = useState<string | null>(null);
  const [superSearchOpen, setSuperSearchOpen] = useState(false);
  useCanonical("/docs");

  // Ctrl+F global shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
      e.preventDefault();
      setSuperSearchOpen((open) => !open);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    document.title = "Documentation | Diagflo";

    const onThemeChanged = () => setIsDark(isDarkTheme());
    window.addEventListener("theme-changed", onThemeChanged);
    return () => window.removeEventListener("theme-changed", onThemeChanged);
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const copied = fallbackCopyText(text);
        if (!copied) {
          throw new Error("Fallback copy failed");
        }
      }

      setCopyFailedId(null);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
      setCopyFailedId(id);
      setTimeout(() => setCopyFailedId((current) => (current === id ? null : current)), 2500);
    }
  };

  // Scroll spy for active section
  const [activeSection, setActiveSection] = useState("getting-started");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const CodeBlock = ({ code, language = "text", id }: { code: string; language?: string; id: string }) => (
    <div className={`relative rounded-xl border overflow-hidden my-4 ${isDark ? "bg-[#0d1117] border-white/10" : "bg-gray-50 border-gray-200"}`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${isDark ? "border-white/5 bg-white/[0.02]" : "border-gray-100 bg-gray-100/50"}`}>
        <span className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${copyFailedId === id
            ? "text-red-500"
            : isDark
              ? "hover:bg-white/10 text-white/50 hover:text-white"
              : "hover:bg-gray-200 text-gray-400 hover:text-gray-700"
            }`}
          aria-label="Copy code"
        >
          {copiedId === id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          {copiedId === id ? "Copied" : copyFailedId === id ? "Copy failed" : "Copy"}
        </button>
      </div>
      <pre className={`p-4 overflow-x-auto text-sm font-mono leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
        <code>{code}</code>
      </pre>
      <p className="sr-only" aria-live="polite">
        {copiedId === id ? "Code copied to clipboard" : copyFailedId === id ? "Copy failed. Please copy manually." : ""}
      </p>
    </div>
  );

  return (
    <>
      <SuperSearch isOpen={superSearchOpen} onClose={() => setSuperSearchOpen(false)} />
      <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${isDark ? "bg-[#0a0a0a] text-[#F5F5F7]" : "bg-[#fafafa] text-[#111111]"}`}>
        {/* Skip to content - WCAG 2.1 AA */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-orange-500 focus:text-white focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        {/* Navigation */}
        <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b ${isDark ? "bg-black/60 border-white/10" : "bg-white/60 border-black/5"}`}>
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2.5">
                <DiagfloLogo className="w-7 h-7" />
                <span className="font-semibold text-[15px] bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Diagflo
                </span>
              </Link>
              <div className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-orange-50 text-orange-600 border border-orange-200"}`}>
                <BookOpen className="w-3 h-3" />
                Docs
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search trigger – FAANG docs style */}
              <button
                onClick={() => setSuperSearchOpen(true)}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border ${isDark
                  ? "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/20"
                  : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                aria-label="Search documentation (Ctrl+F)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21" y2="21" strokeLinecap="round" />
                </svg>
                <span className="hidden md:inline">Search</span>
                <kbd className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? "bg-white/5 text-white/25" : "bg-gray-200 text-gray-400"
                  }`}>⌘ / Ctrl +F</kbd>
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    toggleGlobalTheme();
                    setIsDark(isDarkTheme());
                  }}
                  className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-black/5 text-black/40"}`}
                  aria-label="Toggle theme"
                >
                  {isDark ? (
                    <Sun className="w-[18px] h-[18px]" />
                  ) : (
                    <Moon className="w-[18px] h-[18px]" />
                  )}
                </button>
                <Link
                  to="/app"
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                >
                  Open App
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto flex">
          {/* Sidebar */}
          <aside className={`hidden lg:block w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-6 border-r ${isDark ? "border-white/5" : "border-black/5"}`}>
            <Link
              to="/app"
              className={`flex items-center gap-2 text-sm font-medium mb-6 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to App
            </Link>
            <nav className="space-y-1" aria-label="Documentation sections">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${isActive
                      ? isDark
                        ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                        : "bg-orange-50 text-orange-600 border border-orange-200"
                      : isDark
                        ? "text-white/40 hover:text-white/70 hover:bg-white/5"
                        : "text-black/40 hover:text-black/70 hover:bg-black/5"
                      }`}
                    aria-current={isActive ? "location" : undefined}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {item.title}
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Mobile TOC - floating button + slide-up panel */}
          <div className="lg:hidden">
            {/* Floating TOC button */}
            <button
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-medium text-sm transition-all ${isDark
                ? "bg-orange-500 text-white shadow-orange-500/25"
                : "bg-orange-500 text-white shadow-orange-500/30"
                }`}
              aria-label="Toggle table of contents"
              aria-expanded={mobileTocOpen}
            >
              {mobileTocOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              {mobileTocOpen ? "Close" : "On this page"}
            </button>

            {/* Backdrop */}
            {mobileTocOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={() => setMobileTocOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Slide-up panel */}
            <div
              className={`fixed bottom-0 left-0 right-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t transition-transform duration-300 ${mobileTocOpen ? "translate-y-0" : "translate-y-full"
                } ${isDark ? "bg-[#0a0a0a] border-white/10" : "bg-[#fafafa] border-gray-200"}`}
            >
              <div className="px-6 py-5">
                <div className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? "text-white/30" : "text-black/30"}`}>
                  On this page
                </div>
                <nav className="space-y-1" aria-label="Documentation sections mobile">
                  {SIDEBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={() => setMobileTocOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all ${isActive
                          ? isDark
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-orange-50 text-orange-600 border border-orange-200"
                          : isDark
                            ? "text-white/50 hover:text-white/70 hover:bg-white/5"
                            : "text-black/50 hover:text-black/70 hover:bg-black/5"
                          }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {item.title}
                      </a>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main id="main-content" className="flex-1 min-w-0 px-6 lg:px-12 py-10 lg:py-12">
            {/* Hero */}
            <div className="mb-16">
              <h1 className={`text-4xl sm:text-5xl font-semibold tracking-tight mb-4 ${isDark ? "text-white" : "text-black"}`}>
                Documentation
              </h1>
              <p className={`text-lg leading-relaxed max-w-2xl ${isDark ? "text-white/50" : "text-black/50"}`}>
                Everything you need to create stunning diagrams and charts with Diagflo's Intelligent builder.
              </p>
            </div>



            {/* Getting Started */}
            <section id="getting-started" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="Getting Started" />
              <p className={`leading-relaxed mb-6 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Diagflo turns natural language into professional diagrams. Describe what you want to visualize, and <strong className={isDark ? "text-orange-400" : "text-orange-600"}>Archie</strong> - our AI builder - generates it in seconds.
              </p>
              <div className={`rounded-xl border p-6 ${isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                <h3 className={`text-base font-semibold mb-4 ${isDark ? "text-white" : "text-black"}`}>Quick Start</h3>
                <ol className={`space-y-3 text-[15px] leading-relaxed ${isDark ? "text-white/60" : "text-black/60"}`}>
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold shrink-0">1</span>
                    <span>Get a <strong>free Gemini API key</strong> from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">Google AI Studio</a></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold shrink-0">2</span>
                    <span>Open <Link to="/app" className="text-orange-500 hover:underline">Diagflo App</Link> and go to <strong>Settings</strong> - paste your API key</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold shrink-0">3</span>
                    <span>Type a prompt like <em>"Create a user authentication flow"</em> and hit Enter</span>
                  </li>
                </ol>
              </div>
            </section>

            {/* API Key Setup */}
            <section id="api-key" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="API Key Setup" />
              <p className={`leading-relaxed mb-4 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Diagflo uses Google's <strong>Gemini</strong> AI model. You need a free API key to generate diagrams.
              </p>
              <div className={`rounded-xl border p-6 mb-6 ${isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                <h3 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>How to get your API key</h3>
                <ol className={`space-y-2 text-[15px] leading-relaxed ${isDark ? "text-white/60" : "text-black/60"}`}>
                  <li>1. Visit <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">aistudio.google.com/apikey</a></li>
                  <li>2. Sign in with your Google account</li>
                  <li>3. Click <strong>"Create API Key"</strong></li>
                  <li>4. Copy the key and paste it in Diagflo's Settings panel</li>
                </ol>
              </div>
              <div className={`flex items-start gap-3 rounded-xl border p-4 ${isDark ? "bg-green-500/5 border-green-500/20" : "bg-green-50 border-green-200"}`}>
                <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <p className={`text-[15px] leading-relaxed ${isDark ? "text-green-400/80" : "text-green-700"}`}>
                  <strong>Your key stays local.</strong> It's stored only in your browser's localStorage and sent directly to Google's API. Diagflo never sees or stores your key on any server.
                </p>
              </div>
            </section>

            {/* Creating Diagrams */}
            <section id="creating-diagrams" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="Creating Diagrams" />
              <p className={`leading-relaxed mb-6 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Type your request in natural language. Archie understands context and can iteratively refine diagrams based on follow-up prompts.
              </p>

              <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>Example Prompts</h3>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {PROMPT_EXAMPLES.map((prompt, index) => (
                  <div
                    key={`${prompt.text}-${index}`}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${isDark ? "bg-white/[0.02] border-white/5 hover:border-orange-500/20" : "bg-gray-50 border-gray-200 hover:border-orange-300"}`}
                  >
                    <span className="text-lg">{prompt.emoji}</span>
                    <span className={`text-[15px] leading-snug ${isDark ? "text-white/60" : "text-black/60"}`}>{prompt.text}</span>
                  </div>
                ))}
              </div>

              <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>Iterative Refinement</h3>
              <p className={`text-base leading-relaxed mb-4 ${isDark ? "text-white/60" : "text-black/60"}`}>
                After generating a diagram, you can refine it with follow-up prompts:
              </p>
              <CodeBlock
                id="iterate"
                language="conversation"
                code={`You: "Create a login flow diagram"
Archie: [generates diagram]

You: "Add OAuth2 and social login options"
Archie: [updates diagram with OAuth2 flow]

You: "Make it more detailed with error states"
Archie: [adds error handling branches]`}
              />
            </section>

            {/* Supported Diagram Types */}
            <section id="diagram-types" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="Supported Diagram Types" />
              <p className={`leading-relaxed mb-6 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Diagflo supports all Mermaid.js diagram types plus Chart.js for advanced charts.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DIAGRAM_TYPES.map((diagramType, index) => (
                  <div
                    key={`${diagramType.name}-${index}`}
                    className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-gray-200"}`}
                  >
                    <h4 className={`text-base font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>{diagramType.name}</h4>
                    <p className={`text-sm mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>{diagramType.desc}</p>
                    <code className={`text-[11px] font-mono px-2 py-0.5 rounded ${isDark ? "bg-white/5 text-orange-400" : "bg-orange-50 text-orange-600"}`}>
                      {diagramType.syntax}
                    </code>
                  </div>
                ))}
              </div>
            </section>

            {/* Chart.js Support */}
            <section id="chart-js" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="Chart.js Support" />
              <p className={`leading-relaxed mb-4 ${isDark ? "text-white/60" : "text-black/60"}`}>
                For advanced charts that Mermaid can't handle - logarithmic scales, scatter plots, annotations - Diagflo uses <strong>Chart.js</strong> with a custom DSL.
              </p>

              <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>When is Chart.js used?</h3>
              <IconBulletList
                isDark={isDark}
                items={[
                  { description: "Log-scale axes (logarithmic charts, performance benchmarks)" },
                  { description: "Scatter plots with point annotations and labels" },
                  { description: "Reference lines with custom labels (e.g. thresholds)" },
                  { description: "Multi-dataset comparisons with fine-grained styling" },
                ]}
              />

              <h3 className={`text-lg font-semibold mb-3 mt-6 ${isDark ? "text-white" : "text-black"}`}>Chart.js DSL Syntax</h3>
              <p className={`text-base mb-4 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Archie automatically generates Chart.js when needed. The DSL uses a JSON-based format inside a <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? "bg-white/10 text-orange-400" : "bg-orange-50 text-orange-600"}`}>chartjs</code> code block:
              </p>
              <CodeBlock
                id="chartjs-example"
                language="chartjs"
                code={`{
  "type": "line",
  "title": "Model Performance Comparison",
  "scales": {
    "x": { "type": "logarithmic", "title": "Parameters (M)" },
    "y": { "type": "logarithmic", "title": "Inference Time (ms)" }
  },
  "datasets": [
    {
      "label": "ResNet Family",
      "data": [
        { "x": 11.7, "y": 24 },
        { "x": 25.6, "y": 45 },
        { "x": 44.5, "y": 78 }
      ],
      "color": "#8b5cf6"
    }
  ],
  "annotations": [
    {
      "type": "line",
      "value": 50,
      "orientation": "horizontal",
      "label": "Latency Threshold",
      "color": "#ef4444",
      "style": "dashed"
    }
  ]
}`}
              />
            </section>

            {/* Image Input */}
            <section id="image-input" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="Image Input" />
              <p className={`leading-relaxed mb-4 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Upload or paste images alongside your prompts. Archie can analyze screenshots, whiteboard photos, or existing diagrams and recreate them as clean, editable diagrams.
              </p>
              <div className={`rounded-xl border p-6 ${isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                <h3 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>How to use</h3>
                <IconBulletList
                  isDark={isDark}
                  items={[
                    { title: "Upload:", description: "Click the attachment icon in the chat input" },
                    { title: "Paste:", description: "Use Ctrl+V / Cmd+V to paste images from clipboard" },
                    { title: "Describe:", description: "Add context like \"Recreate this whiteboard diagram as a clean flowchart\"" },
                  ]}
                />
              </div>
            </section>

            {/* Code Editing */}
            <section id="code-editing" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="Code Editing" />
              <p className={`leading-relaxed mb-4 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Click the <strong>Code</strong> button in the diagram toolbar to view and edit the raw Mermaid or Chart.js code directly.
              </p>
              <IconBulletList
                isDark={isDark}
                items={[
                  { description: "View the generated Mermaid or Chart.js code" },
                  { description: "Make manual edits and apply changes instantly" },
                  { description: "Copy code to use in other tools or documentation" },
                ]}
              />
            </section>

            {/* Export & Share */}
            <section id="export-share" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="Export & Share" />

              <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>Export Formats</h3>
              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                {EXPORT_FORMATS.map((format, index) => (
                  <div
                    key={`${format.format}-${index}`}
                    className={`p-4 rounded-xl border text-center ${isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className={`text-lg font-bold mb-1 ${isDark ? "text-orange-400" : "text-orange-600"}`}>{format.format}</div>
                    <p className={`text-sm leading-relaxed ${isDark ? "text-white/40" : "text-black/40"}`}>{format.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>Sharing Diagrams</h3>
              <p className={`text-base leading-relaxed ${isDark ? "text-white/60" : "text-black/60"}`}>
                Click <strong>Share</strong> to generate a unique link. Anyone with the link can view your diagram - no account required. Shared diagrams are stored securely in Neon Postgres.
              </p>
            </section>

            {/* History */}
            <section id="history" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="History & Undo" />
              <p className={`leading-relaxed mb-4 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Every diagram generation is automatically saved to your local history. You can browse, restore, or compare previous versions.
              </p>
              <IconBulletList
                isDark={isDark}
                items={[
                  { title: "Undo/Redo:", description: "Ctrl+Z / Ctrl+Y to navigate diagram versions" },
                  { title: "History Panel:", description: "Click History in the nav to browse all saved diagrams" },
                  { title: "Auto-save:", description: "Enabled by default in Settings" },
                ]}
              />
            </section>

            {/* Keyboard Shortcuts */}
            <section id="keyboard-shortcuts" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="Keyboard Shortcuts" />
              <div className={`rounded-xl border overflow-hidden ${isDark ? "border-white/10" : "border-gray-200"}`}>
                <table className="w-full text-[15px]">
                  <thead>
                    <tr className={isDark ? "bg-white/[0.03]" : "bg-gray-50"}>
                      <th className={`text-left px-4 py-3 font-semibold ${isDark ? "text-white/80" : "text-black/80"}`}>Action</th>
                      <th className={`text-left px-4 py-3 font-semibold ${isDark ? "text-white/80" : "text-black/80"}`}>Shortcut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHORTCUTS.map(([action, shortcut], index) => (
                      <tr key={`${action}-${index}`} className={`border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
                        <td className={`px-4 py-2.5 ${isDark ? "text-white/60" : "text-black/60"}`}>{action}</td>
                        <td className="px-4 py-2.5">
                          <kbd className={`px-2 py-0.5 rounded text-xs font-mono ${isDark ? "bg-white/10 text-white/80" : "bg-gray-100 text-gray-700"}`}>
                            {shortcut}
                          </kbd>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* MCP Server */}
            <section id="mcp-server" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="MCP Server" />
              <p className={`leading-relaxed mb-6 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Diagflo exposes a <strong>Model Context Protocol (MCP)</strong> server, allowing ChatGPT, Claude, and other AI-powered apps to programmatically generate diagrams through Diagflo's Archie engine.
              </p>

              {/* What is MCP */}
              <div className={`rounded-xl border p-6 mb-6 ${isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                <h3 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>What is MCP?</h3>
                <p className={`text-[15px] leading-relaxed ${isDark ? "text-white/60" : "text-black/60"}`}>
                  The <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">Model Context Protocol</a> is an open standard that lets AI assistants connect to external tools and data sources. Diagflo's MCP server exposes diagram generation as a tool that any MCP-compatible client can call.
                </p>
              </div>

              {/* Server Details */}
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>Server Details</h3>
              <div className={`rounded-xl border overflow-hidden mb-6 ${isDark ? "border-white/10" : "border-gray-200"}`}>
                <table className="w-full text-[15px]">
                  <tbody>
                    {[
                      ["Server Name", "diagflo-mcp-server"],
                      ["Transport", "HTTP + SSE (Server-Sent Events)"],
                      ["Endpoint", "https://diagflo.yashvardhan.dev/api/mcp"],
                      ["Protocol Version", "2024-11-05"],
                      ["Authentication", "Bearer token (your Gemini API key)"],
                    ].map(([label, value], index) => (
                      <tr key={`mcp-detail-${index}`} className={`border-t first:border-t-0 ${isDark ? "border-white/5" : "border-gray-100"}`}>
                        <td className={`px-4 py-3 font-medium w-44 ${isDark ? "text-white/70" : "text-black/70"}`}>{label}</td>
                        <td className="px-4 py-3">
                          <code className={`text-[13px] font-mono px-2 py-0.5 rounded ${isDark ? "bg-white/5 text-orange-400" : "bg-orange-50 text-orange-600"}`}>
                            {value}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Available Tools */}
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>Available Tools</h3>
              <div className="space-y-3 mb-6">
                {[
                  {
                    name: "generate_diagram",
                    desc: "Generate a Mermaid or Chart.js diagram from a natural language prompt. Returns the raw code and an explanation.",
                    params: "prompt (string), diagramType? (string), currentDiagram? (string)",
                  },
                  {
                    name: "refine_diagram",
                    desc: "Refine an existing diagram with a follow-up instruction. Accepts the current diagram code and a refinement prompt.",
                    params: "prompt (string), currentDiagram (string), chatHistory? (array)",
                  },
                  {
                    name: "list_diagram_types",
                    desc: "Returns all supported Mermaid.js and Chart.js diagram types with syntax hints.",
                    params: "none",
                  },
                ].map((tool, index) => (
                  <div
                    key={`mcp-tool-${index}`}
                    className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <code className={`text-[13px] font-mono font-semibold ${isDark ? "text-orange-400" : "text-orange-600"}`}>{tool.name}</code>
                    </div>
                    <p className={`text-sm leading-relaxed mb-2 ${isDark ? "text-white/50" : "text-black/50"}`}>{tool.desc}</p>
                    <div className={`text-[12px] font-mono ${isDark ? "text-white/30" : "text-black/30"}`}>
                      Params: {tool.params}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Setup */}
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-black"}`}>Quick Setup</h3>
              <p className={`text-[15px] leading-relaxed mb-4 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Add Diagflo to your MCP client configuration:
              </p>
              <CodeBlock
                id="mcp-config"
                language="json"
                code={`{
  "mcpServers": {
    "diagflo": {
      "url": "https://diagflo.yashvardhan.dev/api/mcp",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer YOUR_GEMINI_API_KEY"
      }
    }
  }
}`}
              />

              {/* Usage Example */}
              <h3 className={`text-lg font-semibold mb-3 mt-6 ${isDark ? "text-white" : "text-black"}`}>Usage Example</h3>
              <p className={`text-[15px] leading-relaxed mb-4 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Once connected, ask your AI assistant to generate diagrams through Diagflo:
              </p>
              <CodeBlock
                id="mcp-usage"
                language="conversation"
                code={`You: "Use Diagflo to create a microservices architecture for a food delivery app"
Assistant: [calls diagflo.generate_diagram]
→ Returns Mermaid code + explanation

You: "Refine it — add a payment gateway and notification service"
Assistant: [calls diagflo.refine_diagram with the current code]
→ Returns updated diagram`}
              />

              {/* Supported Clients */}
              <div className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${isDark ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-50 border-blue-200"}`}>
                <Plug className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <p className={`text-[15px] leading-relaxed ${isDark ? "text-blue-400/80" : "text-blue-700"}`}>
                  <strong>Compatible Clients:</strong> ChatGPT (via plugins/actions), Claude Desktop, Cursor, Windsurf, VS Code Copilot, and any MCP-compatible application.
                </p>
              </div>
            </section>

            {/* Privacy & Security */}
            <section id="privacy" data-section className="mb-16 scroll-mt-20">
              <SectionHeading isDark={isDark} title="Privacy & Security" />
              <div className="space-y-4">
                {PRIVACY_ITEMS.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className={`flex items-start gap-4 p-4 rounded-xl border ${isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-gray-200"}`}
                  >
                    <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <h3 className={`text-base font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>{item.title}</h3>
                      <p className={`text-sm leading-relaxed ${isDark ? "text-white/50" : "text-black/50"}`}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Footer CTA */}
            <div className={`text-center py-12 border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
              <h2 className={`text-2xl font-semibold tracking-tight mb-3 ${isDark ? "text-white" : "text-black"}`}>
                Ready to start?
              </h2>
              <p className={`text-base mb-6 ${isDark ? "text-white/40" : "text-black/40"}`}>
                Create your first diagram in seconds - no sign-up required.
              </p>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 transition-all shadow-lg shadow-orange-500/25"
              >
                Open Diagflo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </main>
        </div>

        <style>{`
        .font-sans {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>
      </div>
    </>
  );
};

export default DocsPage;
