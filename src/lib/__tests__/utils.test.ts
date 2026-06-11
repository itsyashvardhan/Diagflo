import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn (classname merge utility)", () => {
  it("merges multiple class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates conflicting Tailwind classes", () => {
    // tailwind-merge should resolve px-4 vs px-2 → keep last
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty string", () => {
    expect(cn("")).toBe("");
  });

  it("handles arrays", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });
});
