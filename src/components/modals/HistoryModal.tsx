import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DiagramHistoryEntry } from "@/types/diagflo";
import { Clock, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: DiagramHistoryEntry[];
  onRestore: (index: number) => void;
}

export function HistoryModal({
  open,
  onOpenChange,
  history,
  onRestore,
}: HistoryModalProps) {
  const handleRestore = (index: number) => {
    onRestore(index);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass-panel border-white/10 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">Diagram History</DialogTitle>
          <DialogDescription>
            Restore a previous version of your diagram
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 overflow-y-auto max-h-[500px]">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No history yet</p>
            </div>
          ) : (
            [...history].reverse().map((entry, reversedIndex) => {
              // Calculate the original index for restoring
              const originalIndex = history.length - 1 - reversedIndex;
              return (
                <div
                  key={originalIndex}
                  className="glass-panel p-4 hover-glow transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 mb-2">
                        {entry.prompt}
                      </p>
                      <pre className="text-xs text-muted-foreground bg-background/50 p-2 rounded overflow-x-auto line-clamp-3">
                        {entry.code}
                      </pre>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(originalIndex)}
                      className="flex-shrink-0"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
