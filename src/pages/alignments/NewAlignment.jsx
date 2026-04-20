import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Send, CheckCircle2 } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";
import { getInitials, TAT_PRESETS } from "../../components/helpers";

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
  const [fields, setFields] = useState([
    { key: "ticket_ids", label: "Ticket IDs", value: "" },
    { key: "my_remarks", label: "My remarks", value: "" },
    { key: "what_i_need", label: "What I need from you", value: "" }
  ]);
  const [receiverFieldLabel, setReceiverFieldLabel] = useState("Your remarks / resolution");
  const [tatHours, setTatHours] = useState(24);
  const [customTat, setCustomTat] = useState("");
  const [tatMode, setTatMode] = useState("preset"); // preset | custom
  const [extraViewers, setExtraViewers] = useState([]);

  const receiver = people.find(p => p.id === receiverId);
  const receiverTeam = receiver ? teams.find(t => t.id === receiver.team_id) : null;
  const receiverMgr = receiver ? people.find(p => p.team_id === receiver.team_id && p.role === "manager") : null;
  const myMgr = user ? people.find(p => p.team_id === user.team_id && p.role === "manager") : null;

  const autoCcIds = [receiverMgr, myMgr].filter(Boolean).map(p => p.id);

  // Candidates for extra viewers (not already cc'd, not sender/receiver)
  const viewerCandidates = people.filter(p =>
    p.id !== user?.person_id &&
    p.id !== receiverId &&
    !autoCcIds.includes(p.id) &&
    p.role !== "l1"
  );

  const toggleExtraViewer = (id) => {
    setExtraViewers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addField = () => setFields([...fields, { key: `field_${fields.length + 1}`, label: "", value: "" }]);
  const updateField = (i, k, v) => {
    const next = [...fields]; next[i] = { ...next[i], [k]: v }; setFields(next);
  };
  const removeField = (i) => setFields(fields.filter((_, idx) => idx !== i));

  const effectiveTat = tatMode === "custom" ? (parseFloat(customTat) || 24) : tatHours;

  const submit = async () => {
    if (!title.trim()) { alert("Title is required"); return; }
    if (!receiverId) { alert("Pick a receiver"); return; }
    if (mode === "freeform" && !body.trim()) { alert("Add a message body"); return; }
    if (mode === "structured" && fields.filter(f => f.label.trim() && f.value.trim()).length === 0) {
      alert("Fill in at least one field");
      return;
    }

    const now = Date.now();
    const alignment = {
      id: `al_${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      mode,
      sender_id: user.person_id,
      receiver_id: receiverId,
      cc_ids: autoCcIds,
      extra_viewers: extraViewers,
      structured_fields: mode === "structured" ? fields.filter(f => f.label.trim()) : [],
      receiver_field_label: mode === "structured" ? receiverFieldLabel : "",
      body: mode === "freeform" ? body.trim() : "",
      attachments: [],
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
              <div className="form-hint" style={{ marginBottom: 12 }}>
                Custom fields for your request. The receiver responds in the "resolution" field at the bottom.
              </div>
              {fields.map((f, i) => (
                <div key={i} className="form-row" style={{ alignItems: "end", marginBottom: 10 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Field label</label>
                    <input className="form-input" value={f.label} onChange={e => updateField(i, "label", e.target.value)} placeholder="e.g. AWB Numbers" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, display: "flex", gap: 6 }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Value</label>
                      <textarea className="form-textarea" style={{ minHeight: 40 }} value={f.value} onChange={e => updateField(i, "value", e.target.value)} />
                    </div>
                    <button className="btn small danger" style={{ height: 36, alignSelf: "flex-end" }} onClick={() => removeField(i)}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn small" onClick={addField}><Plus size={11} /> Add field</button>
              <div className="form-group" style={{ marginTop: 16 }}>
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
