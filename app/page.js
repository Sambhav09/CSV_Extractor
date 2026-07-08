"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  FileSpreadsheet,
  Loader2,
  Moon,
  RotateCcw,
  Sparkles,
  Sun
} from "lucide-react";

const CRM_COLUMNS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description"
];

export default function Home() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const inputRef = useRef(null);

  const previewRows = useMemo(() => rows.slice(0, 100), [rows]);

  const reset = () => {
    setFile(null);
    setColumns([]);
    setRows([]);
    setResults(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const parseFile = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    setFile(selectedFile);
    setResults(null);
    setError("");
    setIsParsing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: ({ data, meta, errors }) => {
        setIsParsing(false);
        if (errors.length) {
          setError(errors[0].message || "Could not parse this CSV.");
          return;
        }
        const filteredRows = data.filter((row) =>
          Object.values(row).some((value) => String(value || "").trim())
        );
        setColumns(meta.fields || []);
        setRows(filteredRows);
      },
      error: (parseError) => {
        setIsParsing(false);
        setError(parseError.message || "Could not parse this CSV.");
      }
    });
  }, []);

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    parseFile(event.dataTransfer.files?.[0]);
  };

  const confirmImport = async () => {
    if (!file) return;
    setIsImporting(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Import failed.");
      }
      setResults(payload);
    } catch (importError) {
      setError(importError.message || "Import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <main className={isDark ? "app dark" : "app"}>
      <section className="shell">
        <nav className="topbar">
          <div className="brand">
            <span className="brand-mark">G</span>
            <span>GrowEasy CSV Importer</span>
          </div>
          <button className="icon-button" onClick={() => setIsDark((value) => !value)} aria-label="Toggle theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>

        <header className="hero">
          <div>
            <p className="eyebrow">AI-powered lead mapping</p>
            <h1>Turn any CSV lead export into clean GrowEasy CRM records.</h1>
            <p className="subtitle">
              Upload a messy CSV, preview it locally, then confirm to map the fields with AI.
            </p>
          </div>
          <div className="status-panel">
            <Metric label="Rows detected" value={rows.length} />
            <Metric label="Imported" value={results?.summary?.totalImported || 0} />
            <Metric label="Skipped" value={results?.summary?.totalSkipped || 0} />
          </div>
        </header>

        <section
          className={isDragging ? "dropzone dragging" : "dropzone"}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="drop-icon">
            <CloudUpload size={28} />
          </div>
          <div>
            <h2>Upload CSV</h2>
            <p>Drag and drop a CSV file here, or choose one from your device.</p>
          </div>
          <div className="upload-actions">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => parseFile(event.target.files?.[0])}
              hidden
            />
            <button className="secondary-button" onClick={() => inputRef.current?.click()}>
              <FileSpreadsheet size={18} />
              Choose file
            </button>
            {file && (
              <button className="ghost-button" onClick={reset}>
                <RotateCcw size={17} />
                Reset
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="alert error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {isParsing && (
          <div className="alert">
            <Loader2 className="spin" size={18} />
            Parsing CSV preview...
          </div>
        )}

        {file && !isParsing && (
          <section className="workspace">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Step 2</p>
                <h2>Preview uploaded rows</h2>
              </div>
              <div className="file-pill">{file.name}</div>
            </div>
            <DataTable columns={columns} rows={previewRows} emptyText="No preview rows found." />
            {rows.length > previewRows.length && (
              <p className="table-note">Showing first {previewRows.length} of {rows.length} rows for preview.</p>
            )}
            <div className="confirm-row">
              <button className="primary-button" onClick={confirmImport} disabled={!rows.length || isImporting}>
                {isImporting ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                {isImporting ? "Mapping with AI..." : "Confirm import"}
              </button>
            </div>
          </section>
        )}

        {results && (
          <section className="workspace">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Step 4</p>
                <h2>Parsed GrowEasy CRM records</h2>
              </div>
              <div className="success-pill">
                <CheckCircle2 size={16} />
                {results.summary.totalImported} imported
              </div>
            </div>
            <DataTable columns={CRM_COLUMNS} rows={results.imported} emptyText="No records were imported." />

            <div className="section-heading skipped-heading">
              <div>
                <p className="eyebrow">Skipped records</p>
                <h2>Rows needing review</h2>
              </div>
              <div className="file-pill">{results.summary.totalSkipped} skipped</div>
            </div>
            <DataTable
              columns={["row_number", "reason", "source"]}
              rows={results.skipped.map((record) => ({
                row_number: record.rowNumber,
                reason: record.reason,
                source: JSON.stringify(record.source)
              }))}
              emptyText="Nothing skipped. Nice."
            />
          </section>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DataTable({ columns, rows, emptyText }) {
  if (!columns.length || !rows.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column}>{String(row[column] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
