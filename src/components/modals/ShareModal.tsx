import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, Code, Twitter, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { createShareLink } from "@/lib/shareLinks";

interface ShareModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    diagramCode: string;
    diagramTitle?: string;
}

export function ShareModal({ open, onOpenChange, diagramCode, diagramTitle = "My Diagram" }: ShareModalProps) {
    const [copied, setCopied] = useState<string | null>(null);
    const [shareUrl, setShareUrl] = useState("");
    const [shareId, setShareId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Generate share link when modal opens
    useEffect(() => {
        const generateLink = async () => {
            if (open && diagramCode) {
                setIsLoading(true);
                try {
                    const { id, url } = await createShareLink(diagramCode, diagramTitle);
                    setShareId(id);
                    setShareUrl(url);
                } catch (error) {
                    logger.error("Failed to generate share link", error);
                    toast.error("Failed to generate share link. Check after some time.");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        generateLink();
    }, [open, diagramCode, diagramTitle]);

    // Generate embed code
    const embedCode = `<iframe src="${shareUrl}?embed=true" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;

    const handleCopy = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            toast.success(`${type} copied to clipboard!`);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };

    const socialShareText = `Check out my diagram: ${diagramTitle}`;
    const socialShareMessage = shareUrl ? `${socialShareText}\n${shareUrl}` : socialShareText;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg glass-panel border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-primary" />
                        Share Diagram
                    </DialogTitle>
                    <DialogDescription>
                        Share your diagram with others or embed it in your website
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Share Link */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Share Link</label>
                        <div className="flex gap-2">
                            <Input
                                value={isLoading ? "Generating link..." : shareUrl}
                                readOnly
                                className="bg-muted/50 text-sm font-mono"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleCopy(shareUrl, "Link")}
                                className="shrink-0"
                                disabled={isLoading || !shareUrl}
                            >
                                {copied === "Link" ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                        <div className="flex items-start gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-green-600 dark:text-green-400">
                                This link is now live!
                            </p>
                        </div>
                    </div>

                    {/* Short ID Display */}
                    <div className="flex items-center justify-center gap-2 py-2">
                        <span className="text-xs text-muted-foreground">Share ID:</span>
                        <code className="px-3 py-1 bg-muted rounded-md font-mono text-sm font-semibold tracking-wider">
                            {shareId}
                        </code>
                    </div>

                    {/* Embed Code */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Embed Code
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={embedCode}
                                readOnly
                                className="bg-muted/50 text-xs font-mono"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleCopy(embedCode, "Embed Code")}
                                className="shrink-0"
                            >
                                {copied === "Embed Code" ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Social Share */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Share on Social</label>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2"
                                disabled={!shareUrl || isLoading}
                                onClick={() => {
                                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(socialShareMessage)}`;
                                    window.open(url, "_blank", "noopener,noreferrer");
                                }}
                            >
                                <Twitter className="w-4 h-4" />
                                Twitter
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2"
                                disabled={!shareUrl || isLoading}
                                onClick={() => {
                                    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                                    window.open(url, "_blank", "noopener,noreferrer");
                                }}
                            >
                                <Linkedin className="w-4 h-4" />
                                LinkedIn
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            disabled={!shareUrl || isLoading}
                            onClick={() => handleCopy(socialShareMessage, "Share Message")}
                        >
                            {copied === "Share Message" ? "Copied share message" : "Copy share message (text + link)"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Social platforms render previews from URL metadata. Attaching a custom per-diagram image preview is not supported yet.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
