import { Button } from "@/components/ui/button";
import { Download, Undo2, Redo2, Upload } from "lucide-react";

interface DiagramControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onViewImport: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  disabled?: boolean;
}

export function DiagramControls({
  onUndo,
  onRedo,
  onViewImport,
  onExport,
  canUndo,
  canRedo,
  disabled,
}: DiagramControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Action Pillar */}
      <div className="glass-panel p-1 flex items-center gap-1 rounded-full shadow-lg" role="toolbar" aria-label="Diagram controls">
        <Button
          size="sm"
          variant="ghost"
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className="h-8 w-8 rounded-full hover:bg-white/10 transition-colors"
          title="Undo (Ctrl+Z)"
          aria-label="Undo last change"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onRedo}
          disabled={!canRedo || disabled}
          className="h-8 w-8 rounded-full hover:bg-white/10 transition-colors"
          title="Redo (Ctrl+Y)"
          aria-label="Redo last change"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-3 bg-white/10 mx-0.5" />

        <Button
          size="sm"
          variant="ghost"
          onClick={onViewImport}
          disabled={disabled}
          className="h-8 rounded-full px-3 hover:bg-white/10 transition-colors text-[11px] font-bold tracking-tight"
          aria-label="Import or view diagram code"
        >
          <Upload className="w-3.5 h-3.5 mr-2 opacity-70" />
          Import
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onExport}
          disabled={disabled}
          className="h-8 rounded-full px-3 hover:bg-white/10 transition-colors text-[11px] font-bold tracking-tight"
          aria-label="Export diagram"
        >
          <Download className="w-3.5 h-3.5 mr-2 opacity-70" />
          Export
        </Button>
      </div>
    </div>
  );
}
