import { useEffect, useRef, useState, useMemo, useCallback } from "react";

/* ─────────────────────────────────────────────
   Searchable doc index
   Each entry maps to a section on the DocsPage
   ───────────────────────────────────────────── */
export interface SearchEntry {
  id: string;           // id of the section element (used for scroll-to)
  title: string;
  description: string;
  category: string;     // sidebar group / badge label
  keywords: string[];   // extra tokens for fuzzy matching
}

const DOC_SEARCH_INDEX: SearchEntry[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Quick start guide — API key setup, first prompt, and generating your first diagram.",
    category: "Guide",
    keywords: ["quick start", "begin", "setup", "introduction", "onboarding", "hello"],
  },
  {
    id: "api-key",
    title: "API Key Setup",
    description: "How to obtain and configure your free Gemini API key for diagram generation.",
    category: "Configuration",
    keywords: ["gemini", "google", "key", "auth", "settings", "token", "credential"],
  },
  {
    id: "creating-diagrams",
    title: "Creating Diagrams",
    description: "Natural-language prompts, iterative refinement, and conversation examples with Archie.",
    category: "Usage",
    keywords: ["prompt", "generate", "archie", "ai", "conversation", "refine", "chat"],
  },
  {
    id: "diagram-types",
    title: "Supported Diagram Types",
    description: "All 15 Mermaid diagram types — flowcharts, sequence, ER, Gantt, mindmaps, and more.",
    category: "Reference",
    keywords: [
      "mermaid", "flowchart", "sequence", "class", "state", "er", "gantt",
      "pie", "git", "mindmap", "timeline", "quadrant", "sankey", "block", "xy",
    ],
  },
  {
    id: "chart-js",
    title: "Chart.js Support",
    description: "Advanced charts with logarithmic scales, scatter plots, annotations, and custom DSL syntax.",
    category: "Reference",
    keywords: ["chartjs", "chart.js", "scatter", "log", "annotation", "dsl", "dataset", "line chart", "bar chart"],
  },
  {
    id: "image-input",
    title: "Image Input",
    description: "Upload or paste images — Archie can recreate whiteboard sketches as clean diagrams.",
    category: "Usage",
    keywords: ["upload", "paste", "screenshot", "whiteboard", "image", "photo", "attachment", "clipboard"],
  },
  {
    id: "code-editing",
    title: "Code Editing",
    description: "View and edit the raw Mermaid or Chart.js code directly in the diagram toolbar.",
    category: "Usage",
    keywords: ["code", "editor", "raw", "mermaid", "syntax", "manual"],
  },
  {
    id: "export-share",
    title: "Export & Share",
    description: "Export as SVG, PNG, or raw code. Generate shareable links — no sign-up required.",
    category: "Usage",
    keywords: ["svg", "png", "export", "download", "share", "link", "shareable"],
  },
  {
    id: "history",
    title: "History & Undo",
    description: "Browse, restore, and compare previous diagram versions with auto-save.",
    category: "Usage",
    keywords: ["undo", "redo", "history", "version", "restore", "autosave", "ctrl+z"],
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    description: "All keyboard shortcuts — undo, redo, zoom, fullscreen, and more.",
    category: "Reference",
    keywords: ["shortcut", "hotkey", "keybinding", "ctrl", "keyboard", "accessibility"],
  },
  {
    id: "mcp-server",
    title: "MCP Server",
    description: "Model Context Protocol server for ChatGPT, Claude, and AI app integrations. Server details, tools, and setup guide.",
    category: "Integration",
    keywords: ["mcp", "model context protocol", "chatgpt", "claude", "plugin", "api", "sse", "tool", "integration", "cursor", "copilot"],
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    description: "How Diagflo handles your API key, data storage, shared diagrams, and security headers.",
    category: "Security",
    keywords: ["privacy", "security", "localstorage", "headers", "neon", "data", "cors"],
  },
];

/* ─────────────  Fuzzy search helper  ───────────── */
function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  // Simple substring + token match — fast enough for a small index
  if (lower.includes(q)) return true;
  // Check if all query tokens appear anywhere
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => lower.includes(t));
}

function scoreResult(entry: SearchEntry, query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  if (entry.title.toLowerCase().startsWith(q)) score += 100;
  if (entry.title.toLowerCase().includes(q)) score += 50;
  if (entry.description.toLowerCase().includes(q)) score += 20;
  if (entry.keywords.some((k) => k.includes(q))) score += 10;
  return score;
}

/* ─────────────  Category badge colors  ───────────── */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Guide: { bg: "bg-blue-50", text: "text-blue-600", darkBg: "bg-blue-500/10", darkText: "text-blue-400" },
  Configuration: { bg: "bg-purple-50", text: "text-purple-600", darkBg: "bg-purple-500/10", darkText: "text-purple-400" },
  Usage: { bg: "bg-emerald-50", text: "text-emerald-600", darkBg: "bg-emerald-500/10", darkText: "text-emerald-400" },
  Reference: { bg: "bg-amber-50", text: "text-amber-600", darkBg: "bg-amber-500/10", darkText: "text-amber-400" },
  Integration: { bg: "bg-cyan-50", text: "text-cyan-600", darkBg: "bg-cyan-500/10", darkText: "text-cyan-400" },
  Security: { bg: "bg-red-50", text: "text-red-600", darkBg: "bg-red-500/10", darkText: "text-red-400" },
};

