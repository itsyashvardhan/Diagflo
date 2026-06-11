import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { renderDiagram, clearDiagram } from "@/lib/mermaid";
import { sanitizeDiagram, getDiagramTypeLabel, detectDiagramType } from "@/lib/diagramSanitizer";
import { DiagfloLogo } from "@/components/logo/DiagfloLogo";
import { logger } from "@/lib/logger";
import { MermaidTheme } from "@/types/diagflo";
import { AlertCircle, RefreshCw, Code, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ChartRenderer } from "./ChartRenderer";

interface DiagramViewerProps {
  code: string;
  theme?: MermaidTheme;
  zoom?: number;
  onWheelZoom?: (newZoom: number, centerX?: number, centerY?: number) => void;
  prompt?: string;
  onRenderSuccess?: () => void;
}

function DiagramViewerInternal({ code, theme = "default", zoom = 1, onWheelZoom, prompt, onRenderSuccess }: DiagramViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [retryCount, setRetryCount] = useState(0);
  const [diagramType, setDiagramType] = useState<string | null>(null);
  const [autoFixes, setAutoFixes] = useState<string[]>([]);
  const [showFixNotification, setShowFixNotification] = useState(false);

  const render = useCallback(async () => {
    if (!code || !containerRef.current) {
      setIsLoading(false);
      setDiagramType(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAutoFixes([]);

    try {
      // Pre-check for diagram type and sanitization
      const sanitized = sanitizeDiagram(code);
      setDiagramType(sanitized.diagramType);

      if (sanitized.fixes.length > 0) {
        setAutoFixes(sanitized.fixes);
        setShowFixNotification(true);
        // Hide notification after 4 seconds
        setTimeout(() => setShowFixNotification(false), 4000);
      }

      await renderDiagram(code, "diagram-svg-container", theme);
      setRetryCount(0);
      if (onRenderSuccess) {
        setTimeout(onRenderSuccess, 50);
      }
    } catch (err) {
      logger.error("Diagram render error", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to render diagram";
      setError(errorMessage);
      clearDiagram("diagram-svg-container");
    } finally {
      setIsLoading(false);
    }
  }, [code, theme, onRenderSuccess]);

  useEffect(() => {
    render();
  }, [render]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    render();
  }, [render]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && code && !error) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!code || error) return;

    const isZoomGesture = e.ctrlKey || e.shiftKey || Math.abs(e.deltaY) > 0;
    if (!isZoomGesture) return;

    e.preventDefault();
    const delta = -e.deltaY;
    const scaleAmount = delta > 0 ? 1.075 : 0.93;
    const newZoom = Math.max(0.1, Math.min((zoom || 1) * scaleAmount, 5));

    if (onWheelZoom) {
      const rect = containerRef.current?.getBoundingClientRect();
      const cx = rect ? e.clientX - rect.left : undefined;
      const cy = rect ? e.clientY - rect.top : undefined;
      onWheelZoom(newZoom, cx, cy);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-8 overflow-hidden select-none relative"
      style={{
        cursor: isDragging ? 'grabbing' : (code && !error) ? 'grab' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >


      {/* Auto-fix notification toast */}
      {showFixNotification && autoFixes.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-slide-in">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-lg border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">
              Auto-fixed {autoFixes.length} issue{autoFixes.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Diagram type badge */}
      {diagramType && !error && !isLoading && code && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 text-xs">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground font-medium">
              {getDiagramTypeLabel(diagramType)}
            </span>
          </div>
        </div>
      )}

      {/* Mini Toolbar / Hints - Bottom Right */}
      {code && !error && !isLoading && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2 text-[10px] text-muted-foreground/50 font-medium select-none pointer-events-none">
          <div className="flex items-center gap-1.5 bg-background/20 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <span>Drag to pan</span>
          </div>
          <div className="flex items-center gap-1.5 bg-background/20 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <span>Scroll to zoom</span>
          </div>
        </div>
      )}

      {/* Error state with enhanced recovery options */}
      {error && (
        <div className="glass-panel p-6 max-w-lg text-center space-y-4 rounded-2xl animate-scale-in">
          <div className="w-14 h-14 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {diagramType ? `${getDiagramTypeLabel(diagramType)} Error` : 'Diagram Rendering Error'}
            </h3>
            {diagramType && (
              <p className="text-xs text-muted-foreground mt-1">
                Detected type: {getDiagramTypeLabel(diagramType)}
              </p>
            )}
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-left">
            <div className="flex items-start gap-2">
              <Code className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground break-words">{error}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry {retryCount > 0 && `(${retryCount})`}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Tips:</strong></p>
            <ul className="text-left list-disc list-inside space-y-0.5">
              <li>Ask Archie to simplify the diagram</li>
              <li>Request a different diagram type</li>
              <li>Check the code view for syntax issues</li>
            </ul>
          </div>
        </div>
      )}

      {/* Enhanced loading state with thinking animation */}
      {!error && isLoading && code && (
        <div className="flex flex-col items-center gap-6">
          {/* Thinking animation */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
            </div>
            <div className="absolute inset-0 animate-[spin_3s_linear_infinite_reverse]" style={{ animationDelay: '0.5s' }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-accent rounded-full" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">
              {diagramType ? `Rendering ${getDiagramTypeLabel(diagramType)}...` : 'Processing diagram...'}
            </p>
            <p className="text-xs text-muted-foreground animate-pulse">
              Validating and optimizing syntax
            </p>
          </div>

          {/* Skeleton preview */}
          <div className="flex flex-col items-center gap-3 opacity-40">
            <div className="w-28 h-10 bg-muted/30 rounded-lg border border-border/20 animate-pulse" />
            <div className="w-0.5 h-4 bg-muted/30" />
            <div className="flex items-center gap-6">
              <div className="w-24 h-8 bg-muted/20 rounded-lg border border-border/15 animate-pulse" />
              <div className="w-24 h-8 bg-muted/20 rounded-lg border border-border/15 animate-pulse" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!error && !code && (
        <div className="text-center space-y-6 max-w-md animate-fade-in relative z-10">
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
            {/* Ghost Grid - Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              {/* Ghost Nodes */}
              <div className="absolute top-4 left-4 w-8 h-8 rounded border border-white/20" />
              <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full border border-white/20" />
            </div>

            {/* Logo - Foreground */}
            <div className="relative z-10 p-6 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 shadow-2xl backdrop-blur-sm">
              <DiagfloLogo className="w-16 h-16 opacity-80" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-semibold opacity-90">Ready to Visualize</h3>
            <p className="text-sm text-muted-foreground/60">
              Your diagrams will appear here
            </p>
          </div>
        </div>
      )}

      {/* Diagram container */}
      <div
        key={code} // Force re-render when code changes
        id="diagram-svg-container"
        className="animate-scale-in"
        style={{
          display: error || !code || isLoading ? 'none' : 'block',
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      />
    </div>
  );
}

// Wrapper component with ErrorBoundary and renderer routing
export function DiagramViewer(props: DiagramViewerProps) {
  const handleError = (error: Error) => {
    logger.error("DiagramViewer ErrorBoundary caught", error);
  };

  // Detect if this is a Chart.js DSL or Mermaid diagram
  const isChartJS = useMemo(() => {
    if (!props.code) return false;
    const type = detectDiagramType(props.code);
    return type === 'chartjs';
  }, [props.code]);

  // Map MermaidTheme to ChartRenderer theme
  const chartTheme = props.theme === 'dark' ? 'dark' : 'light';

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="glass-panel p-6 max-w-md text-center space-y-4 rounded-2xl">
            <div className="w-14 h-14 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold">Diagram Crashed</h3>
            <p className="text-sm text-muted-foreground">
              The diagram renderer encountered a critical error. Please refresh the page or try a different diagram.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      {isChartJS ? (
        <ChartRenderer
          code={props.code}
          theme={chartTheme}
          zoom={props.zoom}
        />
      ) : (
        <DiagramViewerInternal {...props} />
      )}
    </ErrorBoundary>
  );
}
