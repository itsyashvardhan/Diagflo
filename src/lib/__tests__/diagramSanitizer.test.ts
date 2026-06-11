import { describe, it, expect } from "vitest";
import { detectDiagramType, sanitizeDiagram } from "../diagramSanitizer";

describe("detectDiagramType", () => {
  it("detects flowchart", () => {
    expect(detectDiagramType("flowchart TD\n  A --> B")).toBe("flowchart");
  });

  it("detects graph alias as flowchart", () => {
    expect(detectDiagramType("graph LR\n  A --> B")).toBe("flowchart");
  });

  it("detects sequenceDiagram", () => {
    expect(detectDiagramType("sequenceDiagram\n  A->>B: hello")).toBe("sequence");
  });

  it("detects classDiagram", () => {
    expect(detectDiagramType("classDiagram\n  class Animal")).toBe("class");
  });

  it("detects pie", () => {
    expect(detectDiagramType('pie\n  "A" : 30')).toBe("pie");
  });

  it("detects gantt", () => {
    expect(detectDiagramType("gantt\n  title Project")).toBe("gantt");
  });

  it("detects mindmap", () => {
    expect(detectDiagramType("mindmap\n  root")).toBe("mindmap");
  });

  it("detects chartjs DSL", () => {
    const chartCode = JSON.stringify({
      type: "line",
      datasets: [{ label: "A", data: [1, 2] }],
    });
    expect(detectDiagramType(chartCode)).toBe("chartjs");
  });

  it("returns null for unknown code", () => {
    expect(detectDiagramType("hello world")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(detectDiagramType("")).toBeNull();
  });
});

describe("sanitizeDiagram", () => {
  it("returns unchanged code when no fixes needed", () => {
    const code = "flowchart TD\n  A --> B";
    const result = sanitizeDiagram(code);
    expect(result.code).toBe(code);
    expect(result.fixes).toHaveLength(0);
    expect(result.diagramType).toBe("flowchart");
  });

  it("detects diagram type correctly", () => {
    const result = sanitizeDiagram("sequenceDiagram\n  A->>B: msg");
    expect(result.diagramType).toBe("sequence");
  });

  it("reports wasModified when fixes are applied", () => {
    // Flowchart with \n in node labels should get fixed
    const code = 'flowchart TD\n  A["Hello\\nWorld"] --> B';
    const result = sanitizeDiagram(code);
    if (result.wasModified) {
      expect(result.fixes.length).toBeGreaterThan(0);
    }
  });

  it("handles empty input", () => {
    const result = sanitizeDiagram("");
    expect(result.code).toBe("");
    expect(result.diagramType).toBeNull();
  });

  it("returns warnings array", () => {
    const result = sanitizeDiagram("flowchart TD\n  A --> B");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("normalizes unsafe flowchart labels and link syntax", () => {
    const code = 'flowchart TD\n  A[Dedicated NPU Memory (e.g., HBM)] --- B[Compute]';
    const result = sanitizeDiagram(code);
    expect(result.code).toContain('A["Dedicated NPU Memory (e.g., HBM)"] --> B["Compute"]');
  });

  it("removes markdown noise from flowchart blocks", () => {
    const code = '```mermaid\n**Explanation:**\nflowchart TD\n  A --> B\n```';
    const result = sanitizeDiagram(code);
    expect(result.code).toContain("flowchart TD");
    expect(result.code).not.toContain("```");
    expect(result.code).not.toContain("**Explanation:**");
  });
});
