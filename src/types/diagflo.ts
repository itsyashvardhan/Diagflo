export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  base64: string;
  source: "upload" | "clipboard";
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  attachments?: Attachment[];
  /** Message delivery status for queue visualization */
  status?: "sending" | "queued" | "sent" | "error";
  /** Retry attempt number (for queued messages) */
  retryAttempt?: number;
  /** Estimated wait time in seconds (for queued messages) */
  estimatedWaitSeconds?: number;
  /** User-friendly reason for queue/retry (e.g., "High demand, retrying...") */
  queueReason?: string;
}

export interface DiagramHistoryEntry {
  code: string;
  prompt: string;
  timestamp: number;
}

export interface AppSettings {
  geminiApiKey?: string;
  geminiModel: "gemini-2.5-flash-lite";
  theme: "default" | "forest" | "dark" | "neutral";
  autoSave: boolean;
  animations: boolean;
  helpPanelDismissed: boolean;
}

export interface DiagramResponse {
  explanation: string;
  code: string;
  suggestions: string[];
}

export interface RetryInfo {
  attempt: number;
  maxRetries: number;
  estimatedWaitSeconds: number;
  reason: string;
}

export type RetryCallback = (retryInfo: RetryInfo) => void;

export type MermaidTheme = "default" | "forest" | "dark" | "neutral";
