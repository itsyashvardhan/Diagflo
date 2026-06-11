import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, MessageSquare, Code, Download, History } from "lucide-react";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
  const steps = [
    { 
      icon: Sparkles, 
      title: "Add Your API Key", 
      description: "Click Settings and add your Gemini API key to enable AI generation" 
    },
    { 
      icon: MessageSquare, 
      title: "Describe Your System", 
      description: "Type what you want to build—architecture, flow, database schema, etc." 
    },
    { 
      icon: Code, 
      title: "Review & Refine", 
      description: "Archie generates a Mermaid diagram. Edit manually or ask for changes" 
    },
    { 
      icon: Download, 
      title: "Export & Share", 
      description: "Download as PNG/SVG or copy the code to use anywhere" 
    },
    { 
      icon: History, 
      title: "Track Your Progress", 
      description: "All diagrams are saved to history. Use Cmd/Ctrl+Z to undo anytime" 
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass-panel border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl gradient-text">Getting Started with Diagflo</DialogTitle>
          <DialogDescription>
            Follow these quick steps to create your first diagram
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 rounded-lg glass-panel hover:bg-accent/5 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-semibold text-sm">{i + 1}. {step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> Press <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border">Ctrl</kbd>
            <span className="px-1 font-semibold">+</span>
            <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border">?</kbd>
            anytime for keyboard shortcuts
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
