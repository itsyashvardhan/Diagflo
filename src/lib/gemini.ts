
import { logger } from "./logger";
import { Message, DiagramResponse, AppSettings, RetryCallback } from "@/types/diagflo";
import { sanitizeDiagram, detectDiagramType } from "./diagramSanitizer";

// Default system prompt for Gemini
const SYSTEM_PROMPT = `You are Diagflo, an AI assistant that explains and visualizes concepts using diagrams.

STEP 1 — CHOOSE A MODE

Read the user's message and pick one mode:

MODE 1: TEXT ONLY
When: The user asks a question that does not need a diagram.
Do: Reply in plain prose. No code block.

MODE 2: DIAGRAM ONLY
When: The user says "just the diagram", "no explanation", or "only the code".
Do: Output one fenced code block. Nothing else.

MODE 3: DIAGRAM + TEXT (use this mode by default)
When: Any other request.
Do:
1. Write the explanation first, before the code block.
2. If the user wants to learn ("explain", "teach", "elaborate", help me understand"): write at least 3 paragraphs that teach the topic clearly.
3. If the user wants a visual ("draw", "show", "generate", "visualize", "illustrate"): write 2-4 sentences describing what the diagram shows and how it is organized.
4. Then output one fenced code block with the diagram.
5. If the diagram could be improved or extended, add a bullet point at the end labeled "Suggestion:".

---

STEP 2 — PICK A DIAGRAM TYPE (for Mode 2 and 3)

Use these rules to choose the right diagram type:
- Steps or processes → Flowchart (Mermaid)
- System or API interactions → Sequence diagram (Mermaid)
- Data models or relationships → ER diagram (Mermaid)
- Timelines or schedules → Gantt chart (Mermaid)
- Numbers, comparisons, or trends → Chart.js
- Hierarchies or structures → Class or tree diagram (Mermaid)

---

STEP 3 — FORMAT THE CODE BLOCK

- Use \`\`\`mermaid for Mermaid diagrams.
- Use \`\`\`chartjs for Chart.js diagrams.
- Put only valid diagram syntax inside the code block.
- Do not put explanations, comments, or prose inside the code block.
- Never write diagram code outside of a fenced code block.
- Never repeat the code block.

---

RULES
- Never explain your reasoning or thinking process.
- Never repeat content you already wrote.
- Never mention which mode you are using.
- If the user shares diagram code, treat it as the current diagram.
- If the user asks to compare two diagrams but only one exists, ask for the missing one.
- Style instructions: Avoid generating saturated inline styles (like pink/yellow fills). Instead, use professional, low-saturation dark-mode-native colors (e.g., muted slate, dark teal, charcoal) or standard class definitions to ensure contrast.
`;

// Custom error for rate limiting
class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

// Helper: sleep for ms
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: enforce a minimum interval between requests (debounce)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 500;
async function enforceRequestInterval() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestTime = Date.now();
}

