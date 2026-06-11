import { describe, it, expect } from "vitest";
import { parseDiagramResponse } from "../gemini";

describe("parseDiagramResponse", () => {
  it("extracts mermaid from fenced blocks", () => {
    const response = parseDiagramResponse("```mermaid\nflowchart TD\nA-->B\n```");
    expect(response.code).toContain("flowchart TD");
  });

  it("self-heals plain-text mermaid output without fences", () => {
    const text = [
      "Here is your diagram:",
      "",
      "flowchart TD",
      'A["Start"] --> B["End"]',
    ].join("\n");
    const response = parseDiagramResponse(text);
    expect(response.code.startsWith("flowchart TD")).toBe(true);
    expect(response.code).toContain("A[\"Start\"] --> B[\"End\"]");
  });

  it("preserves and sanitizes advanced supported diagram types", () => {
    const text = "block-beta\n  title \"Service Map\"\n  a b";
    const response = parseDiagramResponse(text);
    expect(response.code.startsWith("block-beta")).toBe(true);
    expect(response.code).not.toContain("title \"Service Map\"");
  });
});
