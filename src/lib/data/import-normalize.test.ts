import { describe, expect, it } from "vitest";
import { normalizeCategory, normalizeCondition } from "./import-normalize";

describe("normalizeCategory", () => {
  it("passes through an exact internal key", () => {
    expect(normalizeCategory("sports_card")).toBe("sports_card");
  });
  it("matches a display label case-insensitively", () => {
    expect(normalizeCategory("Sports Card")).toBe("sports_card");
  });
  it("resolves common aliases from other collection apps", () => {
    expect(normalizeCategory("Pokemon")).toBe("trading_card");
    expect(normalizeCategory("MTG")).toBe("trading_card");
    expect(normalizeCategory("Funko Pop")).toBe("funko");
    expect(normalizeCategory("Basketball")).toBe("sports_card");
  });
  it("is whitespace- and case-tolerant", () => {
    expect(normalizeCategory("  cOmIc  ")).toBe("comic");
  });
  it("falls back to trading_card for unmapped or empty values, not an error", () => {
    expect(normalizeCategory(undefined)).toBe("trading_card");
    expect(normalizeCategory("")).toBe("trading_card");
    expect(normalizeCategory("some unknown thing")).toBe("trading_card");
  });
});

describe("normalizeCondition", () => {
  it("passes through an exact internal key", () => {
    expect(normalizeCondition("lightly_played")).toBe("lightly_played");
  });
  it("matches a display label case-insensitively", () => {
    expect(normalizeCondition("Near Mint")).toBe("near_mint");
  });
  it("resolves common shorthand grading abbreviations", () => {
    expect(normalizeCondition("NM")).toBe("near_mint");
    expect(normalizeCondition("lp")).toBe("lightly_played");
    expect(normalizeCondition("HP")).toBe("heavily_played");
    expect(normalizeCondition("New")).toBe("sealed");
  });
  it("falls back to near_mint for unmapped or empty values, not an error", () => {
    expect(normalizeCondition(undefined)).toBe("near_mint");
    expect(normalizeCondition("")).toBe("near_mint");
    expect(normalizeCondition("who knows")).toBe("near_mint");
  });
});
