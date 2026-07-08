import { ALLOWED_DATA_SOURCES, ALLOWED_STATUSES, CRM_FIELDS } from "./constants.js";

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{5,12}/g;

const FIELD_HINTS = {
  created_at: ["created", "created at", "date", "lead date", "submitted", "timestamp", "time"],
  name: ["name", "full name", "client", "customer", "lead name", "person"],
  email: ["email", "e-mail", "mail"],
  mobile_without_country_code: ["phone", "mobile", "contact", "number", "whatsapp", "telephone"],
  company: ["company", "organisation", "organization", "business"],
  city: ["city", "location city"],
  state: ["state", "province", "region"],
  country: ["country", "nation"],
  lead_owner: ["owner", "agent", "assigned", "salesperson", "lead owner"],
  crm_status: ["status", "stage", "disposition", "lead status"],
  crm_note: ["note", "remark", "comment", "follow", "message", "description"],
  data_source: ["source", "campaign", "project", "property"],
  possession_time: ["possession", "handover", "move in"]
};

export function normalizeRecords(mappedRecords, sourceRows) {
  const imported = [];
  const skipped = [];

  mappedRecords.forEach((record, index) => {
    const source = sourceRows[index]?.source || sourceRows[index] || {};
    const rowNumber = sourceRows[index]?.rowNumber || index + 2;
    const normalized = normalizeRecord(record, source);

    if (!normalized.email && !normalized.mobile_without_country_code) {
      skipped.push({
        rowNumber,
        reason: "Missing both email and mobile number",
        source
      });
      return;
    }

    imported.push(normalized);
  });

  return { imported, skipped };
}

export function normalizeRecord(record = {}, source = {}) {
  const merged = { ...heuristicMapRow(source), ...record };
  const emailMatches = collectMatches(merged.email || merged.crm_note || "", EMAIL_REGEX);
  const rowEmails = collectMatches(JSON.stringify(source), EMAIL_REGEX);
  const emails = unique([merged.email, ...emailMatches, ...rowEmails].filter(Boolean).map(cleanEmail));

  const phoneCandidates = unique([
    merged.mobile_without_country_code,
    ...collectMatches(merged.crm_note || "", PHONE_REGEX),
    ...collectMatches(JSON.stringify(source), PHONE_REGEX)
  ].filter(Boolean));
  const phone = splitPhone(phoneCandidates[0] || "");

  const extraNotes = [];
  if (emails.length > 1) extraNotes.push(`Extra emails: ${emails.slice(1).join(", ")}`);
  if (phoneCandidates.length > 1) extraNotes.push(`Extra phone numbers: ${phoneCandidates.slice(1).join(", ")}`);

  const normalized = {};
  CRM_FIELDS.forEach((field) => {
    normalized[field] = cleanValue(merged[field]);
  });

  normalized.email = emails[0] || "";
  normalized.country_code = cleanValue(merged.country_code || phone.countryCode);
  normalized.mobile_without_country_code = cleanValue(phone.mobile || merged.mobile_without_country_code);
  normalized.crm_status = normalizeStatus(merged.crm_status);
  normalized.data_source = normalizeDataSource(merged.data_source);
  normalized.created_at = normalizeDate(merged.created_at);
  normalized.crm_note = compactNotes([merged.crm_note, ...extraNotes]);

  return normalized;
}

export function heuristicMapRow(row = {}) {
  const result = Object.fromEntries(CRM_FIELDS.map((field) => [field, ""]));
  const entries = Object.entries(row);

  for (const field of CRM_FIELDS) {
    const match = entries.find(([key]) => hasHint(key, FIELD_HINTS[field] || [field]));
    if (match) result[field] = match[1];
  }

  const serialized = JSON.stringify(row);
  const emails = collectMatches(serialized, EMAIL_REGEX);
  const phones = collectMatches(serialized, PHONE_REGEX);
  if (!result.email && emails[0]) result.email = emails[0];
  if (!result.mobile_without_country_code && phones[0]) {
    const phone = splitPhone(phones[0]);
    result.country_code = phone.countryCode;
    result.mobile_without_country_code = phone.mobile;
  }

  result.crm_status = inferStatus(result.crm_status || serialized);
  result.data_source = inferDataSource(result.data_source || serialized);
  result.crm_note = result.crm_note || collectLooseNotes(row);

  return result;
}

function hasHint(key, hints) {
  const normalizedKey = key.toLowerCase().replace(/[_-]+/g, " ");
  return hints.some((hint) => normalizedKey.includes(hint));
}

function collectMatches(value, regex) {
  return String(value || "").match(regex) || [];
}

function cleanEmail(value) {
  return String(value || "").trim().replace(/[;,]+$/, "").toLowerCase();
}

function cleanValue(value) {
  return String(value ?? "").replace(/\r?\n/g, "\\n").trim();
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function splitPhone(rawValue) {
  const original = String(rawValue || "").trim();
  const countryMatch = original.match(/^\+(\d{1,3})/);
  const digits = original.replace(/\D/g, "");
  const countryCode = countryMatch ? `+${countryMatch[1]}` : "";
  const mobile = countryMatch ? digits.slice(countryMatch[1].length) : digits;
  return { countryCode, mobile };
}

function normalizeStatus(value) {
  const cleaned = cleanValue(value).toUpperCase();
  if (ALLOWED_STATUSES.includes(cleaned)) return cleaned;
  return inferStatus(cleaned);
}

function inferStatus(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("sold") || text.includes("closed") || text.includes("won") || text.includes("sale")) {
    return "SALE_DONE";
  }
  if (text.includes("bad") || text.includes("invalid") || text.includes("not interested") || text.includes("lost")) {
    return "BAD_LEAD";
  }
  if (text.includes("not connect") || text.includes("no answer") || text.includes("busy") || text.includes("unreachable")) {
    return "DID_NOT_CONNECT";
  }
  return text ? "GOOD_LEAD_FOLLOW_UP" : "";
}

function normalizeDataSource(value) {
  const cleaned = cleanValue(value).toLowerCase().replace(/[\s-]+/g, "_");
  return ALLOWED_DATA_SOURCES.includes(cleaned) ? cleaned : inferDataSource(cleaned);
}

function inferDataSource(value) {
  const text = String(value || "").toLowerCase().replace(/[\s-]+/g, "_");
  return ALLOWED_DATA_SOURCES.find((source) => text.includes(source)) || "";
}

function normalizeDate(value) {
  const cleaned = cleanValue(value);
  if (!cleaned) return "";
  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? cleaned : date.toISOString();
}

function compactNotes(notes) {
  return notes.map(cleanValue).filter(Boolean).join(" | ");
}

function collectLooseNotes(row) {
  return Object.entries(row)
    .filter(([key]) => hasHint(key, FIELD_HINTS.crm_note))
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");
}
