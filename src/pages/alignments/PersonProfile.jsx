import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mail, Plus, ArrowLeft, Clock } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { getInitials, formatTAT, formatRelativeTime } from "../../components/helpers";

export default function PersonProfile() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { people, teams, alignments } = useData();
  const { user } = useAuth();

  const person = people.find(p => p.id === personId);
  if (!person) return <div className="content on-paper"><div className="content-inner"><div className="global-empty"><h3>Person not found</h3></div></div></div>;

  const team = teams.find(t => t.id === person.team_id);

  // Alignments between me and them
  const history = alignments
    .filter(a =>
      (a.sender_id === user?.person_id && a.receiver_id === person.id) ||
      (a.sender_id === person.id && a.receiver_id === user?.person_id)
    )
    .sort((a, b) => b.created_at - a.created_at);

  // Stats
  const sentByMe = history.filter(a => a.sender_id === user?.person_id);
  const avgResponseHours = sentByMe.filter(a => a.responded_at).length > 0
    ? sentByMe.filter(a => a.responded_at).reduce((acc, a) => acc + (a.responded_at - a.created_at) / (1000 * 60 * 60), 0) / sentByMe.filter(a => a.responded_at).length
    : null;

  const breachRate = sentByMe.length > 0
    ? Math.round(sentByMe.filter(a => {
        const tat = formatTAT(a.deadline_at, a.status, a.responded_at);
        return tat.band === "bad" || (a.responded_at && a.responded_at > a.deadline_at);
      }).length / sentByMe.length * 100)
    : null;

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <button className="btn ghost" style={{ marginBottom: 12 }} onClick={() => navigate("/alignments/directory")}>
          <ArrowLeft size={13} /> Back to directory
        </button>

        <div className="page-header">
          <div className="page-crumb">{team?.name}</div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 14 }}>
            <div className={`person-avatar ${person.role}`} style={{ width: 64, height: 64, fontSize: 22 }}>
              {getInitials(person.name)}
            </div>
            <div style={{ flex: 1 }}>
              <h1 className="page-title" style={{ margin: 0, fontSize: 32 }}>{person.name}</h1>
              <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className={`person-role-badge role-badge-${person.role}`}>{person.role}</span>
                <span style={{ fontSize: 13, color: "var(--text-dark-mute)" }}>
                  <Mail size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
                  {person.email}
                </span>
              </div>
            </div>
            {person.role === "poc" && person.id !== user?.person_id && (
              <button
                className="btn primary accent"
                onClick={() => navigate(`/alignments/new?to=${person.id}`)}
              >
                <Plus size={14} /> Align with {person.name}
              </button>
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-head">
            <span className="section-num">01</span>
            <h2 className="section-title">What they handle</h2>
          </div>
          <div className="card">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(person.handles || []).map((h, i) => (
                <span key={i} className="person-handle" style={{ fontSize: 12 }}>{h}</span>
              ))}
            </div>
          </div>
        </div>

        {person.role === "poc" && (
          <div className="section">
            <div className="section-head">
              <span className="section-num">02</span>
              <h2 className="section-title">Alignment stats</h2>
            </div>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-label">Total with you</div>
                <div className="stat-value">{history.length}</div>
                <div className="stat-sub">alignments sent both ways</div>
              </div>
              <div className="stat">
                <div className="stat-label">Avg response</div>
                <div className={`stat-value ${avgResponseHours && avgResponseHours > 24 ? "warn" : ""}`}>
                  {avgResponseHours !== null ? `${avgResponseHours.toFixed(1)}h` : "—"}
                </div>
                <div className="stat-sub">your requests → their response</div>
              </div>
              <div className="stat">
                <div className="stat-label">Breach rate</div>
                <div className={`stat-value ${breachRate > 30 ? "bad" : breachRate > 10 ? "warn" : "ok"}`}>
                  {breachRate !== null ? `${breachRate}%` : "—"}
                </div>
                <div className="stat-sub">missed TATs on your requests</div>
              </div>
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-head">
            <span className="section-num">03</span>
            <h2 className="section-title">History with {person.name}</h2>
          </div>
          {history.length === 0 ? (
            <div className="inpage-empty">
              <p>No alignments with {person.name} yet.</p>
            </div>
          ) : (
            <div className="alignment-list">
              {history.map(a => {
                const tat = formatTAT(a.deadline_at, a.status, a.responded_at);
                return (
                  <div
                    key={a.id}
                    className={`alignment-row ${tat.band === "bad" ? "breached" : tat.band === "warn" ? "warn" : ""} ${a.status === "closed" ? "closed" : ""}`}
                    onClick={() => navigate(`/alignments/${a.id}`)}
                  >
                    <span className={`alignment-status status-${a.status}`}>{a.status}</span>
                    <div className="alignment-main">
                      <div className="alignment-title">{a.title}</div>
                      <div className="alignment-sub">
                        {a.sender_id === user?.person_id ? "→ sent" : "← received"} · {formatRelativeTime(a.created_at)}
                      </div>
                    </div>
                    <span className={`tat-chip ${tat.band}`}>
                      <Clock size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                      {tat.text}
                    </span>
                    <div style={{ width: 14 }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
