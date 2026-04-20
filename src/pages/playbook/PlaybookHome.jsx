import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Building2, ChevronRight } from "lucide-react";
import { useData } from "../../context/DataContext";

export default function PlaybookHome() {
  const { sops, teams } = useData();
  const navigate = useNavigate();

  // Group by team, then by category
  const byTeam = {};
  sops.forEach(s => {
    const t = teams.find(x => x.id === s.team_id);
    const teamName = t?.name || "Uncategorized";
    if (!byTeam[teamName]) byTeam[teamName] = { team: t, byCat: {} };
    const cat = s.category || "General";
    if (!byTeam[teamName].byCat[cat]) byTeam[teamName].byCat[cat] = [];
    byTeam[teamName].byCat[cat].push(s);
  });

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <div className="page-header">
          <div className="page-crumb">Playbook</div>
          <h1 className="page-title">The Valmo <em>Partner Support</em> playbook</h1>
          <p className="page-subtitle">
            SOPs for every scenario agents handle on captain tickets. Pick one on the left, or browse the index below.
          </p>
        </div>

        {Object.entries(byTeam).map(([teamName, { team, byCat }]) => (
          <div key={teamName} className="section">
            <div className="section-head">
              <span className="section-num"><Building2 size={12} /></span>
              <h2 className="section-title">{teamName}</h2>
              {team?.description && (
                <span style={{ marginLeft: 12, fontSize: 13, color: "var(--text-dark-mute)" }}>
                  {team.description}
                </span>
              )}
            </div>
            {Object.entries(byCat).map(([cat, list]) => (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-dark-mute)", marginBottom: 8 }}>
                  {cat}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
                  {list.map(s => (
                    <div
                      key={s.id}
                      className="card card-hover"
                      onClick={() => navigate(`/playbook/${s.id}`)}
                      style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: "var(--text-dark)", fontSize: 13.5 }}>{s.problem_theme}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dark-mute)", marginTop: 3, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.04em" }}>
                          {s.scenarios?.length || 0} scenarios · Queue {s.queue}
                          {s.tat_hours && ` · ${s.tat_hours}h TAT`}
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: "var(--text-dark-faint)" }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
