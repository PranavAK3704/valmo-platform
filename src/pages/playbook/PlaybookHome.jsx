import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronDown, ChevronRight } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

export default function PlaybookHome() {
  const { sops, teams } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isL1 = user?.role === "l1";
  const playbookLabel = isL1 ? "Playbook L1" : "Playbook";

  // Group SOPs into team → category → list
  const tree = useMemo(() => {
    const out = {};
    sops.forEach(s => {
      const t = teams.find(x => x.id === s.team_id);
      const teamName = t?.name || "Uncategorized";
      const cat = s.category || "General";
      if (!out[teamName]) out[teamName] = { team: t, cats: {} };
      if (!out[teamName].cats[cat]) out[teamName].cats[cat] = [];
      out[teamName].cats[cat].push(s);
    });
    return out;
  }, [sops, teams]);

  const myTeamName = useMemo(() => {
    const t = teams.find(t => t.id === user?.team_id);
    return t?.name;
  }, [teams, user]);

  const [openTeams, setOpenTeams] = useState(() => new Set(myTeamName ? [myTeamName] : Object.keys(tree).slice(0, 1)));
  const [openCats, setOpenCats] = useState(() => new Set());

  const toggleTeam = (n) => setOpenTeams(prev => {
    const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s;
  });
  const toggleCat = (k) => setOpenCats(prev => {
    const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s;
  });

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <div className="page-header">
          <div className="page-crumb">{playbookLabel}</div>
          <h1 className="page-title">
            {isL1 ? <>Valmo <em>Partner Support</em> · L1 playbook</> : <>The Valmo <em>Partner Support</em> playbook</>}
          </h1>
          <p className="page-subtitle">
            SOPs for every scenario agents handle on captain tickets. Browse by team and category — click to expand.
          </p>
        </div>

        <div className="playbook-tree">
          {Object.entries(tree).map(([teamName, { team, cats }]) => {
            const teamOpen = openTeams.has(teamName);
            const teamTotal = Object.values(cats).reduce((acc, l) => acc + l.length, 0);
            return (
              <div key={teamName} className="pb-team">
                <div className={`pb-team-head ${teamOpen ? "open" : ""}`} onClick={() => toggleTeam(teamName)}>
                  {teamOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Building2 size={14} style={{ color: "var(--text-dark-mute)" }} />
                  <span className="pb-team-name">{teamName}</span>
                  {team?.description && <span className="pb-team-desc">{team.description}</span>}
                  <span className="pb-team-count">{teamTotal} SOP{teamTotal === 1 ? "" : "s"}</span>
                </div>
                {teamOpen && (
                  <div className="pb-team-body">
                    {Object.entries(cats).map(([cat, list]) => {
                      const catKey = `${teamName}::${cat}`;
                      const catOpen = openCats.has(catKey);
                      return (
                        <div key={cat} className="pb-cat">
                          <div className={`pb-cat-head ${catOpen ? "open" : ""}`} onClick={() => toggleCat(catKey)}>
                            {catOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            <span className="pb-cat-name">{cat}</span>
                            <span className="pb-cat-count">{list.length}</span>
                          </div>
                          {catOpen && (
                            <div className="pb-cat-body">
                              {list.map(s => (
                                <div
                                  key={s.id}
                                  className="card card-hover pb-sop-card"
                                  onClick={() => navigate(`/playbook/${s.id}`)}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div className="pb-sop-title">{s.problem_theme}</div>
                                    <div className="pb-sop-meta">
                                      {s.scenarios?.length || 0} scenarios · Queue {s.queue}
                                      {s.tat_hours && ` · ${s.tat_hours}h TAT`}
                                    </div>
                                  </div>
                                  <ChevronRight size={14} style={{ color: "var(--text-dark-faint)" }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
