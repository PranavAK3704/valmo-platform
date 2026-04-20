import React, { useState, useMemo } from "react";
import { Plus, Copy, Edit3, Trash2, Upload, AlertTriangle } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../components/Toast";

export default function TemplatesAdmin() {
  const { templates, sops, saveTemplate, removeTemplate, bulkTemplates } = useData();
  const { show } = useToast();
  const [editing, setEditing] = useState(null); // template id or "new"
  const [draft, setDraft] = useState({ id: "", name: "", subject: "", body: "" });
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  const templateMap = useMemo(() => {
    const m = {};
    templates.forEach(t => { m[t.id] = t; });
    return m;
  }, [templates]);

  const usageCount = useMemo(() => {
    const counts = {};
    sops.forEach(s => (s.scenarios || []).forEach(sc => {
      if (sc.template_id) counts[sc.template_id] = (counts[sc.template_id] || 0) + 1;
    }));
    return counts;
  }, [sops]);

  const unmapped = useMemo(() => {
    const needed = new Set();
    sops.forEach(s => (s.scenarios || []).forEach(sc => {
      if (sc.template_id && !templateMap[sc.template_id]) needed.add(sc.template_id);
    }));
    return Array.from(needed);
  }, [sops, templateMap]);

  const startEdit = (id) => {
    if (id === "new") {
      setDraft({ id: "", name: "", subject: "", body: "" });
    } else {
      setDraft({ ...templateMap[id] });
    }
    setEditing(id);
  };

  const saveDraft = async () => {
    if (!draft.id.trim() || !draft.name.trim()) { alert("ID and name are required"); return; }
    await saveTemplate({ ...draft });
    show("Template saved");
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete template "${id}"?`)) return;
    await removeTemplate(id);
    show("Template deleted");
  };

  const importPasted = async () => {
    const lines = paste.split("\n").filter(l => l.trim());
    if (!lines.length) return;
    const parsed = [];
    for (const line of lines) {
      const parts = line.split("\t").length > 1 ? line.split("\t") : line.split(",");
      if (parts.length < 2) continue;
      const [id, name, subject, ...bodyParts] = parts.map(p => p.trim());
      if (!id || !name) continue;
      parsed.push({ id, name, subject: subject || "", body: bodyParts.join(",").replace(/\\n/g, "\n") });
    }
    if (!parsed.length) { alert("Couldn't parse any rows."); return; }
    await bulkTemplates(parsed);
    show(`Imported ${parsed.length} templates`);
    setPaste("");
    setShowPaste(false);
  };

  const copyTemplate = (tpl) => {
    navigator.clipboard.writeText(tpl.subject ? `Subject: ${tpl.subject}\n\n${tpl.body}` : tpl.body);
    show("Copied");
  };

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <div className="page-header">
          <div className="page-crumb">Admin · Templates</div>
          <h1 className="page-title">Response <em>templates</em></h1>
          <p className="page-subtitle">
            Templates are the exact replies agents send to captains. Each one is mapped to a scenario via its ID.
            Add new templates, edit existing ones, or paste a CSV/TSV export from your template sheet.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button className="btn primary" onClick={() => startEdit("new")}><Plus size={13} /> New template</button>
          <button className="btn" onClick={() => setShowPaste(!showPaste)}><Upload size={13} /> Paste from sheet</button>
        </div>

        {showPaste && (
          <div className="admin-card">
            <div className="admin-card-head"><h3 className="admin-card-title">Paste template data</h3></div>
            <div className="form-hint" style={{ marginBottom: 10 }}>
              Paste rows: <code>id[TAB]name[TAB]subject[TAB]body</code>. Use <code>\n</code> for line breaks.
            </div>
            <textarea
              className="form-textarea"
              style={{ minHeight: 140, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}
              value={paste}
              onChange={e => setPaste(e.target.value)}
              placeholder={`tpl_example\tMy template\tSubject line\tBody line 1\\nBody line 2`}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn primary" onClick={importPasted}>Import</button>
              <button className="btn ghost" onClick={() => { setPaste(""); setShowPaste(false); }}>Cancel</button>
            </div>
          </div>
        )}

        {editing && (
          <div className="admin-card">
            <div className="admin-card-head">
              <h3 className="admin-card-title">{editing === "new" ? "New template" : `Edit: ${draft.id}`}</h3>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Template ID *</label>
                <input className="form-input" value={draft.id} onChange={e => setDraft({ ...draft, id: e.target.value })} disabled={editing !== "new"} placeholder="tpl_something" />
              </div>
              <div className="form-group">
                <label className="form-label">Template name *</label>
                <input className="form-input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-input" value={draft.subject} onChange={e => setDraft({ ...draft, subject: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Body *</label>
              <textarea className="form-textarea" style={{ minHeight: 160 }} value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} />
              <div className="form-hint">Use [PLACEHOLDERS] for dynamic fields.</div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn primary" onClick={saveDraft}>Save</button>
            </div>
          </div>
        )}

        {unmapped.length > 0 && (
          <div className="admin-card" style={{ background: "var(--signal-softer)", borderColor: "#f3dca0" }}>
            <div className="admin-card-head"><h3 className="admin-card-title"><AlertTriangle size={14} style={{ verticalAlign: -2 }} /> Missing templates ({unmapped.length})</h3></div>
            <div className="form-hint" style={{ marginBottom: 10 }}>
              These template IDs are referenced by scenarios but don't exist yet.
            </div>
            {unmapped.map(id => (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3dca0" }}>
                <code>{id}</code>
                <button className="btn small primary" onClick={() => { setDraft({ id, name: "", subject: "", body: "" }); setEditing("new"); }}>Create</button>
              </div>
            ))}
          </div>
        )}

        <div className="section">
          <div className="section-head">
            <span className="section-num">·</span>
            <h2 className="section-title">All templates <span style={{ color: "var(--text-dark-mute)", fontWeight: 400 }}>· {templates.length}</span></h2>
          </div>
          <div className="tpl-list">
            {templates.map(tpl => (
              <div key={tpl.id} className="tpl-row">
                <div className="tpl-row-main">
                  <div className="name">{tpl.name}</div>
                  <div className="id">{tpl.id}</div>
                  {tpl.subject && <div className="subject">Subject: {tpl.subject}</div>}
                </div>
                <div className="tpl-row-usage">
                  USED IN <span className="n">{usageCount[tpl.id] || 0}</span> SCENARIO{(usageCount[tpl.id] || 0) === 1 ? "" : "S"}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn small" onClick={() => copyTemplate(tpl)}><Copy size={11} /></button>
                  <button className="btn small" onClick={() => startEdit(tpl.id)}><Edit3 size={11} /></button>
                  <button className="btn small danger" onClick={() => handleDelete(tpl.id)}><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
