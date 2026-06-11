import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitToScreen?: () => void;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
}: ZoomControlsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="glass-panel p-1 flex items-center gap-0.5 rounded-full shadow-lg" role="toolbar" aria-label="Zoom controls">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onZoomOut}
              disabled={zoom <= 0.1}
              className="h-8 w-8 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="premium-blur border-white/10">
            <p className="text-xs"></p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={onZoomReset}
              className="h-8 px-3 min-w-[3.5rem] text-[11px] font-bold rounded-full hover:bg-white/10 transition-colors tracking-tight"
              aria-label={`Reset zoom, currently ${Math.round(zoom * 100)}%`}
            >
              {Math.round(zoom * 100)}%
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="premium-blur border-white/10">
            <p className="text-xs"></p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onZoomIn}
              disabled={zoom >= 5}
              className="h-8 w-8 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="premium-blur border-white/10">
            <p className="text-xs"></p>
          </TooltipContent>
        </Tooltip>

        {onFitToScreen && (
          <div className="flex items-center">
            <div className="w-px h-3 bg-white/10 mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onFitToScreen}
                  className="h-8 w-8 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Fit diagram to screen"
                >
                  <Maximize className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="premium-blur border-white/10">
                <p className="text-xs">Fit to screen</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
