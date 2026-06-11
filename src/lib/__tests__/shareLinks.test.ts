import { describe, it, expect } from "vitest";
import { generateShareId } from "../shareLinks";

describe("generateShareId", () => {
  it("returns a string in xxxx-xxxx-xxxx format", () => {
    const id = generateShareId();
    expect(id).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateShareId()));
    expect(ids.size).toBe(100);
  });

  it("returns a 14-character string (including dashes)", () => {
    const id = generateShareId();
    expect(id.length).toBe(14);
  });

  it("only contains lowercase alphanumeric chars and dashes", () => {
    const id = generateShareId();
    expect(id).toMatch(/^[a-z0-9-]+$/);
  });
});
