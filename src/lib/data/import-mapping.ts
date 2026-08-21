// Column-mapping logic for CSV import: the list of fields Collectfolio understands,
// and best-effort auto-matching of a CSV's headers onto those fields by name.
// Pure/testable — no React, no store access.

export interface ImportTargetField {
  key: string;
  label: string;
  required: boolean;
}

export const TARGET_FIELDS: ImportTargetField[] = [
  { key: "name", label: "Card name", required: true },
  { key: "category", label: "Category", required: false },
  { key: "set", label: "Set", required: false },
  { key: "number", label: "Card number", required: false },
  { key: "quantity", label: "Quantity", required: false },
  { key: "condition", label: "Condition", required: false },
  { key: "grade", label: "Grade", required: false },
  { key: "gradingCompany", label: "Grading company", required: false },
  { key: "currentValue", label: "Current value", required: false },
  { key: "purchasePrice", label: "Purchase price", required: false },
  { key: "purchaseDate", label: "Purchase date", required: false },
];

// Header text (lowercased, punctuation stripped) that should auto-match each field.
// Listed roughly most-specific-first; the first alias found in the CSV headers wins.
const FIELD_ALIASES: Record<string, string[]> = {
  name: ["card name", "name", "item name", "title", "card"],
  category: ["category", "type"],
  set: ["set name", "set"],
  number: ["card number", "number", "card #", "no"],
  quantity: ["quantity", "qty", "count"],
  condition: ["condition", "cond"],
  grade: ["grade"],
  gradingCompany: ["grading company", "grader", "company"],
  currentValue: ["market value", "current value", "value", "est value", "estimated value"],
  purchasePrice: ["purchase price", "price", "cost", "paid"],
  purchaseDate: ["purchased", "purchase date", "date purchased", "date"],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

/**
 * Best-effort auto-mapping from CSV headers onto our target field keys, matched by
 * normalized header text. Returns { targetFieldKey: csvHeader } for every field it
 * could confidently match; unmatched fields are simply absent from the result.
 */
export function autoMatchColumns(headers: string[]): Record<string, string> {
  const normalized = headers.map((h) => ({ original: h, normalized: normalizeHeader(h) }));
  const mapping: Record<string, string> = {};

  for (const field of TARGET_FIELDS) {
    const aliases = FIELD_ALIASES[field.key] ?? [field.key];
    for (const alias of aliases) {
      const match = normalized.find((h) => h.normalized === alias);
      if (match) {
        mapping[field.key] = match.original;
        break;
      }
    }
  }

  return mapping;
}
