import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppSettings, MermaidTheme } from "@/types/diagflo";
import { ExternalLink } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function SettingsModal({ open, onOpenChange, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-panel border-white/10">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">Settings</DialogTitle>
          <DialogDescription>
            Configure your Diagflo experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4 pt-2 border-t border-white/5">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="font-semibold text-primary">
                Gemini API Key (saved locally)
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key..."
                value={localSettings.geminiApiKey || ""}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, geminiApiKey: e.target.value })
                }
                className="bg-background/50 border-white/5 focus:border-primary/50"
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Get your key from{" "}
                <a
                  href="https://aistudio.google.com/app/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  Google AI Studio
                  <ExternalLink className="w-2 h-2" />
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-white/5">
            {/* Theme */}
            <div className="space-y-2">
              <Label htmlFor="theme">Diagram Appearance</Label>
              <Select
                value={localSettings.theme}
                onValueChange={(value: MermaidTheme) =>
                  setLocalSettings({ ...localSettings, theme: value })
                }
              >
                <SelectTrigger id="theme" className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Modern Default</SelectItem>
                  <SelectItem value="forest">Natural Forest</SelectItem>
                  <SelectItem value="dark">Pure Dark</SelectItem>
                  <SelectItem value="neutral">Classic Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Save */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">History Auto-Save</Label>
                <p className="text-[11px] text-muted-foreground">
                  Keep a history of all generated versions
                </p>
              </div>
              <Switch
                checked={localSettings.autoSave}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, autoSave: checked })
                }
              />
            </div>

            {/* Animations */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Interface Animations</Label>
                <p className="text-[11px] text-muted-foreground">
                  Enable smooth UX transitions
                </p>
              </div>
              <Switch
                checked={localSettings.animations}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, animations: checked })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="hover-glow">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
