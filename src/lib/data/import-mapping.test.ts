import { describe, expect, it } from "vitest";
import { autoMatchColumns } from "./import-mapping";

describe("autoMatchColumns", () => {
  it("matches the worked example from the spec (mostly exact header names)", () => {
    const headers = [
      "Card Name",
      "Set Name",
      "Number",
      "Qty",
      "Condition",
      "Market Value",
      "Purchase Price",
      "Purchased",
    ];
    const mapping = autoMatchColumns(headers);
    expect(mapping.name).toBe("Card Name");
    expect(mapping.set).toBe("Set Name");
    expect(mapping.number).toBe("Number");
    expect(mapping.quantity).toBe("Qty");
    expect(mapping.condition).toBe("Condition");
    expect(mapping.currentValue).toBe("Market Value");
    expect(mapping.purchasePrice).toBe("Purchase Price");
    expect(mapping.purchaseDate).toBe("Purchased");
  });

  it("leaves grade and grading company unmatched when absent, rather than guessing", () => {
    const mapping = autoMatchColumns(["Card Name", "Set Name"]);
    expect(mapping.grade).toBeUndefined();
    expect(mapping.gradingCompany).toBeUndefined();
  });

  it("is case- and whitespace-insensitive", () => {
    const mapping = autoMatchColumns(["  card NAME  ", "SET"]);
    expect(mapping.name).toBe("  card NAME  ");
    expect(mapping.set).toBe("SET");
  });

  it("treats underscores and hyphens as spaces", () => {
    const mapping = autoMatchColumns(["card_name", "purchase-price"]);
    expect(mapping.name).toBe("card_name");
    expect(mapping.purchasePrice).toBe("purchase-price");
  });

  it("returns an empty mapping for headers with no recognizable overlap", () => {
    const mapping = autoMatchColumns(["Foo", "Bar", "Baz"]);
    expect(Object.keys(mapping)).toHaveLength(0);
  });
});
