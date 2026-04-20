import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, X, CheckCircle2 } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";

export default function AddSopForm() {
  const navigate = useNavigate();
  const { saveSop, teams, sops } = useData();
  const { user } = useAuth();
  const { show } = useToast();

  const existingCategories = Array.from(new Set(sops.map(s => s.category))).filter(Boolean);

  const [form, setForm] = useState({
    problem_theme: "",
    team_id: user?.team_id || teams[0]?.id || "",
    category: existingCategories[0] || "",
    custom_category: "",
    queue: "",
    tat_hours: "",
    intent: "",
    summary: "",
    trigger_keywords: [],
    required_inputs: [],
    preprocessing_notes: [],
    rule_facts: [],
    data_sources: [],
    scenarios: [],
    guardrails: []
  });
  const [keywordDraft, setKeywordDraft] = useState("");

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const addKeyword = () => {
    const kw = keywordDraft.trim();
    if (!kw) return;
    update("trigger_keywords", [...form.trigger_keywords, kw]);
    setKeywordDraft("");
  };

  const addScenario = () => update("scenarios", [...form.scenarios, {
    id: `SC_${form.scenarios.length + 1}`, label: "", conditions: [""], decision: "respond", decision_level: "", response: "", template_id: ""
  }]);
  const updateScenario = (i, k, v) => {
    const next = [...form.scenarios];
    next[i] = { ...next[i], [k]: v };
    update("scenarios", next);
  };
  const removeScenario = (i) => update("scenarios", form.scenarios.filter((_, idx) => idx !== i));

  const addInput = () => update("required_inputs", [...form.required_inputs, { field: "", label: "", required: true }]);
  const updateInput = (i, k, v) => {
    const next = [...form.required_inputs];
    next[i] = { ...next[i], [k]: v };
    update("required_inputs", next);
  };
  const removeInput = (i) => update("required_inputs", form.required_inputs.filter((_, idx) => idx !== i));

  const addDS = () => update("data_sources", [...form.data_sources, { label: "", url: "" }]);
  const updateDS = (i, k, v) => {
    const next = [...form.data_sources];
    next[i] = { ...next[i], [k]: v };
    update("data_sources", next);
  };
  const removeDS = (i) => update("data_sources", form.data_sources.filter((_, idx) => idx !== i));

  const addNote = () => update("preprocessing_notes", [...form.preprocessing_notes, ""]);
  const updateNote = (i, v) => {
    const next = [...form.preprocessing_notes]; next[i] = v;
    update("preprocessing_notes", next);
  };
  const removeNote = (i) => update("preprocessing_notes", form.preprocessing_notes.filter((_, idx) => idx !== i));

  const addRule = () => update("rule_facts", [...form.rule_facts, ""]);
  const updateRule = (i, v) => { const next = [...form.rule_facts]; next[i] = v; update("rule_facts", next); };
  const removeRule = (i) => update("rule_facts", form.rule_facts.filter((_, idx) => idx !== i));

  const addGuardrail = () => update("guardrails", [...form.guardrails, ""]);
  const updateGuardrail = (i, v) => { const next = [...form.guardrails]; next[i] = v; update("guardrails", next); };
  const removeGuardrail = (i) => update("guardrails", form.guardrails.filter((_, idx) => idx !== i));

  const updateScenarioCondition = (si, ci, v) => {
    const next = [...form.scenarios];
    const cns = [...next[si].conditions];
    cns[ci] = v;
    next[si] = { ...next[si], conditions: cns };
    update("scenarios", next);
  };
  const addCondition = (si) => {
    const next = [...form.scenarios];
    next[si] = { ...next[si], conditions: [...next[si].conditions, ""] };
    update("scenarios", next);
  };
  const removeCondition = (si, ci) => {
    const next = [...form.scenarios];
    next[si] = { ...next[si], conditions: next[si].conditions.filter((_, i) => i !== ci) };
    update("scenarios", next);
  };

  const submit = async () => {
    if (!form.problem_theme.trim()) { alert("Problem theme is required"); return; }
    if (!form.summary.trim()) { alert("Summary is required"); return; }
    if (!form.team_id) { alert("Team is required"); return; }
    const category = form.custom_category.trim() || form.category;
    if (!category) { alert("Category is required"); return; }

    const sop = {
      id: `sop_${form.problem_theme.toLowerCase().replace(/[^a-z0-9]+/g, "_").substring(0, 40)}_${Date.now().toString(36).slice(-4)}`,
      team_id: form.team_id,
      problem_theme: form.problem_theme.trim(),
      category,
      queue: form.queue.trim() || "—",
      tat_hours: form.tat_hours ? parseInt(form.tat_hours, 10) : null,
      intent: form.intent.trim(),
      summary: form.summary.trim(),
      trigger_keywords: form.trigger_keywords,
      required_inputs: form.required_inputs.filter(x => x.label.trim()),
      preprocessing_notes: form.preprocessing_notes.filter(n => n.trim()),
      rule_facts: form.rule_facts.filter(r => r.trim()),
      data_sources: form.data_sources.filter(d => d.label.trim()),
      scenarios: form.scenarios.filter(s => s.label.trim()).map(s => ({
        ...s,
        conditions: s.conditions.filter(c => c.trim())
      })),
      guardrails: form.guardrails.filter(g => g.trim())
    };
    await saveSop(sop);
    show("SOP created");
    navigate(`/playbook/${sop.id}`);
  };

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <div className="page-header">
          <div className="page-crumb">Admin · New Entry</div>
          <h1 className="page-title">Add a new <em>SOP</em></h1>
          <p className="page-subtitle">Build a structured SOP. Agents will see each section as a clear, numbered step in their playbook.</p>
        </div>

        {/* Basics */}
        <div className="admin-card">
          <div className="admin-card-head"><h3 className="admin-card-title">Basics</h3></div>
          <div className="form-group">
            <label className="form-label">Problem theme *</label>
            <input className="form-input" value={form.problem_theme} onChange={e => update("problem_theme", e.target.value)} placeholder="e.g. Hardstop Loss" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Team *</label>
              <select className="form-select" value={form.team_id} onChange={e => update("team_id", e.target.value)}>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Queue</label>
              <input className="form-input" value={form.queue} onChange={e => update("queue", e.target.value)} placeholder="e.g. W- LD, M_V, C_V" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category} onChange={e => update("category", e.target.value)}>
                <option value="">— pick or add new —</option>
                {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="form-input" style={{ marginTop: 6 }} value={form.custom_category} onChange={e => update("custom_category", e.target.value)} placeholder="Or type a new category" />
            </div>
            <div className="form-group">
              <label className="form-label">TAT (hours)</label>
              <input className="form-input" type="number" value={form.tat_hours} onChange={e => update("tat_hours", e.target.value)} placeholder="e.g. 72" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Intent (one-line)</label>
            <input className="form-input" value={form.intent} onChange={e => update("intent", e.target.value)} placeholder="e.g. Captain contests loss marking" />
          </div>
          <div className="form-group">
            <label className="form-label">Summary *</label>
            <textarea className="form-textarea" value={form.summary} onChange={e => update("summary", e.target.value)} placeholder="A short, plain-English description the agent reads first." />
          </div>
          <div className="form-group">
            <label className="form-label">Trigger keywords</label>
            <div className="chip-input">
              {form.trigger_keywords.map((k, i) => (
                <span key={i} className="chip">
                  {k}
                  <button onClick={() => update("trigger_keywords", form.trigger_keywords.filter((_, idx) => idx !== i))}><X size={11} /></button>
                </span>
              ))}
              <input
                value={keywordDraft}
                onChange={e => setKeywordDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                placeholder="Type and press Enter"
              />
            </div>
          </div>
        </div>

        {/* Required inputs */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Required inputs from captain</h3>
            <button className="btn small" onClick={addInput}><Plus size={11} /> Add</button>
          </div>
          {form.required_inputs.length === 0 && <div className="form-hint">No required inputs yet.</div>}
          {form.required_inputs.map((inp, i) => (
            <div key={i} className="form-row-3" style={{ alignItems: "end", marginBottom: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Label</label>
                <input className="form-input" value={inp.label} onChange={e => updateInput(i, "label", e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Field key</label>
                <input className="form-input" value={inp.field} onChange={e => updateInput(i, "field", e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, display: "flex", alignItems: "end", gap: 6 }}>
                <select className="form-select" value={inp.required ? "y" : "n"} onChange={e => updateInput(i, "required", e.target.value === "y")}>
                  <option value="y">Required</option>
                  <option value="n">Optional</option>
                </select>
                <button className="btn small danger" onClick={() => removeInput(i)}><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Preprocessing */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Preprocessing notes</h3>
            <button className="btn small" onClick={addNote}><Plus size={11} /> Add</button>
          </div>
          {form.preprocessing_notes.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <textarea className="form-textarea" value={n} onChange={e => updateNote(i, e.target.value)} style={{ flex: 1 }} />
              <button className="btn small danger" onClick={() => removeNote(i)}><Trash2 size={11} /></button>
            </div>
          ))}
        </div>

        {/* Rules */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Rules to remember</h3>
            <button className="btn small" onClick={addRule}><Plus size={11} /> Add</button>
          </div>
          {form.rule_facts.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <textarea className="form-textarea" value={r} onChange={e => updateRule(i, e.target.value)} style={{ flex: 1 }} />
              <button className="btn small danger" onClick={() => removeRule(i)}><Trash2 size={11} /></button>
            </div>
          ))}
        </div>

        {/* Data sources */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Data sources & tools</h3>
            <button className="btn small" onClick={addDS}><Plus size={11} /> Add</button>
          </div>
          {form.data_sources.map((d, i) => (
            <div key={i} className="form-row" style={{ alignItems: "end", marginBottom: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Label</label>
                <input className="form-input" value={d.label} onChange={e => updateDS(i, "label", e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, display: "flex", gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">URL</label>
                  <input className="form-input" value={d.url} onChange={e => updateDS(i, "url", e.target.value)} />
                </div>
                <button className="btn small danger" style={{ height: 36, marginBottom: 0 }} onClick={() => removeDS(i)}><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Scenarios */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Scenarios (decision branches)</h3>
            <button className="btn small" onClick={addScenario}><Plus size={11} /> Add scenario</button>
          </div>
          {form.scenarios.length === 0 && <div className="form-hint">Add at least one scenario.</div>}
          {form.scenarios.map((sc, i) => (
            <div key={i} className="scenario-builder">
              <div className="scenario-builder-head">
                <h4>Scenario {i + 1}</h4>
                <button className="btn small danger" style={{ marginLeft: "auto" }} onClick={() => removeScenario(i)}><Trash2 size={11} /></button>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Scenario ID</label>
                  <input className="form-input" value={sc.id} onChange={e => updateScenario(i, "id", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Decision</label>
                  <select className="form-select" value={sc.decision} onChange={e => updateScenario(i, "decision", e.target.value)}>
                    <option value="respond">Respond (close ticket)</option>
                    <option value="escalate">Escalate to L2/L3</option>
                    <option value="reject">Reject / no reversal</option>
                    <option value="redirect_tech">Redirect to Tech team</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Label</label>
                <input className="form-input" value={sc.label} onChange={e => updateScenario(i, "label", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Conditions</label>
                {sc.conditions.map((c, ci) => (
                  <div key={ci} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input className="form-input" value={c} onChange={e => updateScenarioCondition(i, ci, e.target.value)} />
                    <button className="btn small danger" onClick={() => removeCondition(i, ci)}><X size={11} /></button>
                  </div>
                ))}
                <button className="btn small ghost" onClick={() => addCondition(i)}><Plus size={11} /> Add condition</button>
              </div>
              {sc.decision === "escalate" && (
                <div className="form-group">
                  <label className="form-label">Escalation level</label>
                  <select className="form-select" value={sc.decision_level || ""} onChange={e => updateScenario(i, "decision_level", e.target.value)}>
                    <option value="">—</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Response summary</label>
                <textarea className="form-textarea" value={sc.response} onChange={e => updateScenario(i, "response", e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Template ID</label>
                <input className="form-input" value={sc.template_id} onChange={e => updateScenario(i, "template_id", e.target.value)} placeholder="e.g. tpl_hardstop_reversal" />
              </div>
            </div>
          ))}
        </div>

        {/* Guardrails */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Guardrails</h3>
            <button className="btn small" onClick={addGuardrail}><Plus size={11} /> Add</button>
          </div>
          {form.guardrails.map((g, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <textarea className="form-textarea" value={g} onChange={e => updateGuardrail(i, e.target.value)} style={{ flex: 1 }} />
              <button className="btn small danger" onClick={() => removeGuardrail(i)}><Trash2 size={11} /></button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button className="btn ghost" onClick={() => navigate("/playbook")}>Cancel</button>
          <button className="btn primary" onClick={submit}><CheckCircle2 size={13} /> Save SOP</button>
        </div>
      </div>
    </div>
  );
}
