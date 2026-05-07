import React, { useState, useMemo, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, MessageSquare, Plus, FileText, FileCode2, Users, Inbox, BarChart3, LogOut, ChevronDown, ChevronRight, Building2, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { formatTAT, getInitials, can } from "./helpers";

export default function Nav() {
  const { user, signOut } = useAuth();
  const { sops, teams, alignments, templates } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const onPlaybook = location.pathname.startsWith("/playbook") || location.pathname === "/";
  const onAlignments = location.pathname.startsWith("/alignments");

  const myInbox = alignments.filter(a => a.receiver_id === user?.person_id && a.status !== "closed");
  const openBreached = alignments.filter(a => {
    if (a.sender_id !== user?.person_id) return false;
    if (a.status === "closed") return false;
    const tat = formatTAT(a.deadline_at, a.status, a.responded_at);
    return tat.band === "bad";
  });

  const isL1 = user?.role === "l1";
  const playbookLabel = isL1 ? "Playbook L1" : "Playbook";

  // Group SOPs into team → category → list
  const tree = useMemo(() => {
    const out = {};
    sops.forEach(s => {
      const teamId = s.team_id || "team_unknown";
      const team = teams.find(t => t.id === teamId);
      const teamName = team?.name || "Uncategorized";
      const cat = s.category || "General";
      if (!out[teamName]) out[teamName] = { team, cats: {} };
      if (!out[teamName].cats[cat]) out[teamName].cats[cat] = [];
      out[teamName].cats[cat].push(s);
    });
    return out;
  }, [sops, teams]);

  // Collapsible state — start with the user's own team expanded
  const myTeamName = useMemo(() => {
    const t = teams.find(t => t.id === user?.team_id);
    return t?.name;
  }, [teams, user]);

  const [openTeams, setOpenTeams] = useState(() => new Set(myTeamName ? [myTeamName] : []));
  const [openCats, setOpenCats] = useState(() => new Set());

  // When SOP routes change, auto-expand the path to the active SOP
  useEffect(() => {
    const m = location.pathname.match(/^\/playbook\/([^/]+)$/);
    if (!m) return;
    const sop = sops.find(s => s.id === m[1]);
    if (!sop) return;
    const team = teams.find(t => t.id === sop.team_id);
    const teamName = team?.name || "Uncategorized";
    const cat = sop.category || "General";
    setOpenTeams(prev => new Set([...prev, teamName]));
    setOpenCats(prev => new Set([...prev, `${teamName}::${cat}`]));
  }, [location.pathname, sops, teams]);

  const toggleTeam = (name) => {
    setOpenTeams(prev => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name); else n.add(name);
      return n;
    });
  };
  const toggleCat = (key) => {
    setOpenCats(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  const canViewAlignments = can.viewAlignments(user);

  return (
    <nav className="nav">
      <div className="brand">
        <div className="brand-mark">Valmo <em>·</em> Ops</div>
        <div className="brand-sub">Partner Support Platform</div>
      </div>

      <div className="role-switcher">
        <div className="role-label">Signed in as</div>
        <div className="role-current" onClick={() => setRoleMenuOpen(!roleMenuOpen)}>
          <div className="role-avatar">{getInitials(user?.name)}</div>
          <div className="role-meta">
            <div className="role-name">{user?.name}</div>
            <div className="role-pod">{user?.team_name} · {user?.role?.toUpperCase()}</div>
          </div>
          <ChevronDown size={14} style={{ color: "var(--text-mute)", transform: roleMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </div>
        {roleMenuOpen && (
          <div className="role-menu">
            <div className="role-option" onClick={signOut}>
              <LogOut size={13} /> Sign out
            </div>
          </div>
        )}
      </div>

      {canViewAlignments ? (
        <div className="nav-tabs">
          <div
            className={`nav-tab ${onPlaybook ? "active" : ""}`}
            onClick={() => navigate("/playbook")}
          >
            <BookOpen size={14} /> {playbookLabel}
          </div>
          <div
            className={`nav-tab ${onAlignments ? "active" : ""}`}
            onClick={() => navigate("/alignments/inbox")}
          >
            <MessageSquare size={14} /> Alignments
            {(myInbox.length > 0 || openBreached.length > 0) && (
              <span className="count alert" style={{ marginLeft: 4 }}>{myInbox.length + openBreached.length}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="nav-tabs">
          <div className={`nav-tab active`}>
            <BookOpen size={14} /> {playbookLabel}
          </div>
        </div>
      )}

      {onPlaybook && (
        <>
          {can.editSops(user) && (
            <div className="nav-section">
              <div className="nav-label">Tools</div>
              <NavLink to="/playbook/new" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Plus size={14} /> Add SOP
              </NavLink>
              <NavLink to="/playbook/templates" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <FileText size={14} /> Templates <span className="count">{templates.length}</span>
              </NavLink>
              <NavLink to="/playbook/export" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <FileCode2 size={14} /> Export JSON
              </NavLink>
            </div>
          )}
          <div className="nav-section">
            <div className="nav-label">{playbookLabel} <span style={{ marginLeft: 8, color: "var(--text-faint)" }}>{sops.length}</span></div>
            {Object.entries(tree).map(([teamName, { cats }]) => {
              const teamOpen = openTeams.has(teamName);
              const teamCount = Object.values(cats).reduce((acc, l) => acc + l.length, 0);
              return (
                <div key={teamName} className="tree-team">
                  <div className={`tree-team-head ${teamOpen ? "open" : ""}`} onClick={() => toggleTeam(teamName)}>
                    <ChevronRight size={11} className="tree-chev" />
                    <Building2 size={11} />
                    <span className="tree-name">{teamName}</span>
                    <span className="tree-count">{teamCount}</span>
                  </div>
                  {teamOpen && (
                    <div className="tree-team-body">
                      {Object.entries(cats).map(([cat, list]) => {
                        const catKey = `${teamName}::${cat}`;
                        const catOpen = openCats.has(catKey);
                        return (
                          <div key={cat} className="tree-cat">
                            <div className={`tree-cat-head ${catOpen ? "open" : ""}`} onClick={() => toggleCat(catKey)}>
                              <ChevronRight size={10} className="tree-chev" />
                              <span className="tree-name">{cat}</span>
                              <span className="tree-count">{list.length}</span>
                            </div>
                            {catOpen && (
                              <div className="tree-cat-body">
                                {list.map(s => (
                                  <NavLink
                                    key={s.id}
                                    to={`/playbook/${s.id}`}
                                    className={({ isActive }) => `sop-item ${isActive ? "active" : ""}`}
                                  >
                                    <span className="dot" />
                                    <span>{s.problem_theme}</span>
                                  </NavLink>
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
        </>
      )}

      {onAlignments && canViewAlignments && (
        <>
          {can.createAlignments(user) && (
            <div className="nav-section">
              <div className="nav-label">Actions</div>
              <NavLink to="/alignments/directory" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Users size={14} /> Directory
              </NavLink>
              <NavLink to="/alignments/new" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Plus size={14} /> New alignment
              </NavLink>
            </div>
          )}
          <div className="nav-section">
            <div className="nav-label">Workspace</div>
            <NavLink to="/alignments/inbox" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Inbox size={14} /> Inbox
              {myInbox.length > 0 && <span className="count alert">{myInbox.length}</span>}
            </NavLink>
            <NavLink to="/alignments/sent" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Bell size={14} /> Sent by me
              {openBreached.length > 0 && <span className="count warn">{openBreached.length}</span>}
            </NavLink>
            <NavLink to="/alignments/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <BarChart3 size={14} /> Dashboard
            </NavLink>
          </div>
        </>
      )}
    </nav>
  );
}
