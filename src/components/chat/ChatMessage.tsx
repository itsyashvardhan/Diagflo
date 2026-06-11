import { memo, useState } from "react";
import { Message } from "@/types/diagflo";
import { Clock, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { logger } from "@/lib/logger";

interface ChatMessageProps {
  message: Message;
}

// Status badge component for queue visualization
function MessageStatusBadge({ status, retryAttempt, estimatedWaitSeconds, queueReason }: {
  status?: Message["status"];
  retryAttempt?: number;
  estimatedWaitSeconds?: number;
  queueReason?: string;
}) {
  if (!status || status === "sent") return null;

  const statusConfig = {
    sending: {
      icon: Loader2,
      text: "Sending...",
      className: "text-blue-400",
      iconClassName: "animate-spin",
    },
    queued: {
      icon: Clock,
      text: queueReason || (retryAttempt ? `Retrying (${retryAttempt}/3)...` : "Queued"),
      className: "text-amber-400",
      iconClassName: "animate-pulse",
    },
    error: {
      icon: AlertCircle,
      text: "Failed",
      className: "text-red-400",
      iconClassName: "",
    },
  };

  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 text-xs mt-2 ${config.className}`}>
      <Icon className={`w-3 h-3 ${config.iconClassName}`} />
      <span className="font-medium">{config.text}</span>
      {status === "queued" && estimatedWaitSeconds && estimatedWaitSeconds > 0 && (
        <span className="text-muted-foreground/70">
          (~{estimatedWaitSeconds}s)
        </span>
      )}
    </div>
  );
}

// Copy button component - ChatGPT style
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error("Failed to copy", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="
        flex items-center gap-1.5
        text-[11px] text-muted-foreground/60
        hover:text-muted-foreground
        transition-colors duration-150
        mt-1.5 py-0.5 px-1 -ml-1
        rounded hover:bg-white/[0.05]
      "
      title={copied ? "Copied!" : "Copy message"}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-400" />
          <span className="text-green-400 font-medium">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

// Jony Ive-inspired ChatMessage: minimal, clean, purposeful
export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasContent = Boolean(message.content && message.content.trim().length > 0);
  const isQueued = message.status === "queued" || message.status === "sending";

  return (
    <div
      className={`flex gap-2 sm:gap-4 mb-3 sm:mb-6 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[90%] sm:max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {hasContent && (
          isUser ? (
            <div
              className={`
                px-3 py-2 sm:px-4 sm:py-3 rounded-2xl
                transition-all duration-200
                bg-[#3478F6] text-white rounded-br-md shadow-sm
                ${isQueued ? "opacity-70" : ""}
              `}
            >
              <p className="text-[13px] sm:text-[15px] leading-relaxed whitespace-pre-wrap font-normal">
                {message.content}
              </p>
            </div>
          ) : (
            <div className={`py-1 ${isQueued ? "opacity-70" : ""}`}>
              <div className="prose prose-sm prose-invert max-w-none 
                  prose-p:my-1.5 prose-p:leading-relaxed
                  prose-ul:my-2 prose-ol:my-2 
                  prose-li:my-0.5 
                  prose-headings:my-3 prose-headings:font-semibold
                  prose-strong:text-white prose-strong:font-semibold
                  prose-code:text-blue-300 prose-code:bg-white/[0.06] 
                  prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-normal
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                  text-[13px] sm:text-[15px]"
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          )
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div
            className={`mt-2 flex flex-wrap gap-2 ${isUser ? "justify-end" : "justify-start"}`}
          >
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={`
                  overflow-hidden rounded-xl 
                  border border-white/[0.08] 
                  shadow-sm
                  ${isQueued ? "opacity-70" : ""}
                `}
              >
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="h-24 w-24 object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Action buttons row - Copy for all messages */}
        {hasContent && !isQueued && (
          <div className={`flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
            <CopyButton text={message.content || ""} />

            {/* Status indicator for user messages */}
            {isUser && (
              <MessageStatusBadge
                status={message.status}
                retryAttempt={message.retryAttempt}
                estimatedWaitSeconds={message.estimatedWaitSeconds}
                queueReason={message.queueReason}
              />
            )}
          </div>
        )}

        {/* Status indicator when queued (no copy button during queue) */}
        {isUser && isQueued && (
          <MessageStatusBadge
            status={message.status}
            retryAttempt={message.retryAttempt}
            estimatedWaitSeconds={message.estimatedWaitSeconds}
            queueReason={message.queueReason}
          />
        )}

        {/* Timestamp - subtle, Ive-style */}
        {message.timestamp && message.status !== "queued" && message.status !== "sending" && (
          <p className="text-[11px] text-muted-foreground/50 mt-1 font-medium tracking-wide">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.role === nextProps.message.role &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.message.attachments === nextProps.message.attachments &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.retryAttempt === nextProps.message.retryAttempt &&
    prevProps.message.estimatedWaitSeconds === nextProps.message.estimatedWaitSeconds &&
    prevProps.message.queueReason === nextProps.message.queueReason
  );
});
