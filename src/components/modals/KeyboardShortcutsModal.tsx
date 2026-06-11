import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const shortcuts = [
    {
        category: "General",
        items: [
            { keys: ["Ctrl/⌘", "?"], description: "Open keyboard shortcuts" },
            { keys: ["Ctrl/⌘", "Escape"], description: "Close any open modal" },
            { keys: ["Escape"], description: "Cancel current action" },
        ]
    },
    {
        category: "Diagram Editing",
        items: [
            { keys: ["Ctrl/⌘", "Z"], description: "Undo last change" },
            { keys: ["Ctrl/⌘", "Shift", "Z"], description: "Redo change" },
            { keys: ["Ctrl/⌘", "Y"], description: "Redo change (alternative)" },
        ]
    },
    {
        category: "Zoom & View",
        items: [
            { keys: ["Ctrl/⌘", "+"], description: "Zoom in" },
            { keys: ["Ctrl/⌘", "-"], description: "Zoom out" },
            { keys: ["Ctrl/⌘", "0"], description: "Reset zoom to 100%" },
            { keys: ["Ctrl/⌘", "F"], description: "Toggle fullscreen" },
            { keys: ["Scroll"], description: "Pan diagram (when zoomed)" },
            { keys: ["Ctrl", "Scroll"], description: "Zoom in/out" },
        ]
    },
    {
        category: "Chat",
        items: [
            { keys: ["Enter"], description: "Send message" },
            { keys: ["Shift", "Enter"], description: "New line in message" },
        ]
    },
];

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg glass-panel border-white/10 max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-primary" />
                        Keyboard Shortcuts
                    </DialogTitle>
                    <DialogDescription>
                        Master Diagflo with these keyboard shortcuts
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {shortcuts.map((section) => (
                        <div key={section.category}>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                {section.category}
                            </h3>
                            <div className="space-y-2">
                                {section.items.map((shortcut, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="text-sm text-foreground">{shortcut.description}</span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, j) => (
                                                <span key={j} className="flex items-center">
                                                    <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border min-w-[28px] text-center">
                                                        {key}
                                                    </kbd>
                                                    {j < shortcut.keys.length - 1 && (
                                                        <span className="text-muted-foreground mx-0.5">+</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Pro tip:</strong> Use <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">Ctrl/⌘</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">?</kbd> to open this panel anytime
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