// Helper: parse Retry-After header (seconds or date)
function parseRetryAfter(header: string | null): number {
  if (!header) return 2000; // Default 2s
  const seconds = Number(header);
  if (!isNaN(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  if (!isNaN(date)) return Math.max(date - Date.now(), 1000);
  return 2000;
}

const RATE_LIMIT_CONFIG = {
  maxRetries: 3,              // Maximum number of retry attempts
  baseDelayMs: 1000,          // Initial delay before first retry (1 second)
  maxDelayMs: 32000,          // Maximum delay cap (32 seconds)
};

// Helper: exponential backoff delay
function calculateBackoffDelay(attempt: number): number {
  const delay = RATE_LIMIT_CONFIG.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, RATE_LIMIT_CONFIG.maxDelayMs);
}

// Helper: extract error message from Gemini API error body
function extractErrorMessage(errorBody: any): string {
  if (!errorBody) return "Unknown error";
  if (typeof errorBody === "string") return errorBody;
  if (errorBody.error && errorBody.error.message) return errorBody.error.message;
  if (errorBody.message) return errorBody.message;
  return JSON.stringify(errorBody);
}

export const GEMINI_SUPPORTS_IMAGE_INPUT = true;

type GeminiPart =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

export async function generateDiagram(
  apiKey: string,
  model: AppSettings["geminiModel"],
  userPrompt: string,
  currentDiagram: string,
  chatHistory: Message[],
  onRetry?: RetryCallback
): Promise<DiagramResponse> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Enforce minimum request interval to prevent rapid-fire requests
  await enforceRequestInterval();

  const trimmedHistory = chatHistory.slice(-10);

  const contents: GeminiContent[] = trimmedHistory
    .map((message, index) => {
      const parts: GeminiPart[] = [];
      const isLatest = index === trimmedHistory.length - 1;
      const cleanedContent = message.content?.trim();

      if (cleanedContent) {
        let textContent = cleanedContent;
        if (message.role === "user" && isLatest && currentDiagram) {
          textContent = `Current diagram context (Mermaid v11.12.0):\n\`\`\`mermaid\n${currentDiagram}\n\`\`\`\n\nUser request:\n${cleanedContent}`;
        }
        parts.push({ text: textContent });
      } else if (message.role === "user" && isLatest && currentDiagram) {
        parts.push({
          text: `Current diagram context (Mermaid v11.12.0):\n\`\`\`mermaid\n${currentDiagram}\n\`\`\``,
        });
      }

      if (GEMINI_SUPPORTS_IMAGE_INPUT && message.attachments) {
        message.attachments.forEach((attachment) => {
          if (attachment.base64) {
            parts.push({
              inlineData: {
                data: attachment.base64,
                mimeType: attachment.mimeType,
              },
            });
            parts.push({
              text: `The user provided an image attachment (${attachment.name}). Extract any architectural or workflow insights relevant to the request from this image.`,
            });
          }
        });
      }

      if (
        message.role === "user" &&
        isLatest &&
        (!cleanedContent || cleanedContent.length === 0) &&
        GEMINI_SUPPORTS_IMAGE_INPUT &&
        message.attachments &&
        message.attachments.length > 0
      ) {
        parts.push({
          text: "Analyze the attached image(s) and generate or update the diagram accordingly.",
        });
      }

      if (parts.length === 0) {
        return null;
      }

      return {
        role: message.role === "assistant" ? "model" : "user",
        parts,
      } satisfies GeminiContent;
    })
    .filter((entry): entry is GeminiContent => entry !== null);

  if (contents.length === 0) {
    const fallbackParts: GeminiPart[] = [];
    if (currentDiagram) {
      fallbackParts.push({
        text: `Current diagram context (Mermaid v11.12.0):\n\`\`\`mermaid\n${currentDiagram}\n\`\`\``,
      });
    }
    const sanitizedPrompt = userPrompt.trim().length > 0 ? userPrompt.trim() : "Analyze the provided image(s) and generate the appropriate Mermaid diagram.";
    fallbackParts.push({ text: sanitizedPrompt });
    contents.push({ role: "user", parts: fallbackParts });
  }

  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 4096,
    },
  });

  // Retry loop with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RATE_LIMIT_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(`${apiURL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("Retry-After");
        const retryAfterMs = parseRetryAfter(retryAfterHeader);

        // If we have retries left, wait and retry
        if (attempt < RATE_LIMIT_CONFIG.maxRetries) {
          const backoffDelay = Math.max(retryAfterMs, calculateBackoffDelay(attempt));
          const estimatedWaitSeconds = Math.ceil(backoffDelay / 1000);

          // Notify the UI about the retry
          onRetry?.({
            attempt: attempt + 1,
            maxRetries: RATE_LIMIT_CONFIG.maxRetries,
            estimatedWaitSeconds,
            reason: "High demand, retrying...",
          });

          logger.warn(
            `Rate limited (429). Attempt ${attempt + 1}/${RATE_LIMIT_CONFIG.maxRetries + 1}. ` +
            `Retrying in ${estimatedWaitSeconds}s...`
          );
          await sleep(backoffDelay);
          continue;
        }

        // All retries exhausted
        const errorBody = await response.json().catch(() => ({}));
        throw new RateLimitError(
          `Rate limit exceeded. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds before trying again. ` +
          `Consider upgrading to a paid API tier for higher limits.`,
          retryAfterMs
        );
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = extractErrorMessage(errorBody);

        // For 5xx errors, retry with backoff
        if (response.status >= 500 && attempt < RATE_LIMIT_CONFIG.maxRetries) {
          const backoffDelay = calculateBackoffDelay(attempt);
          const estimatedWaitSeconds = Math.ceil(backoffDelay / 1000);

          onRetry?.({
            attempt: attempt + 1,
            maxRetries: RATE_LIMIT_CONFIG.maxRetries,
            estimatedWaitSeconds,
            reason: "Server busy, retrying...",
          });

          logger.warn(
            `Server error (${response.status}). Attempt ${attempt + 1}/${RATE_LIMIT_CONFIG.maxRetries + 1}. ` +
            `Retrying in ${estimatedWaitSeconds}s...`
          );
          await sleep(backoffDelay);
          continue;
        }

        throw new Error(errorMessage);
      }

      // Success! Parse and return the response
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No response from Gemini API");
      }

      return parseDiagramResponse(text);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry for non-retryable errors
      if (error instanceof RateLimitError ||
        (error instanceof Error && !error.message.includes("fetch"))) {
        throw error;
      }

      // Network errors: retry with backoff
      if (attempt < RATE_LIMIT_CONFIG.maxRetries) {
        const backoffDelay = calculateBackoffDelay(attempt);
        const estimatedWaitSeconds = Math.ceil(backoffDelay / 1000);

        onRetry?.({
          attempt: attempt + 1,
          maxRetries: RATE_LIMIT_CONFIG.maxRetries,
          estimatedWaitSeconds,
          reason: "Connection issue, retrying...",
        });

        logger.warn(
          `[Gemini API] Network error. Attempt ${attempt + 1}/${RATE_LIMIT_CONFIG.maxRetries + 1}. ` +
          `Retrying in ${estimatedWaitSeconds}s...`
        );
        await sleep(backoffDelay);
        continue;
      }
    }
  }

  // All retries exhausted
  throw lastError || new Error("Failed to generate diagram after multiple attempts");
}

