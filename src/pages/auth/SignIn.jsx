import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { HAS_FIREBASE } from "../../data/firebase";
import { UserCircle2 } from "lucide-react";

export default function SignIn() {
  const { signIn } = useAuth();
  const { people, teams, loading } = useData();
  const [selectedPersonId, setSelectedPersonId] = useState("p_pranav");

  if (loading) {
    return (
      <div className="signin-wrap">
        <div style={{ color: "var(--text-mute)" }}>Loading…</div>
      </div>
    );
  }

  const person = people.find(p => p.id === selectedPersonId);
  const team = person ? teams.find(t => t.id === person.team_id) : null;

  const handleSignIn = () => {
    if (!person) return;
    signIn({
      person_id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      team_id: person.team_id,
      team_name: team?.name
    });
  };

  // Group people by team
  const grouped = {};
  people.forEach(p => {
    const t = teams.find(x => x.id === p.team_id);
    const key = t?.name || "Unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  return (
    <div className="signin-wrap">
      <div className="signin-card">
        <div className="signin-brand">Valmo <em>·</em> Ops</div>
        <div className="signin-sub">Partner Support Platform</div>

        <h2>Sign in</h2>
        <p className="hint">Pick your identity to enter the platform.</p>

        {!HAS_FIREBASE && (
          <div className="signin-error" style={{ background: "rgba(233, 165, 48, 0.1)", borderColor: "rgba(233, 165, 48, 0.3)", color: "var(--signal-2)" }}>
            <strong>Local mode.</strong> No Firebase configured — data is stored in this browser only. See README to enable multi-user mode.
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Who are you?</label>
          <select className="form-input" value={selectedPersonId} onChange={e => setSelectedPersonId(e.target.value)}>
            {Object.entries(grouped).map(([teamName, ps]) => (
              <optgroup key={teamName} label={teamName}>
                {ps.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role.toUpperCase()}{p.is_me ? " (you)" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {person && (
          <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 4, marginBottom: 14, fontSize: 12, color: "var(--text-mute)", lineHeight: 1.6 }}>
            <div><strong style={{ color: "var(--paper)" }}>{person.name}</strong> · {team?.name}</div>
            <div style={{ marginTop: 4 }}>
              Role: <strong style={{ color: "var(--signal)" }}>{person.role.toUpperCase()}</strong>
              {person.role === "l1" && " — you'll see the SOP playbook only"}
              {person.role === "poc" && " — full access to SOPs and Alignments"}
              {person.role === "manager" && " — oversight view, see alignments you're cc'd on"}
            </div>
          </div>
        )}

        <button className="btn primary" onClick={handleSignIn}>
          <UserCircle2 size={14} /> Enter platform
        </button>

        <div className="signin-footer">
          Built for Valmo Partner Support · v1
        </div>
      </div>
    </div>
  );
}
