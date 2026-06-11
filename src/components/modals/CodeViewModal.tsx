import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  onApply: (code: string) => void;
}

export function CodeViewModal({ open, onOpenChange, code, onApply }: CodeViewModalProps) {
  const [localCode, setLocalCode] = useState(code);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const handleApply = () => {
    onApply(localCode);
    onOpenChange(false);
    toast({
      title: "Applied",
      description: "Diagram code updated successfully",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] glass-panel border-white/10 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">Diagram Code</DialogTitle>
          <DialogDescription>
            Edit the Mermaid code directly or copy to use elsewhere
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={localCode}
            onChange={(e) => setLocalCode(e.target.value)}
            className="font-mono text-sm min-h-[400px] bg-background/50"
            placeholder="graph TD\n  A[Start] --> B[Process]\n  B --> C[End]"
          />

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="glass-panel"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} className="hover-glow">
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
