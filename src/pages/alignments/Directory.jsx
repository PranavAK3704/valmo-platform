import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../components/helpers";

export default function Directory() {
  const { people, teams } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teamFilter, setTeamFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = people.filter(p => {
    // Hide L1 agents and the current user from directory (can't align with yourself or L1s)
    if (p.role === "l1") return false;
    if (p.id === user?.person_id) return false;
    if (teamFilter !== "all" && p.team_id !== teamFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) &&
          !(p.handles || []).some(h => h.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  // Count per team
  const teamCounts = {};
  teams.forEach(t => {
    teamCounts[t.id] = people.filter(p => p.team_id === t.id && p.role !== "l1" && p.id !== user?.person_id).length;
  });
  const totalCount = people.filter(p => p.role !== "l1" && p.id !== user?.person_id).length;

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <div className="page-header">
          <div className="page-crumb">Alignments · Directory</div>
          <h1 className="page-title">Who to <em>align</em> with</h1>
          <p className="page-subtitle">
            Every POC across dependent teams — Losses, Cost Ops, Orders & Planning. Pick someone, see what they own, and raise an alignment.
          </p>
        </div>

        <div style={{ marginBottom: 18, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dark-mute)" }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by name or what they handle…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="team-strip">
          <div className={`team-pill ${teamFilter === "all" ? "active" : ""}`} onClick={() => setTeamFilter("all")}>
            All teams <span className="n">{totalCount}</span>
          </div>
          {teams.map(t => (
            <div
              key={t.id}
              className={`team-pill ${teamFilter === t.id ? "active" : ""}`}
              onClick={() => setTeamFilter(t.id)}
            >
              {t.name} <span className="n">{teamCounts[t.id] || 0}</span>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="global-empty">
            <h3>No matches</h3>
            <p>Try a different filter or search term.</p>
          </div>
        ) : (
          <div className="people-grid">
            {filtered.map(p => {
              const team = teams.find(t => t.id === p.team_id);
              return (
                <div
                  key={p.id}
                  className="person-card"
                  onClick={() => navigate(`/alignments/person/${p.id}`)}
                >
                  <div className="person-head">
                    <div className={`person-avatar ${p.role}`}>{getInitials(p.name)}</div>
                    <div className="person-info">
                      <div className="person-name">{p.name}</div>
                      <div className="person-team">{team?.name}</div>
                    </div>
                    <span className={`person-role-badge role-badge-${p.role}`}>{p.role}</span>
                  </div>
                  {p.handles && p.handles.length > 0 && (
                    <div className="person-handles">
                      {p.handles.map((h, i) => (
                        <span key={i} className="person-handle">{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
