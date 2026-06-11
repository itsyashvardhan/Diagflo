import { useState, useMemo } from "react";
import { logger } from "@/lib/logger";
import { isChartJSDSL } from "@/lib/chartDSL";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileCode, Copy, Image, ClipboardCopy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

export function ExportModal({ open, onOpenChange, code }: ExportModalProps) {
  const { toast } = useToast();
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);

  /** Whether the current diagram is a Chart.js canvas (not SVG) */
  const isChartJS = useMemo(() => isChartJSDSL(code), [code]);

  const getSvgElement = (): SVGSVGElement | null => {
    return document.querySelector("#diagram-svg-container svg") as SVGSVGElement | null;
  };

  /** Get the Chart.js canvas element from the DOM */
  const getChartCanvas = (): HTMLCanvasElement | null => {
    // ChartRenderer renders a canvas inside a flex container
    // Query for any canvas element inside the diagram area
    return document.querySelector("canvas[id^='chart-']") as HTMLCanvasElement | null;
  };

  /**
   * Inlines computed styles from an SVG element to ensure proper rendering
   */
  const inlineStyles = (element: Element): void => {
    const computedStyle = window.getComputedStyle(element);
    const styleProps = ['font-family', 'font-size', 'font-weight', 'fill', 'stroke', 'stroke-width', 'opacity'];

    let inlineStyle = '';
    for (const prop of styleProps) {
      const value = computedStyle.getPropertyValue(prop);
      if (value) {
        inlineStyle += `${prop}:${value};`;
      }
    }

    if (inlineStyle) {
      const existingStyle = element.getAttribute('style') || '';
      element.setAttribute('style', existingStyle + inlineStyle);
    }

    // Recursively process children
    Array.from(element.children).forEach(child => inlineStyles(child));
  };

  /**
   * Converts SVG to a canvas element for PNG export
   * Uses data URL to avoid CORS/tainted canvas issues
   */
  const svgToCanvas = async (scale: number = 2): Promise<HTMLCanvasElement | null> => {
    const svgElement = getSvgElement();
    if (!svgElement) return null;

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Get dimensions
    const bbox = svgElement.getBoundingClientRect();
    const width = bbox.width || svgElement.clientWidth || 800;
    const height = bbox.height || svgElement.clientHeight || 600;

    // Set explicit dimensions on the cloned SVG
    clonedSvg.setAttribute("width", String(width));
    clonedSvg.setAttribute("height", String(height));
    clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // Inline styles for proper rendering
    inlineStyles(clonedSvg);

    // Add white background for better PNG export
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", "#ffffff");
    clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

    // Add a style element with embedded font fallbacks
    const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleElement.textContent = `
      * { font-family: Arial, Helvetica, sans-serif !important; }
      text { font-family: Arial, Helvetica, sans-serif !important; }
    `;
    clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(clonedSvg);

    // Convert to base64 data URL (avoids CORS/tainted canvas issues)
    const base64Data = btoa(unescape(encodeURIComponent(svgData)));
    const dataUrl = `data:image/svg+xml;base64,${base64Data}`;

    return new Promise((resolve, reject) => {
      const img = new window.Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Fill with white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the image scaled
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas);
      };

      img.onerror = (e) => {
        logger.error("Image load error", e);
        reject(new Error("Failed to load SVG image"));
      };

      img.src = dataUrl;
    });
  };

  const handleExportSVG = () => {
    if (isChartJS) {
      toast({
        title: "Not Available",
        description: "SVG export is not available for Chart.js diagrams. Use PNG instead.",
      });
      return;
    }

    const svgElement = getSvgElement();
    if (!svgElement) {
      toast({
        title: "Error",
        description: "No diagram to export",
        variant: "destructive",
      });
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diagram-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "SVG file downloaded successfully",
    });
  };

  const handleExportPNG = async () => {
    setIsExportingPng(true);

    try {
      let canvas: HTMLCanvasElement | null;

      if (isChartJS) {
        // For Chart.js, grab the canvas directly and create a high-res copy
        const sourceCanvas = getChartCanvas();
        if (!sourceCanvas) {
          throw new Error("No chart canvas found");
        }
        const scale = 2;
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;
        canvas = document.createElement("canvas");
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
      } else {
        const svgElement = getSvgElement();
        if (!svgElement) {
          throw new Error("No diagram found");
        }
        canvas = await svgToCanvas(2);
      }

      if (!canvas) {
        throw new Error("Failed to create canvas");
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "Error",
            description: "Failed to generate PNG",
            variant: "destructive",
          });
          setIsExportingPng(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `diagram-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Exported",
          description: "PNG file downloaded successfully",
        });
        setIsExportingPng(false);
      }, "image/png", 1.0);
    } catch (error) {
      logger.error("PNG export error", error);
      toast({
        title: "Error",
        description: "Failed to export PNG. Please try again.",
        variant: "destructive",
      });
      setIsExportingPng(false);
    }
  };

  const handleCopyImage = async () => {
    setIsCopyingImage(true);

    try {
      let canvas: HTMLCanvasElement | null;

      if (isChartJS) {
        const sourceCanvas = getChartCanvas();
        if (!sourceCanvas) {
          throw new Error("No chart canvas found");
        }
        const scale = 2;
        canvas = document.createElement("canvas");
        canvas.width = sourceCanvas.width * scale;
        canvas.height = sourceCanvas.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
      } else {
        const svgElement = getSvgElement();
        if (!svgElement) {
          throw new Error("No diagram found");
        }
        canvas = await svgToCanvas(2);
      }

      if (!canvas) {
        throw new Error("Failed to create canvas");
      }

      // Convert canvas to blob for clipboard
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to create blob"));
        }, "image/png", 1.0);
      });

      // Use Clipboard API to copy image
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      toast({
        title: "Copied",
        description: "Image copied to clipboard",
      });
    } catch (error) {
      logger.error("Copy image error", error);

      // Check if it's a permission error
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast({
          title: "Permission Denied",
          description: "Please allow clipboard access to copy images",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to copy image. Your browser may not support this feature.",
          variant: "destructive",
        });
      }
    } finally {
      setIsCopyingImage(false);
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] glass-panel border-white/10">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">Export Diagram</DialogTitle>
          <DialogDescription>
            Choose your preferred export format
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {/* SVG Export - only for Mermaid diagrams */}
          {!isChartJS && (
          <Button
            onClick={handleExportSVG}
            variant="outline"
            className="glass-panel h-auto py-4 transition-all duration-200 hover:bg-accent/10 hover:border-accent/30 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <FileCode className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Export as SVG</div>
                <div className="text-xs text-muted-foreground">
                  Scalable vector format
                </div>
              </div>
            </div>
          </Button>
          )}

          {/* PNG Export */}
          <Button
            onClick={handleExportPNG}
            disabled={isExportingPng}
            variant="outline"
            className="glass-panel h-auto py-4 transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                {isExportingPng ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Image className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Export as PNG</div>
                <div className="text-xs text-muted-foreground">
                  High-resolution image (2x)
                </div>
              </div>
            </div>
          </Button>

          {/* Copy Image */}
          <Button
            onClick={handleCopyImage}
            disabled={isCopyingImage}
            variant="outline"
            className="glass-panel h-auto py-4 transition-all duration-200 hover:bg-green-500/10 hover:border-green-500/30 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                {isCopyingImage ? (
                  <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                ) : (
                  <ClipboardCopy className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Copy Image</div>
                <div className="text-xs text-muted-foreground">
                  Copy diagram to clipboard
                </div>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleCopyCode}
            variant="outline"
            className="glass-panel h-auto py-4 transition-all duration-200 hover:bg-secondary hover:border-foreground/20 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Copy className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Copy Code</div>
                <div className="text-xs text-muted-foreground">
                  {isChartJS ? "Chart DSL source code" : "Mermaid source code"}
                </div>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
