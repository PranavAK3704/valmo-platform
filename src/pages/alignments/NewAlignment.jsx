import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Send, CheckCircle2, Paperclip, X, FileText } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";
import { getInitials, TAT_PRESETS } from "../../components/helpers";
import ImportFromSheet from "./ImportFromSheet";

// Pull all 12-digit chunks from raw input (whether or not separated by commas/whitespace).
// Dedupes while preserving first-seen order.
function parseTicketIds(raw) {
  if (!raw) return [];
  const matches = String(raw).match(/\d{12}/g) || [];
  const seen = new Set();
  const out = [];
  for (const m of matches) {
    if (!seen.has(m)) { seen.add(m); out.push(m); }
  }
  return out;
}

const DEFAULT_FIELDS = [
  { key: "awb_numbers", label: "AWB Numbers", value: "", applies_to: ["all"] },
  { key: "my_remarks", label: "My remarks", value: "", applies_to: ["all"] },
  { key: "reason_loss_marked", label: "Reason loss was marked", value: "", applies_to: ["all"] },
  { key: "what_i_need", label: "What I need from you", value: "", applies_to: ["all"] }
];

export default function NewAlignment() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselect = params.get("to");
  const { people, teams, saveAlignment } = useData();
  const { user } = useAuth();
  const { show } = useToast();

  const availableReceivers = people.filter(p => p.role === "poc" && p.id !== user?.person_id);

  const [receiverId, setReceiverId] = useState(preselect || availableReceivers[0]?.id || "");
  const [mode, setMode] = useState("structured");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // New: ticket IDs as a first-class list (12-digit each), parsed from a textarea
  const [ticketsRaw, setTicketsRaw] = useState("");
  const tickets = useMemo(() => parseTicketIds(ticketsRaw), [ticketsRaw]);

  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [receiverFieldLabel, setReceiverFieldLabel] = useState("Your remarks / resolution");
  const [tatHours, setTatHours] = useState(24);
  const [customTat, setCustomTat] = useState("");
  const [tatMode, setTatMode] = useState("preset");
  const [extraViewers, setExtraViewers] = useState([]);
  const [attachments, setAttachments] = useState([]);

  const receiver = people.find(p => p.id === receiverId);
  const receiverTeam = receiver ? teams.find(t => t.id === receiver.team_id) : null;
  const receiverMgr = receiver ? people.find(p => p.team_id === receiver.team_id && p.role === "manager") : null;
  const myMgr = user ? people.find(p => p.team_id === user.team_id && p.role === "manager") : null;

  const autoCcIds = [receiverMgr, myMgr].filter(Boolean).map(p => p.id);

  const viewerCandidates = people.filter(p =>
    p.id !== user?.person_id &&
    p.id !== receiverId &&
    !autoCcIds.includes(p.id) &&
    p.role !== "l1"
  );

  const toggleExtraViewer = (id) => {
    setExtraViewers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addField = () => setFields([...fields, { key: `field_${Date.now()}`, label: "", value: "", applies_to: ["all"] }]);
  const updateField = (i, k, v) => {
    const next = [...fields]; next[i] = { ...next[i], [k]: v }; setFields(next);
  };
  const removeField = (i) => setFields(fields.filter((_, idx) => idx !== i));

  // Toggle a ticket id (or "all") in a field's applies_to.
  // Selecting "all" clears specific selections; selecting a specific clears "all".
  const toggleAppliesTo = (i, value) => {
    const f = fields[i];
    let next = [...(f.applies_to || ["all"])];
    if (value === "all") {
      next = ["all"];
    } else {
      next = next.filter(x => x !== "all");
      if (next.includes(value)) next = next.filter(x => x !== value);
      else next.push(value);
      if (next.length === 0) next = ["all"];
    }
    updateField(i, "applies_to", next);
  };

  const onFilesPicked = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const out = [];
    for (const f of files) {
      const data = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(f);
      });
      out.push({ id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: f.name, size: f.size, type: f.type, data });
    }
    setAttachments(prev => [...prev, ...out]);
    e.target.value = "";
  };
  const removeAttachment = (id) => setAttachments(prev => prev.filter(a => a.id !== id));

  const effectiveTat = tatMode === "custom" ? (parseFloat(customTat) || 24) : tatHours;

  const submit = async () => {
    if (!title.trim()) { alert("Title is required"); return; }
    if (!receiverId) { alert("Pick a receiver"); return; }
    if (mode === "freeform" && !body.trim()) { alert("Add a message body"); return; }
    if (mode === "structured") {
      const hasContent = tickets.length > 0 || fields.some(f => f.label.trim() && f.value.trim());
      if (!hasContent) { alert("Add at least one ticket or one field"); return; }
    }

    const now = Date.now();
    const cleanFields = mode === "structured"
      ? fields.filter(f => f.label.trim()).map(f => ({
          key: f.key, label: f.label.trim(), value: f.value,
          applies_to: (f.applies_to && f.applies_to.length) ? f.applies_to : ["all"]
        }))
      : [];

    const alignment = {
      id: `al_${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      mode,
      sender_id: user.person_id,
      receiver_id: receiverId,
      cc_ids: autoCcIds,
      extra_viewers: extraViewers,
      tickets,
      structured_fields: cleanFields,
      receiver_field_label: mode === "structured" ? receiverFieldLabel : "",
      body: mode === "freeform" ? body.trim() : "",
      attachments,
      tat_hours: effectiveTat,
      created_at: now,
      deadline_at: now + effectiveTat * 3600 * 1000,
      status: "open",
      thread: [],
      responded_at: null,
      closed_at: null
    };
    await saveAlignment(alignment);
    show("Alignment sent");
    navigate(`/alignments/${alignment.id}`);
  };

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <button className="btn ghost" style={{ marginBottom: 12 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={13} /> Back
        </button>

        <div className="page-header">
          <div className="page-crumb">Alignments · New</div>
          <h1 className="page-title">Raise an <em>alignment</em></h1>
          <p className="page-subtitle">
            Send a dependency request with a TAT. The receiver and their manager are cc'd automatically, so everyone has visibility.
          </p>
        </div>

        {/* Receiver */}
        <div className="admin-card">
          <div className="admin-card-head"><h3 className="admin-card-title">Who are you aligning with?</h3></div>
          <div className="form-group">
            <label className="form-label">Receiver *</label>
            <select className="form-select" value={receiverId} onChange={e => setReceiverId(e.target.value)}>
              {availableReceivers.map(p => {
                const t = teams.find(x => x.id === p.team_id);
                return <option key={p.id} value={p.id}>{p.name} — {t?.name}</option>;
              })}
            </select>
          </div>
          {receiver && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--paper-2)", borderRadius: 4 }}>
              <div className={`person-avatar ${receiver.role}`}>{getInitials(receiver.name)}</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{receiver.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dark-mute)" }}>
                  {receiverTeam?.name} · Handles: {(receiver.handles || []).join(", ")}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="admin-card">
          <div className="admin-card-head"><h3 className="admin-card-title">Title</h3></div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Reverse loss — 12 AWBs, hardstop SOP followed"
            />
            <div className="form-hint">One-line summary. This is what everyone sees in the inbox.</div>
          </div>
        </div>

        {/* Spreadsheet import — only useful in structured mode */}
        {mode === "structured" && (
          <ImportFromSheet
            onImport={({ tickets: parsedTickets, fields: parsedFields }) => {
              setTicketsRaw(parsedTickets.join("\n"));
              setFields(parsedFields.length > 0 ? parsedFields : DEFAULT_FIELDS);
              show(`Imported ${parsedTickets.length} ticket${parsedTickets.length === 1 ? "" : "s"}`);
            }}
          />
        )}

        {/* Mode */}
        <div className="admin-card">
          <div className="admin-card-head"><h3 className="admin-card-title">How do you want to send it?</h3></div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className={`btn ${mode === "structured" ? "primary" : ""}`} onClick={() => setMode("structured")}>
              Structured form
            </button>
            <button className={`btn ${mode === "freeform" ? "primary" : ""}`} onClick={() => setMode("freeform")}>
              Freeform message
            </button>
          </div>

          {mode === "structured" ? (
            <>
              {/* Tickets */}
              <div className="form-group">
                <label className="form-label">Ticket IDs</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 60, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}
                  value={ticketsRaw}
                  onChange={e => setTicketsRaw(e.target.value)}
                  placeholder="Paste 12-digit ticket IDs. Commas, spaces, or even all-run-together work — the system will pick them out."
                />
                <div className="form-hint">
                  {tickets.length === 0
                    ? "No tickets detected yet. We look for any 12-digit number in your input."
                    : <>Detected <b style={{ color: "var(--text-dark)" }}>{tickets.length}</b> ticket{tickets.length === 1 ? "" : "s"}.</>}
                </div>
                {tickets.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {tickets.map(t => (
                      <span key={t} className="ticket-chip">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-hint" style={{ marginBottom: 12, marginTop: 4 }}>
                Add fields below. Each field can apply to <b>all</b> tickets or just specific ones — handy when remarks or AWBs differ per ticket.
              </div>

              {fields.map((f, i) => (
                <div key={f.key} className="field-builder">
                  <div className="field-builder-row">
                    <div className="form-group" style={{ marginBottom: 0, flex: "0 0 220px" }}>
                      <label className="form-label">Field label</label>
                      <input
                        className="form-input"
                        value={f.label}
                        onChange={e => updateField(i, "label", e.target.value)}
                        placeholder="e.g. AWB Numbers"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <label className="form-label">Value</label>
                      <textarea
                        className="form-textarea"
                        style={{ minHeight: 40 }}
                        value={f.value}
                        onChange={e => updateField(i, "value", e.target.value)}
                        placeholder={f.label === "AWB Numbers" ? "166274992, 166274993, …" : ""}
                      />
                    </div>
                    <button
                      className="btn small danger"
                      style={{ height: 36, alignSelf: "flex-end" }}
                      onClick={() => removeField(i)}
                      title="Remove field"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  <div className="field-builder-scope">
                    <div className="form-label" style={{ margin: 0, marginRight: 6 }}>Applies to</div>
                    <button
                      type="button"
                      className={`scope-pill ${(f.applies_to || ["all"]).includes("all") ? "active" : ""}`}
                      onClick={() => toggleAppliesTo(i, "all")}
                    >
                      {(f.applies_to || ["all"]).includes("all") && <CheckCircle2 size={11} />}
                      All tickets
                    </button>
                    {tickets.map(t => {
                      const selected = (f.applies_to || []).includes(t);
                      return (
                        <button
                          type="button"
                          key={t}
                          className={`scope-pill mono ${selected ? "active" : ""}`}
                          onClick={() => toggleAppliesTo(i, t)}
                        >
                          {selected && <CheckCircle2 size={11} />}
                          {t}
                        </button>
                      );
                    })}
                    {tickets.length === 0 && (
                      <span style={{ fontSize: 11.5, color: "var(--text-dark-mute)", fontStyle: "italic" }}>
                        Add ticket IDs above to scope this field to specific tickets.
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <button className="btn small" onClick={addField} style={{ marginTop: 4 }}>
                <Plus size={11} /> Add field
              </button>

              <div className="form-group" style={{ marginTop: 18 }}>
                <label className="form-label">Receiver's response field label</label>
                <input className="form-input" value={receiverFieldLabel} onChange={e => setReceiverFieldLabel(e.target.value)} />
                <div className="form-hint">What do you want them to fill in? e.g. "Your remarks", "Resolution".</div>
              </div>
            </>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Message *</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 140 }}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Describe your dependency…"
              />
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Attachments</h3>
            <label className="btn small" style={{ cursor: "pointer" }}>
              <Paperclip size={11} /> Add files
              <input type="file" multiple onChange={onFilesPicked} style={{ display: "none" }} />
            </label>
          </div>
          {attachments.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--text-dark-mute)" }}>
              Attach screenshots, scan exports, or any supporting files. Optional.
            </div>
          ) : (
            <div className="attachments-list">
              {attachments.map(a => (
                <div key={a.id} className="attachment-row">
                  <FileText size={14} style={{ color: "var(--text-dark-mute)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dark-mute)", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {(a.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button className="btn small danger" onClick={() => removeAttachment(a.id)}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TAT */}
        <div className="admin-card">
          <div className="admin-card-head"><h3 className="admin-card-title">By when do you need this?</h3></div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {TAT_PRESETS.map(p => (
              <button
                key={p.hours}
                className={`btn ${tatMode === "preset" && tatHours === p.hours ? "primary" : ""}`}
                onClick={() => { setTatMode("preset"); setTatHours(p.hours); }}
              >
                {p.label}
              </button>
            ))}
            <button className={`btn ${tatMode === "custom" ? "primary" : ""}`} onClick={() => setTatMode("custom")}>
              Custom
            </button>
          </div>
          {tatMode === "custom" && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hours</label>
              <input
                type="number"
                className="form-input"
                style={{ maxWidth: 200 }}
                value={customTat}
                onChange={e => setCustomTat(e.target.value)}
                placeholder="e.g. 6"
              />
            </div>
          )}
          <div className="form-hint" style={{ marginTop: 10 }}>
            Deadline will be in <b style={{ color: "var(--text-dark)" }}>{effectiveTat}h</b> from now.
            {effectiveTat <= 8 && " ⚡ Tight — make sure the receiver has bandwidth."}
          </div>
        </div>

        {/* Visibility */}
        <div className="admin-card">
          <div className="admin-card-head"><h3 className="admin-card-title">Who can see this?</h3></div>
          <div style={{ fontSize: 13, color: "var(--text-dark-mute)", marginBottom: 12 }}>
            By default, the sender, receiver, and both their managers. Add more viewers if needed.
          </div>
          <div style={{ marginBottom: 14 }}>
            <div className="form-label">Auto-cc'd</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              <span className="viewer-chip me">You (sender)</span>
              {receiver && <span className="viewer-chip">{receiver.name} (receiver)</span>}
              {receiverMgr && <span className="viewer-chip mgr">{receiverMgr.name} (their manager)</span>}
              {myMgr && <span className="viewer-chip mgr">{myMgr.name} (your manager)</span>}
            </div>
          </div>
          <div>
            <div className="form-label">Add extra viewers (optional)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {viewerCandidates.map(p => {
                const selected = extraViewers.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`team-pill ${selected ? "active" : ""}`}
                    onClick={() => toggleExtraViewer(p.id)}
                  >
                    {selected && <CheckCircle2 size={11} />}
                    {p.name}
                    <span style={{ fontSize: 10, color: "var(--text-dark-mute)", marginLeft: 3 }}>· {p.role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button className="btn ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn primary accent" onClick={submit}>
            <Send size={13} /> Send alignment
          </button>
        </div>
      </div>
    </div>
  );
}
