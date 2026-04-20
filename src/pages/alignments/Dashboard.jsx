import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { AlertTriangle, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { formatTAT } from "../../components/helpers";

export default function Dashboard() {
  const { alignments, people, teams } = useData();
  const { user } = useAuth();

  const mySent = useMemo(() => alignments.filter(a => a.sender_id === user?.person_id), [alignments, user]);

  // Stats
  const stats = useMemo(() => {
    const total = mySent.length;
    const active = mySent.filter(a => a.status !== "closed").length;
    const breached = mySent.filter(a => {
      if (a.status === "closed") return a.responded_at > a.deadline_at;
      return Date.now() > a.deadline_at;
    }).length;
    const closed = mySent.filter(a => a.status === "closed").length;
    const avgResponse = mySent.filter(a => a.responded_at).length > 0
      ? mySent.filter(a => a.responded_at).reduce((acc, a) => acc + (a.responded_at - a.created_at) / (1000 * 60 * 60), 0) / mySent.filter(a => a.responded_at).length
      : 0;
    const breachRate = total > 0 ? Math.round((breached / total) * 100) : 0;
    return { total, active, breached, closed, avgResponse, breachRate };
  }, [mySent]);

  // By receiver team
  const byTeam = useMemo(() => {
    const groups = {};
    mySent.forEach(a => {
      const receiver = people.find(p => p.id === a.receiver_id);
      const team = receiver ? teams.find(t => t.id === receiver.team_id) : null;
      if (!team) return;
      if (!groups[team.id]) {
        groups[team.id] = { name: team.name, color: team.color, total: 0, breached: 0, active: 0 };
      }
      groups[team.id].total++;
      if (a.status !== "closed") groups[team.id].active++;
      if ((a.status === "closed" && a.responded_at > a.deadline_at) ||
          (a.status !== "closed" && Date.now() > a.deadline_at)) {
        groups[team.id].breached++;
      }
    });
    return Object.values(groups);
  }, [mySent, people, teams]);

  // By receiver (top blockers)
  const byReceiver = useMemo(() => {
    const groups = {};
    mySent.forEach(a => {
      if (a.status === "closed") return;
      const tat = formatTAT(a.deadline_at, a.status, a.responded_at);
      if (tat.band !== "bad" && tat.band !== "warn") return;
      const receiver = people.find(p => p.id === a.receiver_id);
      if (!receiver) return;
      if (!groups[receiver.id]) {
        const team = teams.find(t => t.id === receiver.team_id);
        groups[receiver.id] = { name: receiver.name, team: team?.name, count: 0 };
      }
      groups[receiver.id].count++;
    });
    return Object.values(groups).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [mySent, people, teams]);

  // Status pie
  const statusDist = [
    { name: "Open", value: mySent.filter(a => a.status === "open").length, color: "#6b94c4" },
    { name: "Responded", value: mySent.filter(a => a.status === "responded").length, color: "#7fae6b" },
    { name: "Closed", value: mySent.filter(a => a.status === "closed").length, color: "#a7a196" }
  ].filter(x => x.value > 0);

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <div className="page-header">
          <div className="page-crumb">Alignments · Dashboard</div>
          <h1 className="page-title">Your <em>dependency ledger</em></h1>
          <p className="page-subtitle">
            The state of your outbound alignments. Use this in GM reviews to show what's blocked, who's blocking, and how long.
          </p>
        </div>

        {/* Top stats */}
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-label">Total sent</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-sub">alignments raised</div>
          </div>
          <div className="stat">
            <div className="stat-label">Currently active</div>
            <div className="stat-value warn">{stats.active}</div>
            <div className="stat-sub">awaiting response or action</div>
          </div>
          <div className="stat">
            <div className="stat-label">Breached</div>
            <div className={`stat-value ${stats.breachRate > 30 ? "bad" : stats.breachRate > 10 ? "warn" : "ok"}`}>
              {stats.breached}
            </div>
            <div className="stat-sub">{stats.breachRate}% breach rate</div>
          </div>
          <div className="stat">
            <div className="stat-label">Avg response</div>
            <div className="stat-value">{stats.avgResponse.toFixed(1)}h</div>
            <div className="stat-sub">from raise → first response</div>
          </div>
        </div>

        {/* By team */}
        <div className="chart-card">
          <h3 className="chart-card-title">Where your dependencies live</h3>
          <div style={{ fontSize: 12, color: "var(--text-dark-mute)", marginBottom: 14 }}>
            Alignments raised per team — use this to show the GM which teams you depend on most.
          </div>
          {byTeam.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byTeam} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#dfdacf" vertical={false} />
                <XAxis dataKey="name" stroke="#57554d" style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                <YAxis stroke="#57554d" style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                <Tooltip contentStyle={{ background: "white", border: "1px solid #dfdacf", borderRadius: 4, fontSize: 12 }} />
                <Bar dataKey="total" name="Total" fill="#1a1c22" radius={[3, 3, 0, 0]} />
                <Bar dataKey="breached" name="Breached" fill="#c64848" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="inpage-empty"><p>No data yet.</p></div>
          )}
        </div>

        {/* Top blockers */}
        <div className="chart-card">
          <h3 className="chart-card-title">Top blockers right now</h3>
          <div style={{ fontSize: 12, color: "var(--text-dark-mute)", marginBottom: 14 }}>
            People with the most breached or near-breach alignments from you. These are your review-meeting talking points.
          </div>
          {byReceiver.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {byReceiver.map((r, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "30px 1fr auto",
                  gap: 12, alignItems: "center", padding: "10px 12px",
                  background: "var(--paper-2)", borderRadius: 4
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "var(--bad)", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text-dark)" }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dark-mute)", fontFamily: "'IBM Plex Mono', monospace" }}>{r.team}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bad)", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {r.count} blocker{r.count === 1 ? "" : "s"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="inpage-empty"><p>No blockers right now. 🎉</p></div>
          )}
        </div>

        {/* Status split */}
        {statusDist.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-card-title">Status split</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "white", border: "1px solid #dfdacf", borderRadius: 4, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