/* ─══════════════════════════════════════════════════
   SuperSearch Component
   ══════════════════════════════════════════════════ */

interface SuperSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuperSearch({ isOpen, onClose }: SuperSearchProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const isDark = document.documentElement.classList.contains("dark");

  /* Filtered & ranked results */
  const results = useMemo(() => {
    if (query.trim().length === 0) return DOC_SEARCH_INDEX;
    const q = query.trim();
    return DOC_SEARCH_INDEX
      .filter((entry) => {
        const haystack = [entry.title, entry.description, entry.category, ...entry.keywords].join(" ");
        return fuzzyMatch(haystack, q);
      })
      .sort((a, b) => scoreResult(b, q) - scoreResult(a, q));
  }, [query]);

  /* Reset on open */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  /* Keep selected in view */
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.children[selected] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  /* Navigate to section */
  const navigateTo = useCallback(
    (entry: SearchEntry) => {
      const el = document.getElementById(entry.id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Briefly flash the section
        el.classList.add("ring-2", "ring-orange-500/40", "rounded-xl");
        setTimeout(() => el.classList.remove("ring-2", "ring-orange-500/40", "rounded-xl"), 1500);
      }
      onClose();
    },
    [onClose],
  );

  /* Keyboard handling */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (results[selected]) navigateTo(results[selected]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, selected, results, onClose, navigateTo]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] bg-black/50 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-4 ${isDark
          ? "bg-[#18181b]/95 border-white/10 shadow-black/60"
          : "bg-white/95 border-black/10 shadow-black/20"
          }`}
        style={{ backdropFilter: "blur(24px)" }}
      >
        {/* ── Search input bar ── */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${isDark ? "border-white/5" : "border-black/5"}`}>
          {/* Search icon */}
          <svg className={`w-5 h-5 shrink-0 ${isDark ? "text-white/30" : "text-black/30"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className={`flex-1 text-[15px] bg-transparent outline-none placeholder:font-medium ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
              }`}
            placeholder="Search documentation…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            aria-label="Search documentation"
            autoComplete="off"
            spellCheck={false}
          />
          {/* Shortcut badge */}
          <kbd
            className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium ${isDark ? "bg-white/5 text-white/25 border border-white/5" : "bg-gray-100 text-gray-400 border border-gray-200"
              }`}
          >
            Esc
          </kbd>
        </div>

        {/* ── Results list ── */}
        <ul
          ref={listRef}
          className={`max-h-[50vh] overflow-y-auto overscroll-contain py-2 ${isDark ? "scrollbar-dark" : ""
            }`}
          role="listbox"
          aria-label="Search results"
        >
          {results.length === 0 && (
            <li className={`px-5 py-8 text-center ${isDark ? "text-white/30" : "text-black/30"}`}>
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-sm font-medium">No results for "{query}"</div>
              <div className="text-xs mt-1 opacity-60">Try a different search term</div>
            </li>
          )}
          {results.map((entry, i) => {
            const isActive = i === selected;
            const cat = CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.Usage;
            return (
              <li
                key={entry.id}
                role="option"
                aria-selected={isActive}
                className={`mx-2 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 ${isActive
                  ? isDark
                    ? "bg-white/[0.06]"
                    : "bg-black/[0.04]"
                  : "hover:bg-white/[0.03]"
                  }`}
                onMouseEnter={() => setSelected(i)}
                onClick={() => navigateTo(entry)}
              >
                <div className="flex items-center gap-3">
                  {/* Title + badge */}
                  <span className={`font-semibold text-[14px] ${isDark ? "text-white" : "text-black"}`}>
                    {highlightMatch(entry.title, query, isDark)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${isDark ? `${cat.darkBg} ${cat.darkText}` : `${cat.bg} ${cat.text}`
                      }`}
                  >
                    {entry.category}
                  </span>
                  {/* Right-side arrow when active */}
                  {isActive && (
                    <svg className={`ml-auto w-4 h-4 ${isDark ? "text-white/20" : "text-black/20"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
                <p className={`text-[13px] leading-relaxed mt-1 ${isDark ? "text-white/40" : "text-black/40"}`}>
                  {highlightMatch(entry.description, query, isDark)}
                </p>
              </li>
            );
          })}
        </ul>

        {/* ── Footer ── */}
        <div className={`flex items-center justify-between px-5 py-2.5 border-t text-[11px] font-medium ${isDark ? "border-white/5 text-white/20" : "border-black/5 text-black/20"
          }`}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? "bg-white/5" : "bg-gray-100"}`}>↑</kbd>
              <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? "bg-white/5" : "bg-gray-100"}`}>↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? "bg-white/5" : "bg-gray-100"}`}>↵</kbd>
              open
            </span>
          </div>
          <span>{results.length} result{results.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────  Highlight helper  ───────────── */
function highlightMatch(text: string, query: string, isDark: boolean): React.ReactNode {
  if (!query.trim()) return text;
  const q = query.trim();
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={`rounded px-0.5 ${isDark ? "bg-orange-500/20 text-orange-300" : "bg-orange-100 text-orange-700"}`}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}
