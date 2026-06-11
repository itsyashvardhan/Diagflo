import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 animate-slide-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg glass-panel flex items-center justify-center">
        <Bot className="w-5 h-5 text-primary" />
      </div>

      <div className="glass-panel px-4 py-3 rounded-2xl">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
