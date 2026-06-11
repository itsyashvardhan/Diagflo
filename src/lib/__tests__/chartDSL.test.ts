import { describe, it, expect } from "vitest";
import { isChartJSDSL, parseChartDSL, getChartTypeLabel } from "../chartDSL";

describe("isChartJSDSL", () => {
  it("detects chartjs fenced code blocks", () => {
    const code = '```chartjs\n{"type":"line","datasets":[]}\n```';
    expect(isChartJSDSL(code)).toBe(true);
  });

  it("detects raw chartjs prefix", () => {
    const code = 'chartjs\n{"type":"bar","datasets":[]}';
    expect(isChartJSDSL(code)).toBe(true);
  });

  it("detects bare JSON with chart fields", () => {
    const code = JSON.stringify({
      type: "scatter",
      datasets: [{ label: "A", data: [1, 2, 3] }],
    });
    expect(isChartJSDSL(code)).toBe(true);
  });

  it("rejects plain Mermaid code", () => {
    expect(isChartJSDSL("flowchart TD\n  A --> B")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isChartJSDSL("")).toBe(false);
  });

  it("rejects JSON without datasets", () => {
    expect(isChartJSDSL('{"type":"line"}')).toBe(false);
  });

  it("rejects invalid chart type", () => {
    const code = JSON.stringify({
      type: "radar",
      datasets: [{ label: "A", data: [1] }],
    });
    expect(isChartJSDSL(code)).toBe(false);
  });
});

describe("parseChartDSL", () => {
  it("parses a valid line chart config", () => {
    const code = JSON.stringify({
      type: "line",
      title: "Revenue",
      datasets: [{ label: "Sales", data: [10, 20, 30] }],
    });
    const result = parseChartDSL(code);
    expect(result.success).toBe(true);
    expect(result.config?.type).toBe("line");
    expect(result.config?.title).toBe("Revenue");
    expect(result.config?.datasets).toHaveLength(1);
  });

  it("parses a chartjs fenced code block", () => {
    const code =
      '```chartjs\n{"type":"bar","datasets":[{"label":"Q1","data":[5,10]}]}\n```';
    const result = parseChartDSL(code);
    expect(result.success).toBe(true);
    expect(result.config?.type).toBe("bar");
  });

  it("returns error for invalid JSON", () => {
    const result = parseChartDSL("{invalid json}");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error for missing datasets", () => {
    const result = parseChartDSL(JSON.stringify({ type: "line" }));
    expect(result.success).toBe(false);
  });

  it("returns error for empty string", () => {
    const result = parseChartDSL("");
    expect(result.success).toBe(false);
  });
});

describe("getChartTypeLabel", () => {
  it("returns proper label for known types", () => {
    expect(getChartTypeLabel("line")).toBe("Line Chart");
    expect(getChartTypeLabel("bar")).toBe("Bar Chart");
    expect(getChartTypeLabel("scatter")).toBe("Scatter Plot");
  });

  it("returns capitalized type for unknown types", () => {
    const label = getChartTypeLabel("custom" as never);
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });
});
