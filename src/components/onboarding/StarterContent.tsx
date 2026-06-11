
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";

interface StarterPromptsProps {
    onSelect: (prompt: string) => void;
}

export const StarterPrompts: React.FC<StarterPromptsProps> = ({ onSelect }) => {
    const prompts = [
        {
            icon: "🔐",
            text: "User auth flow",
            prompt: "Create a user authentication flow sequence diagram including login, MFA, and error handling."
        },
        {
            icon: "🏗️",
            text: "Microservices",
            prompt: "Draw a system architecture for a scalable e-commerce app on AWS using microservices."
        },
        {
            icon: "🔄",
            text: "Git workflow",
            prompt: "Visualize a standard Git branching workflow with feature branches, develop, and master."
        },
        {
            icon: "📊",
            text: "Database Schema",
            prompt: "Design an ER diagram for a blog with users, posts, comments, and tags."
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm mx-auto mt-6 animate-slide-up" style={{ animationDelay: "150ms" }}>
            {prompts.map((p, i) => (
                <Button
                    key={i}
                    variant="outline"
                    className="h-auto py-3 px-4 justify-start text-left bg-white/5 border-white/5 hover:bg-white/10 hover:border-primary/20 transition-all group"
                    onClick={() => onSelect(p.prompt)}
                >
                    <span className="mr-3 text-lg opacity-80 group-hover:scale-110 transition-transform">{p.icon}</span>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {p.text}
                    </span>
                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </Button>
            ))}
        </div>
    );
};

export const QuickTips = () => (
    <div className="mt-8 pt-6 border-t border-white/5 max-w-sm mx-auto w-full animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-2 mb-3 px-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Pro Tips</span>
        </div>
        <ul className="space-y-2.5">
            <li className="flex gap-2.5 text-xs text-muted-foreground/80 hover:text-foreground transition-colors cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                <span>Mention specific colors: "Use <span className="text-primary">orange</span> for active states"</span>
            </li>
            <li className="flex gap-2.5 text-xs text-muted-foreground/80 hover:text-foreground transition-colors cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40 mt-1.5 shrink-0" />
                <span>Ask for standard shapes: "Use cylinders for databases"</span>
            </li>
            <li className="flex gap-2.5 text-xs text-muted-foreground/80 hover:text-foreground transition-colors cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/40 mt-1.5 shrink-0" />
                <span>Iterate: "Make the box bigger" or "Add a step"</span>
            </li>
        </ul>
    </div>
);
