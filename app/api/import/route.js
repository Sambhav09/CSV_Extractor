import { NextResponse } from "next/server";
import { parseCsvText } from "../../../lib/csv.js";
import { extractCrmRecords } from "../../../lib/aiExtractor.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are supported." }, { status: 400 });
    }

    const content = Buffer.from(await file.arrayBuffer()).toString("utf8");
    const rows = parseCsvText(content);

    if (!rows.length) {
      return NextResponse.json({ error: "CSV does not contain any data rows." }, { status: 400 });
    }

    const result = await extractCrmRecords(rows);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unexpected import error." },
      { status: 500 }
    );
  }
}
