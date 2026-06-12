import { Message, DiagramHistoryEntry, AppSettings } from "@/types/diagflo";

const STORAGE_KEYS = {
  CHAT_HISTORY: "diagflo_chat_history",
  DIAGRAM_HISTORY: "diagflo_diagram_history",
  SETTINGS: "diagflo_settings",
  API_KEY: "diagflo_api_key",
  CURRENT_DIAGRAM: "diagflo_current_diagram",
  HISTORY_INDEX: "diagflo_history_index",
} as const;

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures (private mode, quota, or policy restrictions)
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage removal failures
  }
}

function safeJsonParse<T>(data: string | null, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  // Chat History
  getChatHistory: (): Message[] => {
    return safeJsonParse<Message[]>(safeGetItem(STORAGE_KEYS.CHAT_HISTORY), []);
  },

  saveChatHistory: (messages: Message[]) => {
    safeSetItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
  },

  // Diagram History
  getDiagramHistory: (): DiagramHistoryEntry[] => {
    return safeJsonParse<DiagramHistoryEntry[]>(safeGetItem(STORAGE_KEYS.DIAGRAM_HISTORY), []);
  },

  saveDiagramHistory: (history: DiagramHistoryEntry[]) => {
    safeSetItem(STORAGE_KEYS.DIAGRAM_HISTORY, JSON.stringify(history));
  },

  // Settings
  getSettings: (): AppSettings => {
    const defaults: AppSettings = {
      geminiModel: "gemini-2.5-flash-lite",
      theme: "default",
      autoSave: true,
      animations: true,
      helpPanelDismissed: false,
    };

    const parsed = safeJsonParse<Partial<AppSettings>>(safeGetItem(STORAGE_KEYS.SETTINGS), defaults);
    return {
      ...defaults,
      ...parsed,
    };
  },

  saveSettings: (settings: AppSettings) => {
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // API Key (stored separately for convenience and explicit control)
  getApiKey: (): string | null => {
    return safeGetItem(STORAGE_KEYS.API_KEY);
  },

  saveApiKey: (key?: string) => {
    if (!key) {
      safeRemoveItem(STORAGE_KEYS.API_KEY);
    } else {
      safeSetItem(STORAGE_KEYS.API_KEY, key);
    }
  },

  // Current Diagram
  getCurrentDiagram: (): string => {
    return safeGetItem(STORAGE_KEYS.CURRENT_DIAGRAM) || "";
  },

  saveCurrentDiagram: (code: string) => {
    safeSetItem(STORAGE_KEYS.CURRENT_DIAGRAM, code);
  },

  // History Index
  getHistoryIndex: (): number => {
    const data = safeGetItem(STORAGE_KEYS.HISTORY_INDEX);
    return data ? parseInt(data, 10) : -1;
  },

  saveHistoryIndex: (index: number) => {
    safeSetItem(STORAGE_KEYS.HISTORY_INDEX, index.toString());
  },

  // Clear all
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      safeRemoveItem(key);
    });
  },
};
