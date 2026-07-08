import { parse } from "csv-parse/sync";

export function parseCsvText(content) {
  return parse(content.replace(/^\uFEFF/, ""), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true
  }).filter((row) => Object.values(row).some((value) => String(value || "").trim()));
}
