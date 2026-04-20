import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Inbox, Layers, CheckCircle2, Trash2, Copy, ChevronRight, ExternalLink, Zap, AlertTriangle } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";
import { can, decisionLabel } from "../../components/helpers";

export default function SopDetail() {
  const { sopId } = useParams();
  const navigate = useNavigate();
  const { sops, templates, teams, removeSop } = useData();
  const { user } = useAuth();
  const { show } = useToast();

  const sop = sops.find(s => s.id === sopId);
  const team = sop ? teams.find(t => t.id === sop.team_id) : null;
  const templateMap = React.useMemo(() => {
    const m = {};
    templates.forEach(t => { m[t.id] = t; });
    return m;
  }, [templates]);

  const [openScenarios, setOpenScenarios] = useState(new Set());
  const [checkedInputs, setCheckedInputs] = useState(new Set());

  useEffect(() => {
    setOpenScenarios(new Set());
    setCheckedInputs(new Set());
  }, [sopId]);

  if (!sop) {
    return (
      <div className="content on-paper">
        <div className="content-inner">
          <div className="global-empty">
            <AlertTriangle size={36} />
            <h3>SOP not found</h3>
            <p>This SOP may have been deleted. Pick another from the left.</p>
          </div>
        </div>
      </div>
    );
  }

  const toggleScenario = (id) => {
    const next = new Set(openScenarios);
    if (next.has(id)) next.delete(id); else next.add(id);
    setOpenScenarios(next);
  };
  const toggleInput = (field) => {
    const next = new Set(checkedInputs);
    if (next.has(field)) next.delete(field); else next.add(field);
    setCheckedInputs(next);
  };

  const copyTemplate = (tpl) => {
    const text = tpl.subject ? `Subject: ${tpl.subject}\n\n${tpl.body}` : tpl.body;
    navigator.clipboard.writeText(text);
    show("Copied to clipboard");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this SOP? This cannot be undone.")) return;
    await removeSop(sop.id);
    show("SOP deleted");
    navigate("/playbook");
  };

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <div className="page-header">
          <div className="page-crumb">
            {team?.name || "Playbook"} · {sop.category} · Queue {sop.queue}
          </div>
          <h1 className="page-title">{sop.problem_theme}</h1>
          <div className="page-meta">
            {sop.tat_hours && (
              <div className="meta-chip" style={{ color: "var(--text-dark)", fontWeight: 500 }}>
                <span style={{ width: 7, height: 7, background: "var(--signal)", borderRadius: "50%", display: "inline-block" }} />
                <Clock size={13} />
                <b>{sop.tat_hours}h</b> TAT
              </div>
            )}
            <div className="meta-chip"><Inbox size={13} /> {sop.scenarios?.length || 0} scenarios</div>
            <div className="meta-chip"><Layers size={13} /> intent: <b style={{ marginLeft: 4 }}>{sop.intent}</b></div>
            {can.editSops(user) && (
              <button className="btn small danger" style={{ marginLeft: "auto" }} onClick={handleDelete}>
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
          <p className="page-subtitle">{sop.summary}</p>
        </div>

        {/* Required inputs */}
        {sop.required_inputs && sop.required_inputs.length > 0 && (
          <div className="section">
            <div className="section-head">
              <span className="section-num">01</span>
              <h2 className="section-title">Required from captain</h2>
            </div>
            <div className="card">
              <div className="inputs-grid">
                {sop.required_inputs.map(inp => (
                  <div
                    key={inp.field}
                    className={`input-row ${checkedInputs.has(inp.field) ? "checked" : ""}`}
                    onClick={() => toggleInput(inp.field)}
                  >
                    <div className={`input-check ${checkedInputs.has(inp.field) ? "checked" : ""}`}>
                      {checkedInputs.has(inp.field) && <CheckCircle2 size={13} color="white" />}
                    </div>
                    <span>{inp.label}</span>
                    {inp.required ? <span className="req">required</span> : <span className="opt">optional</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preprocessing notes */}
        {sop.preprocessing_notes && sop.preprocessing_notes.length > 0 && (
          <div className="section">
            <div className="section-head">
              <span className="section-num">02</span>
              <h2 className="section-title">Before you start</h2>
            </div>
            {sop.preprocessing_notes.map((n, i) => (
              <div key={i} className="note"><b>Note.</b> {n}</div>
            ))}
          </div>
        )}

        {/* Rule facts */}
        {sop.rule_facts && sop.rule_facts.length > 0 && (
          <div className="section">
            <div className="section-head">
              <span className="section-num">03</span>
              <h2 className="section-title">Rules to remember</h2>
            </div>
            <div className="rules">
              {sop.rule_facts.map((r, i) => (
                <div key={i} className="rule">
                  <span className="rule-num">R.{String(i + 1).padStart(2, "0")}</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data sources */}
        {sop.data_sources && sop.data_sources.length > 0 && (
          <div className="section">
            <div className="section-head">
              <span className="section-num">04</span>
              <h2 className="section-title">Data sources & tools</h2>
            </div>
            <div className="data-links">
              {sop.data_sources.map((d, i) => (
                <a key={i} className="data-link" href={d.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                  <span>{d.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Scenarios */}
        {sop.scenarios && sop.scenarios.length > 0 && (
          <div className="section">
            <div className="section-head">
              <span className="section-num">05</span>
              <h2 className="section-title">Scenarios & decisions</h2>
            </div>
            <div className="scenarios-intro">
              <Zap size={13} /> Pick the scenario that matches the ticket. Click to expand the flow.
            </div>
            <div className="scenarios">
              {sop.scenarios.map(sc => {
                const tpl = sc.template_id ? templateMap[sc.template_id] : null;
                const isOpen = openScenarios.has(sc.id);
                return (
                  <div key={sc.id} className={`scenario ${isOpen ? "open" : ""}`}>
                    <div className="scenario-head" onClick={() => toggleScenario(sc.id)}>
                      <span className="scenario-id">{sc.id}</span>
                      <span className="scenario-label">{sc.label}</span>
                      <span className={`scenario-decision decision-${sc.decision}`}>
                        {decisionLabel(sc.decision)}
                        {sc.decision_level && <> · {sc.decision_level}</>}
                      </span>
                      <ChevronRight size={16} className="scenario-chev" />
                    </div>
                    <div className="scenario-body">
                      <div className="flow">
                        <div className="flow-step">
                          <div className="flow-step-marker">
                            <div className="flow-step-num">1</div>
                            <div className="flow-step-line" />
                          </div>
                          <div>
                            <div className="flow-step-label">Check these conditions</div>
                            <div className="flow-step-content">
                              {sc.conditions.map((c, i) => (
                                <span key={i} className="cond">{c}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flow-step">
                          <div className="flow-step-marker">
                            <div className="flow-step-num">2</div>
                            <div className="flow-step-line" />
                          </div>
                          <div>
                            <div className="flow-step-label">Decision</div>
                            <div className={`decision-card decision-${sc.decision}`}>
                              <b>{decisionLabel(sc.decision)}</b>
                              {sc.decision_level && <span className="lvl">{sc.decision_level}</span>}
                              <div style={{ marginTop: 6 }}>{sc.response}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flow-step">
                          <div className="flow-step-marker">
                            <div className="flow-step-num">3</div>
                          </div>
                          <div style={{ width: "100%" }}>
                            <div className="flow-step-label">Reply to captain</div>
                            {tpl ? (
                              <div className="template">
                                <div className="template-head">
                                  <span className="tag">Template</span>
                                  <span className="name">{tpl.name}</span>
                                  <CopyButton onClick={() => copyTemplate(tpl)} />
                                </div>
                                {tpl.subject && (
                                  <div className="template-subject"><b>Subject:</b>{tpl.subject}</div>
                                )}
                                <div className="template-body">{tpl.body}</div>
                              </div>
                            ) : (
                              <div className="no-template">
                                <AlertTriangle size={12} style={{ verticalAlign: -2, marginRight: 6 }} />
                                No template mapped yet for this scenario.
                                {can.editTemplates(user) && " Add one in Templates."}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Guardrails */}
        {sop.guardrails && sop.guardrails.length > 0 && (
          <div className="section">
            <div className="section-head">
              <span className="section-num">06</span>
              <h2 className="section-title">Guardrails & exceptions</h2>
            </div>
            <div className="guardrails">
              {sop.guardrails.map((g, i) => (
                <div key={i} className="guardrail">{g}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CopyButton({ onClick }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`copy ${copied ? "copied" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? <><CheckCircle2 size={11} /> Copied</> : <><Copy size={11} /> Copy reply</>}
    </button>
  );
}
