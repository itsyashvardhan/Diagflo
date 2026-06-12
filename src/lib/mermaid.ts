import { MermaidTheme } from "@/types/diagflo";
import { sanitizeDiagram, detectDiagramType, getDiagramTypeLabel } from "./diagramSanitizer";
import { logger } from "./logger";

export interface MermaidConfig {
  theme: MermaidTheme;
  themeVariables?: Record<string, string>;
}

export const getMermaidConfig = (theme: MermaidTheme): MermaidConfig => {
  const configs: Record<MermaidTheme, MermaidConfig> = {
    default: {
      theme: "default",
      themeVariables: {
        primaryColor: "#a78bfa",
        primaryTextColor: "#fff",
        primaryBorderColor: "#8b5cf6",
        lineColor: "#60a5fa",
        secondaryColor: "#7dd3fc",
        tertiaryColor: "#c084fc",
        fontSize: "16px",
        fontFamily: "Manrope, system-ui, sans-serif",
        clusterBkg: "#f5f3ff",
        clusterBorder: "#e9d5ff",
        nodeBkg: "#ffffff",
        nodeBorder: "#d8b4fe",
        titleColor: "#1e1b4b",
      },
    },
    forest: {
      theme: "forest",
      themeVariables: {
        primaryColor: "#34d399",
        primaryTextColor: "#fff",
        primaryBorderColor: "#10b981",
        lineColor: "#6ee7b7",
        fontSize: "16px",
        fontFamily: "Manrope, system-ui, sans-serif",
        clusterBkg: "#f0fdf4",
        clusterBorder: "#bbf7d0",
        nodeBkg: "#ffffff",
        nodeBorder: "#86efac",
        titleColor: "#064e3b",
      },
    },
    dark: {
      theme: "dark",
      themeVariables: {
        darkMode: "true",
        primaryColor: "#8b5cf6",
        primaryTextColor: "#fff",
        primaryBorderColor: "#6d28d9",
        lineColor: "#a78bfa",
        fontSize: "16px",
        fontFamily: "Manrope, system-ui, sans-serif",
        clusterBkg: "#1e1b4b",
        clusterBorder: "#4c1d95",
        nodeBkg: "#1f2937",
        nodeBorder: "#374151",
        titleColor: "#f9fafb",
      },
    },
    neutral: {
      theme: "neutral",
      themeVariables: {
        primaryColor: "#64748b",
        primaryTextColor: "#fff",
        primaryBorderColor: "#475569",
        lineColor: "#94a3b8",
        fontSize: "16px",
        fontFamily: "Manrope, system-ui, sans-serif",
        clusterBkg: "#f8fafc",
        clusterBorder: "#e2e8f0",
        nodeBkg: "#ffffff",
        nodeBorder: "#cbd5e1",
        titleColor: "#0f172a",
      },
    },
  };

  return configs[theme];
};

// Store mermaid instance to avoid re-initialization issues
let mermaidInstance: typeof import("mermaid").default | null = null;
let lastTheme: MermaidTheme | null = null;
const RENDER_TIMEOUT_MS = 30000;
const LARGE_DIAGRAM_COMPLEXITY_THRESHOLD = 450;
const MAX_SAFE_SVG_DIMENSION = 32000;

export const initializeMermaid = async (theme: MermaidTheme = "default") => {
  try {
    // Dynamically import mermaid
    const mermaid = (await import("mermaid")).default;

    const config = getMermaidConfig(theme);

    mermaid.initialize({
      startOnLoad: false,
      theme: config.theme,
      themeVariables: config.themeVariables,
      securityLevel: "sandbox",
      suppressErrorRendering: true, // Suppress error rendering in the diagram
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        padding: 20,
        nodeSpacing: 50,
        rankSpacing: 50,
      },
    });

    mermaidInstance = mermaid;
    lastTheme = theme;
    return mermaid;
  } catch (error) {
    logger.error("Failed to initialize Mermaid", error);
    throw new Error("Failed to initialize diagram renderer");
  }
};

/**
 * Validates mermaid syntax without rendering
 */
export const validateMermaidSyntax = async (code: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    const mermaid = mermaidInstance || (await initializeMermaid());

    // Use parse to validate syntax without rendering
    await mermaid.parse(code);
    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Invalid diagram syntax";
    // Clean up the error message for better readability
    const cleanedError = cleanErrorMessage(errorMessage);
    return { valid: false, error: cleanedError };
  }
};

/**
 * Cleans up mermaid error messages to be more user-friendly
 */
const cleanErrorMessage = (error: string): string => {
  // Remove technical jargon and make errors more readable
  let cleaned = error
    .replace(/Lexical error on line \d+\./g, "Syntax error:")
    .replace(/Expecting .+?, got .+/g, (match) => match.replace(/Expecting /, "Expected ").replace(/, got /, " but found "))
    .replace(/Parse error on line \d+:/g, "")
    .replace(/\n/g, " ")
    .trim();

  // Truncate very long error messages
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200) + "...";
  }

  return cleaned || "Invalid diagram syntax. Please check your Mermaid code.";
};

