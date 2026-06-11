import { useState, useRef, KeyboardEvent, ClipboardEvent, ChangeEvent, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Sparkles, X, Upload } from "lucide-react";
import { Attachment } from "@/types/diagflo";
import { useToast } from "@/hooks/use-toast";
import { GEMINI_SUPPORTS_IMAGE_INPUT } from "@/lib/gemini";

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  onShowExamples: () => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onShowExamples,
  onOpenSettings,
  hasApiKey,
  disabled,
  placeholder = "Describe your system architecture...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSend = () => {
    if (disabled) {
      return;
    }

    const message = input.trim();
    if (!message && attachments.length === 0) {
      return;
    }

    onSend(message, attachments);
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!GEMINI_SUPPORTS_IMAGE_INPUT) {
      return;
    }

    const items = e.clipboardData?.items;
    if (!items) {
      return;
    }

    const files: File[] = [];
    Array.from(items).forEach((item) => {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    });

    if (files.length > 0) {
      e.preventDefault();
      processFiles(files, "clipboard");
    }
  };

  const processFiles = (files: File[] | FileList, source: "upload" | "clipboard") => {
    if (!GEMINI_SUPPORTS_IMAGE_INPUT) {
      toast({
        title: "Image attachments unavailable",
        description: "The configured Gemini model does not support image inputs.",
        variant: "destructive",
      });
      return;
    }

    const ALLOWED_TYPES = ["image/png", "image/jpeg"];
    const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB per image

    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Unsupported file type",
          description: "Only PNG and JPG images are allowed.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        toast({
          title: "File too large",
          description: "Images must be smaller than 8MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        if (!base64) {
          toast({
            title: "Failed to read file",
            description: "Could not process the selected image.",
            variant: "destructive",
          });
          return;
        }

        const newAttachment: Attachment = {
          id: crypto.randomUUID(),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          dataUrl: result,
          base64,
          source,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.onerror = () => {
        toast({
          title: "File error",
          description: "Failed to read the selected image.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    if (!GEMINI_SUPPORTS_IMAGE_INPUT) {
      toast({
        title: "Update your model",
        description: "Switch to a Gemini Flash or Vision model to attach images.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const { files } = event.target;
    if (!files || files.length === 0) {
      return;
    }
    processFiles(files, "upload");
    // reset input so same file re-select possible
    event.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  // Drag and Drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (GEMINI_SUPPORTS_IMAGE_INPUT && !disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!GEMINI_SUPPORTS_IMAGE_INPUT) {
      toast({
        title: "Image attachments unavailable",
        description: "Current Gemini model does not accept images.",
        variant: "destructive",
      });
      return;
    }

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      // Filter for image files only
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (imageFiles.length > 0) {
        processFiles(imageFiles, "upload");
      } else {
        toast({
          title: "No images found",
          description: "Please drop PNG or JPG images.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div
      className={`glass-panel p-2 sm:p-4 space-y-1.5 sm:space-y-4 relative transition-all duration-300 rounded-2xl sm:rounded-3xl ${isDragOver ? "ring-2 ring-primary/50 shadow-2xl shadow-primary/10" : "shadow-lg"
        } focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/5 premium-blur rounded-3xl z-10 flex items-center justify-center pointer-events-none ring-2 ring-primary/30">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="w-8 h-8 animate-bounce opacity-80" />
            <span className="text-sm font-bold tracking-tight">Drop images here</span>
          </div>
        </div>
      )}

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className="block min-h-[40px] sm:min-h-[90px] max-h-[20vh] bg-transparent border-none focus-visible:ring-0 resize-none overflow-y-auto p-0 text-[13px] sm:text-[15px] leading-relaxed placeholder:text-muted-foreground/40"
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-white/5">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/20"
            >
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="h-20 w-20 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="absolute top-1 right-1 rounded-full bg-black/60 backdrop-blur-md p-1.5 text-white opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100"
                aria-label={`Remove ${attachment.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            multiple
            onChange={handleFilePick}
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 sm:h-9 px-3 rounded-full hover:bg-white/5 transition-colors"
            onClick={() => {
              if (!GEMINI_SUPPORTS_IMAGE_INPUT) {
                toast({
                  title: "Image attachments unavailable",
                  description: "Current Gemini model does not accept images.",
                  variant: "destructive",
                });
                return;
              }
              fileInputRef.current?.click();
            }}
            aria-label="Attach image"
          >
            <Paperclip className="w-4 h-4 mr-2 opacity-60" />
            <span className="text-xs font-semibold">Attach</span>
          </Button>

          <Button
            onClick={() => {
              if (hasApiKey) {
                onShowExamples();
              } else {
                onOpenSettings();
              }
            }}
            variant="ghost"
            size="sm"
            className="h-8 sm:h-9 px-3 rounded-full hover:bg-white/5 transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2 opacity-60 text-primary" />
            <span className="text-xs font-semibold">{hasApiKey ? "Examples" : "API Key"}</span>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-muted-foreground/60 tracking-tight">
              ⌘
            </kbd>
            <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
              Enter to send
            </span>
          </div>

          <Button
            onClick={handleSend}
            disabled={(input.trim().length === 0 && attachments.length === 0) || disabled}
            className="h-8 sm:h-9 px-4 sm:px-5 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5 mr-2" />
            <span className="text-xs font-bold uppercase tracking-wider">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
