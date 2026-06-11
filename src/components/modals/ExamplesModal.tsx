import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Example {
  title: string;
  prompt: string;
  category: string;
}

interface ExamplesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExample: (prompt: string) => void;
}

const examples: Example[] = [
  {
    title: "Microservices Architecture",
    prompt: "Create a microservices architecture diagram for an e-commerce platform with user service, product service, order service, and payment gateway. Include API gateway and message queue.",
    category: "Architecture",
  },
  {
    title: "User Authentication Flow",
    prompt: "Design a flowchart showing user authentication process including login, OAuth, JWT token generation, and session management.",
    category: "Flowchart",
  },
  {
    title: "Data Pipeline",
    prompt: "Create a data pipeline diagram showing data ingestion from multiple sources, ETL processing, data warehouse storage, and BI dashboards.",
    category: "Data",
  },
  {
    title: "CI/CD Pipeline",
    prompt: "Design a CI/CD pipeline diagram with GitHub, automated testing, Docker containerization, Kubernetes deployment, and monitoring.",
    category: "DevOps",
  },
  {
    title: "Database Schema",
    prompt: "Create an ER diagram for a blog platform with users, posts, comments, categories, and tags tables showing relationships.",
    category: "Database",
  },
  {
    title: "API Architecture",
    prompt: "Design a RESTful API architecture with load balancer, API gateway, multiple backend services, caching layer, and database cluster.",
    category: "Architecture",
  },
];

export function ExamplesModal({ open, onOpenChange, onSelectExample }: ExamplesModalProps) {
  const handleSelect = (prompt: string) => {
    onSelectExample(prompt);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] glass-panel border-white/10 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">Example Prompts</DialogTitle>
          <DialogDescription>
            Get started quickly with these curated examples
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4 overflow-y-auto">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleSelect(example.prompt)}
              className="glass-panel p-4 text-left hover-glow transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                      {example.title}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {example.prompt}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
                  {example.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
