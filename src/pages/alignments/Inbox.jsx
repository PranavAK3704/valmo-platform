import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Inbox as InboxIcon, Send as SendIcon, Filter, Clock } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { formatTAT, formatRelativeTime, getInitials } from "../../components/helpers";

export default function Inbox() {
  const { alignments, people, teams } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState("active"); // active | all | closed

  // Determine which tab based on route
  const tab = location.pathname.includes("/sent") ? "sent" : "inbox";

  let mine = [];
  if (tab === "inbox") {
    // Where I'm the receiver OR cc'd OR extra viewer
    mine = alignments.filter(a =>
      a.receiver_id === user?.person_id ||
      (a.cc_ids || []).includes(user?.person_id) ||
      (a.extra_viewers || []).includes(user?.person_id)
    );
  } else {
    // Sent: where I'm the sender
    mine = alignments.filter(a => a.sender_id === user?.person_id);
  }

  // Status filter
  if (statusFilter === "active") mine = mine.filter(a => a.status !== "closed");
  else if (statusFilter === "closed") mine = mine.filter(a => a.status === "closed");

  // Sort: breached first, then open by deadline, then closed
  mine = mine.slice().sort((a, b) => {
    const atat = formatTAT(a.deadline_at, a.status, a.responded_at);
    const btat = formatTAT(b.deadline_at, b.status, b.responded_at);
    const order = { bad: 0, warn: 1, ok: 2, neutral: 3 };
    if (order[atat.band] !== order[btat.band]) return order[atat.band] - order[btat.band];
    return a.deadline_at - b.deadline_at;
  });

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <div className="page-header">
          <div className="page-crumb">Alignments</div>
          <h1 className="page-title">
            {tab === "inbox" ? <>Your <em>inbox</em></> : <>Sent by <em>you</em></>}
          </h1>
          <p className="page-subtitle">
            {tab === "inbox"
              ? "Requests where you're the receiver, cc'd, or an added viewer. Breached first."
              : "Requests you've raised. Watch the TAT chips — amber = close, red = breached."}
          </p>
        </div>

        <div className="inbox-tabs">
          <div
            className={`inbox-tab ${tab === "inbox" ? "active" : ""}`}
            onClick={() => navigate("/alignments/inbox")}
          >
            <InboxIcon size={13} /> Inbox
            <span className="n">{alignments.filter(a => (a.receiver_id === user?.person_id || (a.cc_ids || []).includes(user?.person_id) || (a.extra_viewers || []).includes(user?.person_id)) && a.status !== "closed").length}</span>
          </div>
          <div
            className={`inbox-tab ${tab === "sent" ? "active" : ""}`}
            onClick={() => navigate("/alignments/sent")}
          >
            <SendIcon size={13} /> Sent by me
            <span className="n">{alignments.filter(a => a.sender_id === user?.person_id && a.status !== "closed").length}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", paddingBottom: 8 }}>
            <Filter size={12} style={{ color: "var(--text-dark-mute)" }} />
            <select
              className="form-select"
              style={{ padding: "5px 8px", fontSize: 12, width: "auto" }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="active">Active only</option>
              <option value="all">All</option>
              <option value="closed">Closed only</option>
            </select>
          </div>
        </div>

        {mine.length === 0 ? (
          <div className="global-empty">
            <InboxIcon size={36} />
            <h3>Nothing here</h3>
            <p>
              {tab === "inbox"
                ? "No active alignments waiting on you. Nice."
                : "You haven't raised any alignments yet. Go to the directory to pick someone."}
            </p>
          </div>
        ) : (
          <div className="alignment-list">
            {mine.map(a => {
              const tat = formatTAT(a.deadline_at, a.status, a.responded_at);
              const other = tab === "inbox"
                ? people.find(p => p.id === a.sender_id)
                : people.find(p => p.id === a.receiver_id);
              const otherTeam = other ? teams.find(t => t.id === other.team_id) : null;

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
                      {tab === "inbox" ? "From" : "To"} {other?.name} · {otherTeam?.name} · {formatRelativeTime(a.created_at)}
                      {a.mode === "structured" && " · structured"}
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
  );
}