function estimateDiagramComplexity(code: string): number {
  const lines = code.split("\n").length;
  const edges = (code.match(/-->|==>|-.->|->>|-->>|\.\.>/g) || []).length;
  const subgraphs = (code.match(/\bsubgraph\b/gi) || []).length;
  return lines + (edges * 2) + (subgraphs * 8);
}

function simplifyDiagramForLargeRender(code: string): { code: string; fixes: string[] } {
  const fixes: string[] = [];
  let result = code;

  const removableDirectives = [
    /^\s*style\s+.+$/gim,
    /^\s*classDef\s+.+$/gim,
    /^\s*class\s+.+$/gim,
    /^\s*linkStyle\s+.+$/gim,
    /^\s*%%\{init:.*\}%%\s*$/gim,
  ];

  for (const pattern of removableDirectives) {
    if (pattern.test(result)) {
      result = result.replace(pattern, "");
    }
  }

  if (result !== code) {
    fixes.push("Removed heavy style directives for large-diagram stability");
  }

  const longLabelPattern = /(["'])((?:(?!\1).){120,})\1/g;
  if (longLabelPattern.test(result)) {
    result = result.replace(longLabelPattern, (_match, quote: string, label: string) => {
      return `${quote}${label.slice(0, 117)}...${quote}`;
    });
    fixes.push("Trimmed oversized labels to reduce SVG load");
  }

  result = result.replace(/\n{3,}/g, "\n\n").trim();
  return { code: result, fixes };
}

function verifyRenderedSvg(svg: string, element: HTMLElement): void {
  if (!svg || !svg.includes("<svg")) {
    throw new Error("Renderer returned invalid SVG output");
  }

  element.innerHTML = svg;

  const svgElement = element.querySelector("svg");
  if (!svgElement) {
    throw new Error("Rendered SVG is missing root element");
  }

  const width = Number.parseFloat(svgElement.getAttribute("width") || "0");
  const height = Number.parseFloat(svgElement.getAttribute("height") || "0");

  if (
    (Number.isFinite(width) && width > MAX_SAFE_SVG_DIMENSION) ||
    (Number.isFinite(height) && height > MAX_SAFE_SVG_DIMENSION)
  ) {
    throw new Error("Diagram is too large for safe canvas rendering. Try a simplified view.");
  }

  void element.offsetHeight;
}

export const renderDiagram = async (
  code: string,
  elementId: string,
  theme: MermaidTheme = "default"
): Promise<void> => {
  // Validate input
  if (!code || typeof code !== "string") {
    throw new Error("No diagram code provided");
  }

  const trimmedCode = code.trim();
  if (!trimmedCode) {
    throw new Error("Diagram code is empty");
  }

  try {
    // Step 1: Sanitize the diagram code (auto-fix known issues)
    const sanitized = sanitizeDiagram(trimmedCode);

    const diagramType = sanitized.diagramType;
    const baseCode = sanitized.code;

    // Step 2: Re-initialize if theme changed
    const mermaid = lastTheme !== theme
      ? await initializeMermaid(theme)
      : mermaidInstance || await initializeMermaid(theme);

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Diagram container not found`);
    }

    // Step 3: Validate syntax
    const validation = await validateMermaidSyntax(baseCode);
    if (!validation.valid) {
      const typeLabel = getDiagramTypeLabel(diagramType);
      throw new Error(`${typeLabel} syntax error: ${validation.error || "Invalid syntax"}`);
    }

    const complexity = estimateDiagramComplexity(baseCode);
    const largeDiagram = complexity >= LARGE_DIAGRAM_COMPLEXITY_THRESHOLD;

    const attempts: { label: string; code: string }[] = [{ label: "primary", code: baseCode }];
    if (largeDiagram) {
      const simplified = simplifyDiagramForLargeRender(baseCode);
      if (simplified.code && simplified.code !== baseCode) {
        attempts.push({ label: "simplified-large", code: simplified.code });
      }
    }

    let lastRenderError: Error | null = null;
    for (const attempt of attempts) {
      try {
        element.innerHTML = "";
        const graphId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const renderPromise = mermaid.render(graphId, attempt.code);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Diagram rendering timed out. The diagram may be too complex.")), RENDER_TIMEOUT_MS);
        });
        const { svg } = await Promise.race([renderPromise, timeoutPromise]);
        verifyRenderedSvg(svg, element);
        return;
      } catch (attemptError) {
        lastRenderError = attemptError instanceof Error ? attemptError : new Error("Render attempt failed");
        logger.warn("Mermaid render attempt failed", {
          attempt: attempt.label,
          complexity,
          diagramType,
          error: lastRenderError.message,
        });
      }
    }

    throw lastRenderError || new Error("Failed to render diagram after recovery attempts");
  } catch (error) {
    logger.error("Mermaid rendering error", error);

    // Provide a clean, user-friendly error
    if (error instanceof Error) {
      const cleanedMessage = cleanErrorMessage(error.message);
      throw new Error(cleanedMessage);
    }

    throw new Error("Failed to render diagram. Please check your syntax.");
  }
};

/**
 * Safely clears any rendered diagram
 */
export const clearDiagram = (elementId: string): void => {
  try {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = "";
    }
  } catch (error) {
    logger.error("Failed to clear diagram", error);
  }
};
