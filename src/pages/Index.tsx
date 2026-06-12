import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { DiagramViewer } from "@/components/diagram/DiagramViewer";
import { ZoomControls } from "@/components/diagram/ZoomControls";
import { DiagramControls } from "@/components/diagram/DiagramControls";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { ExamplesModal } from "@/components/modals/ExamplesModal";
import { CodeViewModal } from "@/components/modals/CodeViewModal";
import { ExportModal } from "@/components/modals/ExportModal";
import { HistoryModal } from "@/components/modals/HistoryModal";
import { HelpModal } from "@/components/modals/HelpModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { storage } from "@/lib/storage";
import { getSharedDiagram } from "@/lib/shareLinks";
import { generateDiagramStream } from "@/lib/gemini";
import { Message, DiagramHistoryEntry, AppSettings, Attachment } from "@/types/diagflo";
import { GEMINI_SUPPORTS_IMAGE_INPUT } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { logger } from "@/lib/logger";
import { detectDiagramType, sanitizeDiagram } from "@/lib/diagramSanitizer";
import {
  Home,
  Settings,
  Sparkles,
  History,
  HelpCircle,
  Maximize2,
  Minimize2,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { Github, Share2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { CreditsModal } from "@/components/modals/CreditsModal";
import { DiagfloLogo } from "@/components/logo/DiagfloLogo";
import { StarterPrompts, QuickTips } from "@/components/onboarding/StarterContent";
import { useCanonical } from "@/hooks/use-canonical";

const Index = () => {
  // Get share ID from URL params (for /d/:shareId route)
  const { shareId } = useParams<{ shareId?: string }>();
  useCanonical("/app");

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDiagram, setCurrentDiagram] = useState("");
  const [diagramHistory, setDiagramHistory] = useState<DiagramHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // Initialize settings and optionally hydrate API key from explicit storage slot
  const initialSettings = storage.getSettings();
  const storedApiKey = storage.getApiKey();
  if (storedApiKey && !initialSettings.geminiApiKey) {
    initialSettings.geminiApiKey = storedApiKey;
  }
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Chat column sizing (resizable between 33% and 40% of viewport)
  const MIN_CHAT_WIDTH_RATIO = 0.33;
  const getMinChatWidth = () => Math.floor(window.innerWidth * MIN_CHAT_WIDTH_RATIO);
  const [chatWidth, setChatWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("diagflo:chatWidth");
      if (saved) {
        return Number(saved);
      }
      // Default to 33% of the viewport width
      if (typeof window !== "undefined") {
        return Math.floor(window.innerWidth * MIN_CHAT_WIDTH_RATIO);
      }
      return 400;
    } catch {
      return 400;
    }
  });
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const latestWidthRef = useRef(chatWidth);

  // Helper to clamp width to [MIN_CHAT_WIDTH, 40vw]
  const clampWidth = (w: number) => {
    const min = getMinChatWidth();
    const max = Math.floor(window.innerWidth * 0.5);
    return Math.max(min, Math.min(w, max));
  };

  useEffect(() => {
    latestWidthRef.current = chatWidth;
    try {
      localStorage.setItem("diagflo:chatWidth", String(chatWidth));
    } catch (_e) { /* localStorage may be unavailable */ }
  }, [chatWidth]);

  useEffect(() => {
    document.title = "Diagflo — Intelligent Diagram Builder";
  }, []);

  useEffect(() => {
    // Ensure saved width doesn't exceed 40% when window resizes
    const onResize = () => {
      setChatWidth((w) => clampWidth(w));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current) {
      return;
    }
    const dx = e.clientX - startXRef.current;
    const newW = clampWidth(startWidthRef.current + dx);
    setChatWidth(newW);
    latestWidthRef.current = newW;
  };

  const onMouseUp = () => {
    if (!isResizingRef.current) {
      return;
    }
    isResizingRef.current = false;
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const startResize = (clientX: number) => {
    isResizingRef.current = true;
    startXRef.current = clientX;
    startWidthRef.current = latestWidthRef.current || chatWidth;
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    startResize(e.clientX);
  };

  const handleTouchStartResize = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) {
      return;
    }
    startResize(t.clientX);
  };

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showShare, setShowShare] = useState(false);

  // Mobile drawer state - which view is active on mobile
  const [mobileView, setMobileView] = useState<'chat' | 'canvas'>('chat');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef(0); // incremented on user send to trigger scroll
  const generationRequestIdRef = useRef(0);
  const { toast } = useToast();

  // Swipe gesture handling for mobile
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left - show canvas
        setMobileView('canvas');
      } else {
        // Swiped right - show chat
        setMobileView('chat');
      }
    }
  };

  // Load from storage on mount
  useEffect(() => {
    const savedMessages = storage.getChatHistory();
    const savedDiagram = storage.getCurrentDiagram();
    const savedHistory = storage.getDiagramHistory();
    const savedIndex = storage.getHistoryIndex();

    setMessages(savedMessages);
    setCurrentDiagram(savedDiagram);
    setDiagramHistory(savedHistory);
    setHistoryIndex(savedIndex);

    // Always dark mode
    document.documentElement.classList.add('dark');
  }, []);

  // Handle shared diagram loading from the database
  useEffect(() => {
    const loadSharedData = async () => {
      if (shareId) {
        logger.info("Loading shared diagram with ID: " + shareId);
        setIsGenerating(true);
        try {
          const shared = await getSharedDiagram(shareId);
          if (shared) {
            logger.info("Shared diagram loaded successfully", { id: shared.id, title: shared.title });
            setCurrentDiagram(shared.code);
            // Optionally add a system message explaining this is a shared diagram
            setMessages(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "assistant",
                content: `You're viewing a shared diagram: **${shared.title || "Untitled"}**`,
                timestamp: Date.now()
              }
            ]);
            toast({
              title: "Shared Diagram Loaded",
              description: `Viewing: ${shared.title || "Shared Diagram"}`,
            });
          } else {
            logger.warn("Shared diagram not found: " + shareId);
            toast({
              title: "Diagram Not Found",
              description: "The shared diagram link might be invalid or expired. Check the console for details.",
              variant: "destructive",
            });
          }
        } catch (error) {
          logger.error("Error loading shared diagram", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          toast({
            title: "Error Loading Shared Diagram",
            description: `Failed to load: ${errorMessage}. Check browser console for details.`,
            variant: "destructive",
          });
        } finally {
          setIsGenerating(false);
          // Clean up the URL to /app or similar if desired, 
          // but keeping /d/shareId is fine for direct links
        }
      }
    };
    loadSharedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  // Scroll to bottom only on user-initiated sends (not during streaming chunks)
  useEffect(() => {
    if (scrollTriggerRef.current > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTriggerRef.current]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowHelp(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Escape") {
        setShowSettings(false);
        setShowExamples(false);
        setShowCodeView(false);
        setShowExport(false);
        setShowHistory(false);
        setShowHelp(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        handleZoomReset();
      }
      // Fullscreen: Ctrl/Cmd + F
      if ((e.key === "f" || e.key === "F") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex, diagramHistory]);

  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {

    if (attachments.length > 0 && !GEMINI_SUPPORTS_IMAGE_INPUT) {
      toast({
        title: "Image attachments not supported",
        description: "Switch to a Gemini Flash or Vision model to analyze images.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      role: "user",
      content,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
      status: "sending", // Start with sending status
    };

    const requestId = generationRequestIdRef.current + 1;
    generationRequestIdRef.current = requestId;

    const userMessageIndex = messages.length;
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setIsGenerating(true);

    const isCurrentRequest = () => generationRequestIdRef.current === requestId;

    // Helper to update the user message status
    const updateMessageStatus = (updates: Partial<Message>) => {
      if (!isCurrentRequest()) {
        return;
      }
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[userMessageIndex]) {
          newMessages[userMessageIndex] = { ...newMessages[userMessageIndex], ...updates };
        }
        return newMessages;
      });
    };

    try {
      const handleRetry = (retryInfo: {
        attempt: number;
        maxRetries: number;
        estimatedWaitSeconds: number;
        reason: string;
      }) => {
        if (!isCurrentRequest()) {
          return;
        }

        updateMessageStatus({
          status: "queued",
          retryAttempt: retryInfo.attempt,
          estimatedWaitSeconds: retryInfo.estimatedWaitSeconds,
          queueReason: retryInfo.reason,
        });

        toast({
          title: retryInfo.reason,
          description: `Attempt ${retryInfo.attempt}/${retryInfo.maxRetries} • Wait ~${retryInfo.estimatedWaitSeconds}s`,
        });
      };

      if (!settings.geminiApiKey) {
        toast({
          title: "API Key Required",
          description: "Please add your Gemini API key in settings to generate diagrams.",
          variant: "destructive",
        });
        setShowSettings(true);
        setIsGenerating(false);
        updateMessageStatus({ status: "error" });
        return;
      }

      // Create a placeholder assistant message for streaming
      const streamingAssistantMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };
      const assistantMessageIndex = updatedHistory.length;
      setMessages(prev => [...prev, streamingAssistantMessage]);

      // Scroll once now that the placeholder is added
      scrollTriggerRef.current += 1;

      const response = await generateDiagramStream(
        settings.geminiApiKey,
        settings.geminiModel,
        content,
        currentDiagram,
        updatedHistory,
        (() => {
          // Throttle streaming UI updates to ~60fps using rAF
          let rafId = 0;
          let latestAccumulated = "";

          // Strip fenced code blocks so users never see raw diagram code in chat
          const stripCodeBlocks = (text: string): string => {
            // Remove complete fenced blocks: ```mermaid ... ``` or ```chartjs ... ```
            let cleaned = text.replace(/```(?:mermaid|chartjs)\s*[\s\S]*?```/gi, "");
            // Remove incomplete/in-progress fenced blocks (stream hasn't closed them yet)
            cleaned = cleaned.replace(/```(?:mermaid|chartjs)\s*[\s\S]*$/gi, "");
            return cleaned.trim();
          };

          return (_delta: string, accumulated: string) => {
            if (!isCurrentRequest()) return;
            latestAccumulated = accumulated;

            if (!rafId) {
              rafId = requestAnimationFrame(() => {
                rafId = 0;
                const displayText = stripCodeBlocks(latestAccumulated);
                setMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages[assistantMessageIndex]) {
                    newMessages[assistantMessageIndex] = {
                      ...newMessages[assistantMessageIndex],
                      content: displayText,
                    };
                  }
                  return newMessages;
                });
              });
            }
          };
        })(),
        handleRetry
      );

      if (!isCurrentRequest()) {
        return;
      }

      let nextDiagramCode = response.code;
      const nextType = detectDiagramType(nextDiagramCode);

      if (nextDiagramCode && nextType && nextType !== "chartjs") {
        const { validateMermaidSyntax } = await import("@/lib/mermaid");

        let healed = sanitizeDiagram(nextDiagramCode).code;
        let validation = await validateMermaidSyntax(healed);

        if (!validation.valid) {
          const declarationIndex = healed.search(/^\s*(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|journey|xychart-beta|sankey-beta|block-beta|packet-beta|architecture-beta|kanban)\b/m);
          if (declarationIndex > 0) {
            healed = sanitizeDiagram(healed.slice(declarationIndex)).code;
            validation = await validateMermaidSyntax(healed);
          }
        }

        if (validation.valid) {
          if (healed !== nextDiagramCode) {
            logger.warn("Auto-healed generated Mermaid syntax before apply", { type: nextType });
          }
          nextDiagramCode = healed;
        } else {
          logger.error("Generated Mermaid remained invalid; preserving previous diagram", {
            type: nextType,
            error: validation.error,
          });

          nextDiagramCode = currentDiagram || 'flowchart TD\n  A["Generation produced invalid syntax"] --> B["Please retry"]';
          toast({
            title: "Auto-healed invalid response",
            description: "Received invalid Mermaid syntax. Preserved a stable diagram state.",
            variant: "destructive",
          });
        }
      }

      // Finalize assistant message with cleaned explanation + suggestions
      const assistantMessage: Message = {
        role: "assistant",
        content: `${response.explanation}\n\n${response.suggestions.length > 0
          ? "**Suggestions:**\n" + response.suggestions.map((s) => `• ${s}`).join("\n")
          : ""
          }`,
        timestamp: Date.now(),
      };

      // Mark user message as sent and update assistant message in-place (streaming already added it)
      const sentUserMessage: Message = {
        ...userMessage,
        status: "sent",
        retryAttempt: undefined,
        estimatedWaitSeconds: undefined,
      };

      setMessages(prev => {
        const finalHistory = [...prev];
        if (finalHistory[userMessageIndex]) {
          finalHistory[userMessageIndex] = sentUserMessage;
        }
        if (finalHistory[assistantMessageIndex]) {
          finalHistory[assistantMessageIndex] = assistantMessage;
        }
        return finalHistory;
      });
      setCurrentDiagram(nextDiagramCode);

      // Add to history
      if (settings.autoSave) {
        const newEntry: DiagramHistoryEntry = {
          code: nextDiagramCode,
          prompt: content,
          timestamp: Date.now(),
        };
        const newHistory = [...diagramHistory, newEntry];
        setDiagramHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        storage.saveDiagramHistory(newHistory);
        storage.saveHistoryIndex(newHistory.length - 1);
      }

      storage.saveCurrentDiagram(nextDiagramCode);
      // Save chat history from current state
      setMessages(prev => {
        storage.saveChatHistory(prev);
        return prev;
      });

      toast({
        title: "Diagram Generated",
        description: "Your system diagram is ready",
      });
    } catch (error) {
      if (!isCurrentRequest()) {
        return;
      }
      logger.error("Generation error", error);

      // Mark user message as error
      updateMessageStatus({
        status: "error",
        retryAttempt: undefined,
        estimatedWaitSeconds: undefined
      });

      // Check if it's a rate limit error and show specific guidance
      const isRateLimitError = error instanceof Error &&
        (error.name === "RateLimitError" ||
          error.message.toLowerCase().includes("rate limit") ||
          error.message.includes("429"));

      toast({
        title: isRateLimitError ? "Rate Limit Reached" : "Generation Failed",
        description: isRateLimitError
          ? "API quota exceeded. Wait a moment and try again, or upgrade your API tier for higher limits."
          : (error instanceof Error ? error.message : "Failed to generate diagram"),
        variant: "destructive",
      });
    } finally {
      if (isCurrentRequest()) {
        setIsGenerating(false);
      }
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    // Persist API key separately for explicit control
    storage.saveApiKey(newSettings.geminiApiKey);
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated",
    });
  };

  const handleApplyCode = (code: string) => {
    setCurrentDiagram(code);
    storage.saveCurrentDiagram(code);

    if (settings.autoSave) {
      const newEntry: DiagramHistoryEntry = {
        code,
        prompt: "Manual code edit",
        timestamp: Date.now(),
      };
      const newHistory = [...diagramHistory, newEntry];
      setDiagramHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      storage.saveDiagramHistory(newHistory);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentDiagram(diagramHistory[newIndex].code);
      storage.saveHistoryIndex(newIndex);
      storage.saveCurrentDiagram(diagramHistory[newIndex].code);
    }
  };

  const handleRedo = () => {
    if (historyIndex < diagramHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentDiagram(diagramHistory[newIndex].code);
      storage.saveHistoryIndex(newIndex);
      storage.saveCurrentDiagram(diagramHistory[newIndex].code);
    }
  };

  const handleRefreshChat = () => {
    generationRequestIdRef.current += 1;
    setMessages([]);
    storage.saveChatHistory([]);
    setCurrentDiagram("");
    storage.saveCurrentDiagram("");
    setIsGenerating(false);
    toast({
      title: "Chat reset",
      description: "Conversation cleared. Diagram history is still available.",
    });
  };

  const handleRestoreHistory = (index: number) => {
    setHistoryIndex(index);
    setCurrentDiagram(diagramHistory[index].code);
    storage.saveHistoryIndex(index);
    storage.saveCurrentDiagram(diagramHistory[index].code);
    toast({
      title: "Diagram Restored",
      description: "Previous version loaded successfully",
    });
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);
  // Allow zoom range from 0.1 to 5 (10% to 500%)
  const handleZoomInExpanded = () => setZoom((prev) => Math.min(prev + 0.1, 5));
  const handleZoomOutExpanded = () => setZoom((prev) => Math.max(prev - 0.1, 0.1));
  const handleZoomResetExpanded = () => setZoom(1);

  const handleWheelZoom = (newZoom: number) => {
    setZoom(() => Math.max(0.1, Math.min(newZoom, 5)));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Fit diagram to screen - calculates optimal zoom based on SVG and container size
  const handleFitToScreen = () => {
    const svgContainer = document.getElementById("diagram-svg-container");
    const svg = svgContainer?.querySelector("svg");
    const canvas = document.querySelector("[data-diagram-canvas]") as HTMLElement;

    if (!svg || !canvas) {
      setZoom(1);
      return;
    }

    // Get natural SVG dimensions
    const svgWidth = svg.getBBox?.()?.width || svg.clientWidth || 800;
    const svgHeight = svg.getBBox?.()?.height || svg.clientHeight || 600;

    // Get available canvas space (with padding)
    const padding = 64; // 32px on each side
    const canvasWidth = canvas.clientWidth - padding;
    const canvasHeight = canvas.clientHeight - padding;

    // Calculate zoom to fit both dimensions
    const zoomX = canvasWidth / svgWidth;
    const zoomY = canvasHeight / svgHeight;
    const optimalZoom = Math.min(zoomX, zoomY, 2); // Cap at 200%

    // Clamp between 0.1 and 2
    setZoom(Math.max(0.1, Math.min(optimalZoom, 2)));
  };

  // Rotating text helper for the welcome panel
  function RotatingText({ phrases, interval = 3000 }: { phrases: string[]; interval?: number }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
      if (!phrases || phrases.length === 0) {
        return;
      }
      const t = setInterval(() => setIndex((i) => (i + 1) % phrases.length), interval);
      return () => clearInterval(t);
    }, [phrases, interval]);

    return (
      <span className="inline-block text-foreground font-semibold transition-opacity duration-300">
        {phrases[index]}
      </span>
    );
  }

  return (
    <div className="h-[100dvh] min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Skip to content - Accessibility */}
      <a
        href="#app-workspace"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to workspace
      </a>

      {/* Gradient Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-background)" }} />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="premium-blur border-b border-white/10">
          <div className="mx-auto w-full max-w-[1800px] px-3 sm:px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-primary/60 to-accent/60 blur-sm opacity-50" />
                  <DiagfloLogo className="relative w-8 h-8 sm:w-9 sm:h-9" />
                </div>
                <div className="leading-tight">
                  <h1 className="text-sm sm:text-base font-semibold tracking-tight text-foreground/95">Diagflo Workspace</h1>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full border border-white/10 bg-black/20">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 hover:bg-white/10">
                    <Home className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                    <span className="text-xs">Home</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)} className="h-8 rounded-full px-3 hover:bg-white/10">
                  <History className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                  <span className="text-xs">History</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowExamples(true)} className="h-8 rounded-full px-3 hover:bg-white/10">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                  <span className="text-xs">Examples</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="h-8 rounded-full px-3 hover:bg-white/10">
                  <Settings className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                  <span className="text-xs">Settings</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowShare(true)} className="h-8 rounded-full px-3 text-primary hover:bg-primary/10">
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  <span className="text-xs">Share</span>
                </Button>
                <Link to="/docs">
                  <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 hover:bg-white/10">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                    <span className="text-xs">Docs</span>
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <div className="flex md:hidden items-center gap-1 mr-0.5">
                  <Link to="/">
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-white/10" title="Home">
                      <Home className="w-3.5 h-3.5 opacity-80" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setShowHistory(true)} className="w-8 h-8 rounded-full hover:bg-white/10" title="History">
                    <History className="w-3.5 h-3.5 opacity-80" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowExamples(true)} className="w-8 h-8 rounded-full hover:bg-white/10" title="Examples">
                    <Sparkles className="w-3.5 h-3.5 opacity-80" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="w-8 h-8 rounded-full hover:bg-white/10" title="Settings">
                    <Settings className="w-3.5 h-3.5 opacity-80" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowShare(true)} className="w-8 h-8 rounded-full hover:bg-primary/10 text-primary" title="Share">
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="hidden sm:block w-px h-4 bg-white/10 mx-1" />

                <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)} className="w-8 h-8 rounded-full hover:bg-white/10" title="Help Guide">
                  <HelpCircle className="w-3.5 h-3.5 opacity-80" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowCredits(true)} className="w-8 h-8 rounded-full hover:bg-white/10" title="Credits & GitHub">
                  <Github className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="hidden sm:inline-flex w-8 h-8 rounded-full hover:bg-white/10"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5 opacity-80" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 opacity-80" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 p-2 sm:p-3 lg:p-4">
          <div
            className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/25 shadow-[0_20px_60px_-24px_hsl(240_10%_2%_/_0.7)] flex flex-col lg:flex-row"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            id="app-workspace"
            role="main"
            aria-label="Diagram workspace"
          >
            {/* Chat Column (resizable) */}
            <section
              style={{
                width: isMobile ? '100%' : `${chatWidth}px`,
                minWidth: isMobile ? '100%' : `${Math.floor(window.innerWidth * MIN_CHAT_WIDTH_RATIO)}px`,
                display: isMobile && mobileView !== 'chat' ? 'none' : 'flex'
              }}
              className={`flex-col min-h-0 shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-background/25 ${isMobile ? 'pb-[calc(64px+env(safe-area-inset-bottom))]' : ''}`}
            >
              <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/85">Conversation</p>
                  <p className="text-sm font-medium text-foreground/90">Build and refine your diagram</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-2 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10"
                  onClick={handleRefreshChat}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New</span>
                </Button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 space-y-5">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4 max-w-sm animate-slide-up">
                      <h2 className="text-2xl font-bold tracking-tight text-foreground/95 leading-tight">Flow your thoughts</h2>
                      <p className="text-sm text-muted-foreground/80 max-w-xs mx-auto">
                        Visualize systems with production-grade structure and clarity.
                      </p>
                      <StarterPrompts onSelect={(prompt) => handleSendMessage(prompt)} />
                      <QuickTips />
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} />
                ))}

                {isGenerating && <TypingIndicator />}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-white/10 bg-background/30 p-2 sm:p-3">
                <ChatInput
                  onSend={handleSendMessage}
                  onShowExamples={() => setShowExamples(true)}
                  onOpenSettings={() => setShowSettings(true)}
                  hasApiKey={Boolean(settings.geminiApiKey)}
                  disabled={isGenerating}
                />
              </div>

              {/* Built-with badge for recruiter-friendly tech validation */}
              <div className="px-4 sm:px-5 py-1.5 border-t border-white/5 flex items-center justify-center">
                <a
                  href="https://github.com/itsyashvardhan/Diagflo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
                >
                  Built with React · Gemini · Mermaid · Vite
                </a>
              </div>
            </section>

            {/* Resize handle (desktop only) */}
            <div
              role="separator"
              onMouseDown={handleMouseDownResize}
              onTouchStart={handleTouchStartResize}
              className="hidden lg:flex w-1.5 hover:w-2 group relative items-center justify-center cursor-col-resize select-none transition-all duration-300"
            >
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/10 group-hover:bg-primary/40 transition-colors" />
              <div className="w-1 h-12 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Diagram Column */}
            <section
              className="flex-1 min-h-0 flex flex-col relative bg-muted/15"
              style={{
                display: isMobile && mobileView !== 'canvas' ? 'none' : 'flex'
              }}
            >
              <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2 pointer-events-none">
                <div className="pointer-events-auto">
                  <DiagramControls
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onViewImport={() => setShowCodeView(true)}
                    onExport={() => setShowExport(true)}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < diagramHistory.length - 1}
                    disabled={!currentDiagram}
                  />
                </div>
                <div className="pointer-events-auto flex items-center gap-2">
                  {currentDiagram && (
                    <span className="hidden sm:inline-flex items-center rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      Version {historyIndex >= 0 ? historyIndex + 1 : 1}
                    </span>
                  )}
                  <ZoomControls
                    zoom={zoom}
                    onZoomIn={handleZoomInExpanded}
                    onZoomOut={handleZoomOutExpanded}
                    onZoomReset={handleZoomResetExpanded}
                    onFitToScreen={handleFitToScreen}
                  />
                </div>
              </div>

              <div className="flex-1 dotted-grid relative" data-diagram-canvas>
                <DiagramViewer
                  code={currentDiagram}
                  theme={settings.theme}
                  zoom={zoom}
                  onWheelZoom={handleWheelZoom}
                  prompt={diagramHistory[historyIndex]?.prompt}
                  onRenderSuccess={handleFitToScreen}
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/5 bg-background/95 backdrop-blur-lg safe-area-inset-bottom">
          <button
            onClick={() => setMobileView('chat')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-1 ${mobileView === 'chat'
              ? 'text-primary'
              : 'text-muted-foreground'
              }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">Chat</span>
          </button>
          <button
            onClick={() => setMobileView('canvas')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-1 ${mobileView === 'canvas'
              ? 'text-primary'
              : 'text-muted-foreground'
              }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs">Canvas</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <ExamplesModal
        open={showExamples}
        onOpenChange={setShowExamples}
        onSelectExample={handleSendMessage}
      />

      <CodeViewModal
        open={showCodeView}
        onOpenChange={setShowCodeView}
        code={currentDiagram}
        onApply={handleApplyCode}
      />

      <ExportModal
        open={showExport}
        onOpenChange={setShowExport}
        code={currentDiagram}
      />

      <HistoryModal
        open={showHistory}
        onOpenChange={setShowHistory}
        history={diagramHistory}
        onRestore={handleRestoreHistory}
      />

      <HelpModal
        open={showHelp}
        onOpenChange={setShowHelp}
      />

      <CreditsModal
        open={showCredits}
        onOpenChange={setShowCredits}
      />

      <ShareModal
        open={showShare}
        onOpenChange={setShowShare}
        diagramCode={currentDiagram}
      />
    </div>
  );
};

export default Index;
