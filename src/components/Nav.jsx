import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, MessageSquare, Plus, FileText, FileCode2, Users, Inbox, BarChart3, UserCircle2, LogOut, ChevronDown, Building2, Bell, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { formatTAT, getInitials, can } from "./helpers";

export default function Nav() {
  const { user, signOut } = useAuth();
  const { sops, teams, alignments, templates } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // Top-level section detection
  const onPlaybook = location.pathname.startsWith("/playbook") || location.pathname === "/";
  const onAlignments = location.pathname.startsWith("/alignments");

  // Alignment counts
  const myInbox = alignments.filter(a => a.receiver_id === user?.person_id && a.status !== "closed");
  const openBreached = alignments.filter(a => {
    if (a.sender_id !== user?.person_id) return false;
    if (a.status === "closed") return false;
    const tat = formatTAT(a.deadline_at, a.status, a.responded_at);
    return tat.band === "bad";
  });

  // SOPs grouped by team (for POC/manager) or just by category (for L1)
  const sopsByTeam = {};
  sops.forEach(s => {
    const teamId = s.team_id || "team_unknown";
    const team = teams.find(t => t.id === teamId);
    const key = team ? team.name : "Uncategorized";
    if (!sopsByTeam[key]) sopsByTeam[key] = [];
    sopsByTeam[key].push(s);
  });

  const canViewAlignments = can.viewAlignments(user);

  return (
    <nav className="nav">
      <div className="brand">
        <div className="brand-mark">Valmo <em>·</em> Ops</div>
        <div className="brand-sub">Partner Support Platform</div>
      </div>

      {/* User / role switcher */}
      <div className="role-switcher">
        <div className="role-label">Signed in as</div>
        <div className="role-current" onClick={() => setRoleMenuOpen(!roleMenuOpen)}>
          <div className={`role-avatar ${user?.role === "poc" ? "" : ""}`}>{getInitials(user?.name)}</div>
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

      {/* Top-level tabs: Playbook vs Alignments */}
      {canViewAlignments ? (
        <div className="nav-tabs">
          <div
            className={`nav-tab ${onPlaybook ? "active" : ""}`}
            onClick={() => navigate("/playbook")}
          >
            <BookOpen size={14} /> Playbook
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
            <BookOpen size={14} /> Playbook
          </div>
        </div>
      )}

      {/* Content by section */}
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
            <div className="nav-label">Playbook <span style={{ marginLeft: 8, color: "var(--text-faint)" }}>{sops.length}</span></div>
            {Object.entries(sopsByTeam).map(([teamName, teamSops]) => (
              <div key={teamName} className="cat-group">
                <div className="cat-head">
                  <Building2 size={10} /> {teamName}
                </div>
                {teamSops.map(s => (
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
            ))}
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
