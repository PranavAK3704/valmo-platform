import React, { useState } from "react";
import { Upload, Link2, FileText, Eye, EyeOff, AlertCircle, CheckCircle2, X, FileSpreadsheet } from "lucide-react";

// Minimal CSV/TSV parser. Handles quoted cells with embedded commas/newlines and ""-escaped quotes.
function parseDelimited(text, delim = ",") {
  const rows = [];
  let cur = [];
  let buf = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { buf += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { buf += c; }
    } else {
      if (c === '"') inQ = true;
      else if (c === delim) { cur.push(buf); buf = ""; }
      else if (c === "\n") { cur.push(buf); rows.push(cur); cur = []; buf = ""; }
      else if (c === "\r") { /* ignore */ }
      else { buf += c; }
    }
  }
  if (buf || cur.length) { cur.push(buf); rows.push(cur); }
  return rows.filter(r => r.some(v => (v || "").trim()));
}

function autoDetectDelim(firstLine) {
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs > commas ? "\t" : ",";
}

// Convert any Google Sheets URL into the CSV export endpoint.
function googleSheetCsvUrl(url) {
  if (!url) return null;
  const m = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) return null;
  const gidMatch = url.match(/[#&?]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
}

const SAMPLE_CSV = `ticket_id,awb_numbers,my_remarks,reason_loss_marked,what_i_need
166274992,"166274992, 166275001",Forward scans valid within 7d window,System auto-marked as hardstop breach,Reverse the loss
166274993,166274993,Forward scans valid within 7d window,System auto-marked as hardstop breach,Reverse the loss
166274994,"166274994, 166275002",Customer rejection within timeline,System auto-marked as hardstop breach,Reverse the loss`;

export default function ImportFromSheet({ onImport }) {
  const [tab, setTab] = useState("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [showFormat, setShowFormat] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const t = await f.text();
    setText(t);
    setTab("paste");
    e.target.value = "";
  };

  const fetchUrl = async () => {
    setError("");
    setParsed(null);
    setBusy(true);
    const csvUrl = googleSheetCsvUrl(url) || url;
    try {
      const r = await fetch(csvUrl);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const t = await r.text();
      setText(t);
      setTab("paste");
    } catch (err) {
      setError("Couldn't fetch the sheet directly — Google blocks CORS on private sheets. Either (1) File → Share → Publish to web → CSV and use that URL, or (2) copy the rows from the sheet and paste them here.");
    }
    setBusy(false);
  };

  const doParse = () => {
    setError("");
    setParsed(null);
    if (!text.trim()) { setError("Nothing to parse — paste data first."); return; }

    const firstLine = text.split(/\r?\n/).find(l => l.trim()) || "";
    const delim = autoDetectDelim(firstLine);
    const rows = parseDelimited(text, delim);
    if (rows.length < 2) { setError("Need at least a header row and one data row."); return; }

    const headers = rows[0].map(h => (h || "").trim());
    const data = rows.slice(1);

    // Find ticket_id column: by name, or by content (all 12-digit).
    let ticketCol = headers.findIndex(h => /ticket.?id|ticket.?#|ticket.?number/i.test(h));
    if (ticketCol < 0) {
      ticketCol = headers.findIndex((_, i) =>
        data.length > 0 && data.every(r => /^\d{12}$/.test((r[i] || "").trim()))
      );
    }
    if (ticketCol < 0) {
      setError("Couldn't find a Ticket ID column. Name one column 'ticket_id', or make sure one column contains only 12-digit numbers.");
      return;
    }

    // Collect tickets in order, dedupe.
    const tickets = [];
    const seen = new Set();
    data.forEach(r => {
      const tid = (r[ticketCol] || "").trim();
      if (tid && !seen.has(tid)) { seen.add(tid); tickets.push(tid); }
    });
    if (tickets.length === 0) {
      setError("No ticket IDs found in the data rows.");
      return;
    }

    // Build fields. Column-by-column: if every row has the same value, mark applies_to=all; otherwise emit one field per row.
    const fields = [];
    const tNow = Date.now();
    headers.forEach((h, ci) => {
      if (ci === ticketCol) return;
      const label = (h || "").trim();
      if (!label) return;
      const values = data.map(r => (r[ci] || "").trim());
      const nonEmpty = values.filter(Boolean);
      if (nonEmpty.length === 0) return;
      const allSame = values.every(v => v === values[0]) && values[0] !== "";
      if (allSame) {
        fields.push({
          key: `field_${tNow}_${ci}`,
          label, value: values[0], applies_to: ["all"]
        });
      } else {
        data.forEach((r, ri) => {
          const v = (r[ci] || "").trim();
          if (!v) return;
          const tid = (r[ticketCol] || "").trim();
          if (!tid) return;
          fields.push({
            key: `field_${tNow}_${ci}_${ri}`,
            label, value: v, applies_to: [tid]
          });
        });
      }
    });

    setParsed({ tickets, fields, headers });
  };

  const apply = () => {
    if (!parsed) return;
    onImport({ tickets: parsed.tickets, fields: parsed.fields });
    setText(""); setUrl(""); setParsed(null);
  };

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3 className="admin-card-title">
          <FileSpreadsheet size={16} style={{ verticalAlign: -3, marginRight: 8, color: "var(--text-dark-mute)" }} />
          Import from spreadsheet
        </h3>
        <button className="btn small ghost" onClick={() => setShowFormat(!showFormat)}>
          {showFormat ? <EyeOff size={11} /> : <Eye size={11} />} {showFormat ? "Hide" : "Show"} format
        </button>
      </div>

      {showFormat && (
        <div className="format-spec">
          <div className="format-spec-title">Recommended format</div>
          <ul className="format-spec-list">
            <li><b>One row per ticket.</b> The first row is the header that names each column.</li>
            <li><b>One column named <code>ticket_id</code></b> with 12-digit IDs. (Or any column where every value is a 12-digit number — that gets auto-detected.)</li>
            <li>Every other column becomes a field on the alignment.
              {" "}If the column has the <b>same value</b> on every row, it's marked <em>"applies to all tickets"</em>.
              {" "}If it differs by row, it's added <em>per ticket</em>.</li>
            <li>For multi-value cells (e.g. multiple AWBs for one ticket), wrap in quotes: <code>"166274992, 166275001"</code>.</li>
            <li>Excel: <em>File → Save As → CSV</em>. Google Sheets: paste the share link below, or <em>File → Download → CSV</em>.</li>
          </ul>
          <div className="form-label" style={{ marginTop: 4 }}>Sample CSV</div>
          <pre className="format-spec-sample">{SAMPLE_CSV}</pre>
          <button className="btn tiny" onClick={() => { setText(SAMPLE_CSV); setTab("paste"); }}>
            Load sample into the textarea
          </button>
        </div>
      )}

      <div className="import-tabs">
        <button className={`import-tab ${tab === "paste" ? "active" : ""}`} onClick={() => setTab("paste")}>
          <FileText size={12} /> Paste CSV / TSV
        </button>
        <button className={`import-tab ${tab === "file" ? "active" : ""}`} onClick={() => setTab("file")}>
          <Upload size={12} /> Upload CSV
        </button>
        <button className={`import-tab ${tab === "url" ? "active" : ""}`} onClick={() => setTab("url")}>
          <Link2 size={12} /> Google Sheet URL
        </button>
      </div>

      {tab === "paste" && (
        <div className="form-group" style={{ marginBottom: 8 }}>
          <textarea
            className="form-textarea"
            style={{ minHeight: 130, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"ticket_id,awb_numbers,my_remarks\n166274992,\"166274992, 166275001\",…"}
          />
          <div className="form-hint" style={{ marginTop: 6 }}>
            Paste rows directly from Excel/Sheets (tabs are fine), or paste raw CSV text.
          </div>
        </div>
      )}

      {tab === "file" && (
        <div className="form-group" style={{ marginBottom: 8 }}>
          <label className="btn">
            <Upload size={11} /> Choose .csv file
            <input
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
              onChange={handleFile}
              style={{ display: "none" }}
            />
          </label>
          <div className="form-hint" style={{ marginTop: 8 }}>
            Have an Excel (.xlsx) file? Save it as CSV first via File → Save As → CSV.
          </div>
          {text && (
            <div className="form-hint" style={{ marginTop: 8, color: "var(--text-dark)" }}>
              ✓ File loaded ({text.split(/\r?\n/).filter(l => l.trim()).length} non-empty lines).
            </div>
          )}
        </div>
      )}

      {tab === "url" && (
        <div className="form-group" style={{ marginBottom: 8 }}>
          <input
            className="form-input"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/…"
          />
          <div className="form-hint" style={{ marginTop: 6 }}>
            Sheet must be shared "Anyone with link → viewer" or published to web. Private sheets won't load due to CORS.
          </div>
          <button className="btn small" onClick={fetchUrl} disabled={!url || busy} style={{ marginTop: 8 }}>
            {busy ? "Fetching…" : "Fetch sheet"}
          </button>
        </div>
      )}

      {error && (
        <div className="import-error">
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {parsed && (
        <div className="import-preview">
          <div className="import-preview-head">
            <CheckCircle2 size={13} style={{ color: "var(--good)" }} />
            <span>
              Parsed <b>{parsed.tickets.length}</b> ticket{parsed.tickets.length === 1 ? "" : "s"} and <b>{parsed.fields.length}</b> field entr{parsed.fields.length === 1 ? "y" : "ies"}.
            </span>
            <button className="btn tiny ghost" onClick={() => setParsed(null)} style={{ marginLeft: "auto" }} title="Clear preview">
              <X size={11} />
            </button>
          </div>
          <div className="import-preview-tickets">
            {parsed.tickets.slice(0, 8).map(t => (
              <span key={t} className="ticket-chip">{t}</span>
            ))}
            {parsed.tickets.length > 8 && (
              <span style={{ fontSize: 11, color: "var(--text-dark-mute)", alignSelf: "center" }}>
                +{parsed.tickets.length - 8} more
              </span>
            )}
          </div>
          <div className="form-hint" style={{ marginTop: 8 }}>
            Applying replaces any tickets and fields you've already entered.
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn small primary" onClick={doParse} disabled={!text.trim()}>
          Parse
        </button>
        {parsed && (
          <button className="btn small accent" onClick={apply}>
            <CheckCircle2 size={11} /> Apply to form
          </button>
        )}
      </div>
    </div>
  );
}
