import { describe, it, expect, beforeEach, vi } from "vitest";
import { storage } from "../storage";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("storage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("chatHistory", () => {
    it("returns empty array when no history exists", () => {
      expect(storage.getChatHistory()).toEqual([]);
    });

    it("saves and retrieves chat history", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Hello", timestamp: Date.now() },
      ];
      storage.saveChatHistory(messages as never[]);
      const retrieved = storage.getChatHistory();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].content).toBe("Hello");
    });
  });

  describe("diagramHistory", () => {
    it("returns empty array when no history exists", () => {
      expect(storage.getDiagramHistory()).toEqual([]);
    });

    it("saves and retrieves diagram history", () => {
      const history = [
        { code: "flowchart TD\n  A-->B", timestamp: Date.now(), prompt: "test" },
      ];
      storage.saveDiagramHistory(history as never[]);
      expect(storage.getDiagramHistory()).toHaveLength(1);
    });
  });

  describe("settings", () => {
    it("returns default settings when none saved", () => {
      const settings = storage.getSettings();
      expect(settings.autoSave).toBe(true);
      expect(settings.animations).toBe(true);
    });

    it("saves and retrieves settings", () => {
      const settings = {
        theme: "dark" as const,
        autoSave: false,
        animations: false,
        helpPanelDismissed: true,
      };
      storage.saveSettings(settings as never);
      const retrieved = storage.getSettings();
      expect(retrieved.autoSave).toBe(false);
    });
  });

  describe("apiKey", () => {
    it("returns null when no key saved", () => {
      expect(storage.getApiKey()).toBeNull();
    });

    it("saves and retrieves API key", () => {
      storage.saveApiKey("test-key-123");
      expect(storage.getApiKey()).toBe("test-key-123");
    });

    it("removes key when called with undefined", () => {
      storage.saveApiKey("test-key");
      storage.saveApiKey(undefined);
      expect(storage.getApiKey()).toBeNull();
    });
  });

  describe("currentDiagram", () => {
    it("returns empty string when no diagram saved", () => {
      expect(storage.getCurrentDiagram()).toBe("");
    });

    it("saves and retrieves current diagram", () => {
      storage.saveCurrentDiagram("flowchart TD\n  A-->B");
      expect(storage.getCurrentDiagram()).toBe("flowchart TD\n  A-->B");
    });
  });

  describe("historyIndex", () => {
    it("returns -1 when no index saved", () => {
      expect(storage.getHistoryIndex()).toBe(-1);
    });

    it("saves and retrieves history index", () => {
      storage.saveHistoryIndex(5);
      expect(storage.getHistoryIndex()).toBe(5);
    });
  });
});
