import OpenAI from "openai";
import { ALLOWED_DATA_SOURCES, ALLOWED_STATUSES, CRM_FIELDS } from "./constants.js";
import { heuristicMapRow, normalizeRecords } from "./normalizer.js";

const batchSize = Number(process.env.BATCH_SIZE || 25);
const openAiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const openAiApiKey = process.env.OPENAI_API_KEY || "";

const openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

export async function extractCrmRecords(rows) {
  const batches = chunk(rows.map((source, index) => ({ rowNumber: index + 2, source })), batchSize);
  const imported = [];
  const skipped = [];

  for (const batch of batches) {
    const mapped = openai ? await extractBatchWithOpenAi(batch) : batch.map(({ source }) => heuristicMapRow(source));
    const normalized = normalizeRecords(mapped, batch);
    imported.push(...normalized.imported);
    skipped.push(...normalized.skipped);
  }

  return {
    imported,
    skipped,
    summary: {
      totalRows: rows.length,
      totalImported: imported.length,
      totalSkipped: skipped.length
    }
  };
}

async function extractBatchWithOpenAi(batch) {
  try {
    const response = await openai.chat.completions.create({
      model: openAiModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: JSON.stringify({
            records: batch.map(({ rowNumber, source }) => ({ rowNumber, source }))
          })
        }
      ]
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const records = Array.isArray(parsed.records) ? parsed.records : [];
    return batch.map((item) => {
      const match = records.find((record) => Number(record.rowNumber) === item.rowNumber);
      return match?.crm || match || heuristicMapRow(item.source);
    });
  } catch (error) {
    console.warn("OpenAI extraction failed, using fallback mapper:", error.message);
    return batch.map(({ source }) => heuristicMapRow(source));
  }
}

function buildSystemPrompt() {
  return `
You convert arbitrary CSV lead rows into GrowEasy CRM records.
Return only valid JSON with this exact shape:
{"records":[{"rowNumber":2,"crm":{...}}]}

Required CRM keys:
${CRM_FIELDS.join(", ")}

Rules:
- Use only these crm_status values: ${ALLOWED_STATUSES.join(", ")}.
- Use only these data_source values: ${ALLOWED_DATA_SOURCES.join(", ")}. Leave blank if not confident.
- created_at must be parseable by JavaScript new Date(created_at), or blank.
- Put remarks, follow-up details, extra emails, extra phone numbers, and unmatched useful data in crm_note.
- If multiple emails exist, email must be the first and the rest go into crm_note.
- If multiple mobile numbers exist, mobile_without_country_code must be the first and the rest go into crm_note.
- Keep every field single-line. Escape line breaks as \\n.
- Do not invent email or mobile numbers.
- Include a record even if it appears invalid; the API will skip rows without email and mobile.
`.trim();
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
