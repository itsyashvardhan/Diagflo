import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BugIcon, Github } from "lucide-react";

interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditsModal({ open, onOpenChange }: CreditsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] glass-panel border-white/10">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">Credits</DialogTitle>
          <DialogDescription>About the Developer and Diagflo</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Yashvardhan Singh</h3>
              <p className="text-sm text-muted-foreground">Creator & maintainer</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Diagflo was built by @itsyashvardhan. <br />
            Find more projects and contributions on GitHub.
          </p>

          <div className="pt-2">
            <a
              href="https://github.com/itsyashvardhan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-95"
            >
              <Github className="w-4 h-4" />
              View GitHub
            </a>
            <span className="mx-2" />
            <a
              href="https://github.com/itsyashvardhan/diagflo/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-95"
            >
              <BugIcon className="w-4 h-4" />
              Report Bug
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