// --- Streaming variant ---
// Builds the same request body but uses streamGenerateContent and yields text deltas.
export async function generateDiagramStream(
  apiKey: string,
  model: AppSettings["geminiModel"],
  userPrompt: string,
  currentDiagram: string,
  chatHistory: Message[],
  onChunk: (textDelta: string, accumulatedText: string) => void,
  onRetry?: RetryCallback
): Promise<DiagramResponse> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent`;

  await enforceRequestInterval();

  // Build contents array (same logic as generateDiagram)
  const trimmedHistory = chatHistory.slice(-10);
  const contents: GeminiContent[] = trimmedHistory
    .map((message, index) => {
      const parts: GeminiPart[] = [];
      const isLatest = index === trimmedHistory.length - 1;
      const cleanedContent = message.content?.trim();

      if (cleanedContent) {
        let textContent = cleanedContent;
        if (message.role === "user" && isLatest && currentDiagram) {
          textContent = `Current diagram context (Mermaid v11.12.0):\n\`\`\`mermaid\n${currentDiagram}\n\`\`\`\n\nUser request:\n${cleanedContent}`;
        }
        parts.push({ text: textContent });
      } else if (message.role === "user" && isLatest && currentDiagram) {
        parts.push({
          text: `Current diagram context (Mermaid v11.12.0):\n\`\`\`mermaid\n${currentDiagram}\n\`\`\``,
        });
      }

      if (GEMINI_SUPPORTS_IMAGE_INPUT && message.attachments) {
        message.attachments.forEach((attachment) => {
          if (attachment.base64) {
            parts.push({
              inlineData: {
                data: attachment.base64,
                mimeType: attachment.mimeType,
              },
            });
            parts.push({
              text: `The user provided an image attachment (${attachment.name}). Extract any architectural or workflow insights relevant to the request from this image.`,
            });
          }
        });
      }

      if (
        message.role === "user" &&
        isLatest &&
        (!cleanedContent || cleanedContent.length === 0) &&
        GEMINI_SUPPORTS_IMAGE_INPUT &&
        message.attachments &&
        message.attachments.length > 0
      ) {
        parts.push({
          text: "Analyze the attached image(s) and generate or update the diagram accordingly.",
        });
      }

      if (parts.length === 0) return null;

      return {
        role: message.role === "assistant" ? "model" : "user",
        parts,
      } satisfies GeminiContent;
    })
    .filter((entry): entry is GeminiContent => entry !== null);

  if (contents.length === 0) {
    const fallbackParts: GeminiPart[] = [];
    if (currentDiagram) {
      fallbackParts.push({
        text: `Current diagram context (Mermaid v11.12.0):\n\`\`\`mermaid\n${currentDiagram}\n\`\`\``,
      });
    }
    const sanitizedPrompt = userPrompt.trim().length > 0 ? userPrompt.trim() : "Analyze the provided image(s) and generate the appropriate Mermaid diagram.";
    fallbackParts.push({ text: sanitizedPrompt });
    contents.push({ role: "user", parts: fallbackParts });
  }

  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 4096,
    },
  });

  // Retry loop
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RATE_LIMIT_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(`${apiURL}?key=${apiKey}&alt=sse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("Retry-After");
        const retryAfterMs = parseRetryAfter(retryAfterHeader);
        if (attempt < RATE_LIMIT_CONFIG.maxRetries) {
          const backoffDelay = Math.max(retryAfterMs, calculateBackoffDelay(attempt));
          onRetry?.({
            attempt: attempt + 1,
            maxRetries: RATE_LIMIT_CONFIG.maxRetries,
            estimatedWaitSeconds: Math.ceil(backoffDelay / 1000),
            reason: "High demand, retrying...",
          });
          await sleep(backoffDelay);
          continue;
        }
        throw new RateLimitError(
          `Rate limit exceeded. Please wait before trying again.`,
          retryAfterMs
        );
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = extractErrorMessage(errorBody);
        if (response.status >= 500 && attempt < RATE_LIMIT_CONFIG.maxRetries) {
          const backoffDelay = calculateBackoffDelay(attempt);
          onRetry?.({
            attempt: attempt + 1,
            maxRetries: RATE_LIMIT_CONFIG.maxRetries,
            estimatedWaitSeconds: Math.ceil(backoffDelay / 1000),
            reason: "Server busy, retrying...",
          });
          await sleep(backoffDelay);
          continue;
        }
        throw new Error(errorMessage);
      }

      // Process the SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body for streaming");

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE events line by line
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6); // Remove "data: " prefix
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const textDelta = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textDelta) {
              accumulated += textDelta;
              onChunk(textDelta, accumulated);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      if (!accumulated) {
        throw new Error("No response from Gemini API stream");
      }

      return parseDiagramResponse(accumulated);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof RateLimitError ||
        (error instanceof Error && !error.message.includes("fetch"))) {
        throw error;
      }

      if (attempt < RATE_LIMIT_CONFIG.maxRetries) {
        const backoffDelay = calculateBackoffDelay(attempt);
        onRetry?.({
          attempt: attempt + 1,
          maxRetries: RATE_LIMIT_CONFIG.maxRetries,
          estimatedWaitSeconds: Math.ceil(backoffDelay / 1000),
          reason: "Connection issue, retrying...",
        });
        await sleep(backoffDelay);
        continue;
      }
    }
  }

  throw lastError || new Error("Failed to generate diagram after multiple attempts");
}

export function parseDiagramResponse(text: string): DiagramResponse {
  const sections = {
    explanation: "",
    code: "",
    suggestions: [] as string[],
  };

  // Extract mermaid code block
  const mermaidMatch = text.match(/```mermaid\s*([\s\S]*?)```/i);
  if (mermaidMatch) {
    sections.code = mermaidMatch[1].trim();
  }

  // Extract Chart.js code block (if mermaid not found)
  if (!sections.code) {
    const chartjsMatch = text.match(/```chartjs\s*([\s\S]*?)```/i);
    if (chartjsMatch) {
      sections.code = `chartjs\n${chartjsMatch[1].trim()}`;
    }
  }

  // Self-healing extraction for plain-text Mermaid (no code fence)
  if (!sections.code) {
    const lineStartKeywords = [
      "flowchart", "graph", "sequenceDiagram", "classDiagram", "stateDiagram", "stateDiagram-v2",
      "erDiagram", "gantt", "pie", "gitGraph", "mindmap", "timeline", "quadrantChart",
      "requirementDiagram", "C4Context", "C4Container", "C4Component", "C4Dynamic", "C4Deployment",
      "journey", "xychart-beta", "sankey-beta", "block-beta", "packet-beta", "architecture-beta", "kanban",
    ];
    const escaped = lineStartKeywords.map((k) => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
    const startRegex = new RegExp(`(^|\\n)\\s*(${escaped.join("|")})\\b`, "i");
    const start = text.search(startRegex);
    if (start >= 0) {
      const candidate = text.slice(start).trim()
        .replace(/^```[\w-]*\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      sections.code = candidate;
    }
  }

  // Normalize Mermaid output for all supported diagram formats
  if (sections.code) {
    const detected = detectDiagramType(sections.code);
    if (detected && detected !== "chartjs") {
      sections.code = sanitizeDiagram(sections.code).code;
    }
  }

  // Improved explanation extraction for Mode 3:
  // If a code block exists, treat all text before the first code block as explanation
  if (sections.code) {
    const codeBlockRegex = /```(?:mermaid|chartjs)[\s\S]*?```/i;
    const codeBlockIndex = text.search(codeBlockRegex);
    if (codeBlockIndex > 0) {
      sections.explanation = text.slice(0, codeBlockIndex).trim();
    }
  }

  // Handle conversational responses (no diagram structure)
  if (!sections.explanation && !sections.code) {
    sections.explanation = text.trim();
  }

  // Extract enhancement suggestions
  const suggestionsMatch = text.match(/Suggestions:\s*([\s\S]*?)$/i);
  if (suggestionsMatch) {
    const suggestionText = suggestionsMatch[1].trim();
    sections.suggestions = suggestionText
      .split("\n")
      .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("*"))
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  return sections;
}
