import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, AlertTriangle, CheckCircle2, Send, X, Eye } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";
import { formatTAT, formatRelativeTime, getInitials, can } from "../../components/helpers";

export default function AlignmentDetail() {
  const { alignmentId } = useParams();
  const navigate = useNavigate();
  const { alignments, people, teams, saveAlignment } = useData();
  const { user } = useAuth();
  const { show } = useToast();

  // Live tick for countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000); // every 30s
    return () => clearInterval(t);
  }, []);

  const alignment = alignments.find(a => a.id === alignmentId);

  const [replyText, setReplyText] = useState("");

  if (!alignment) {
    return (
      <div className="content on-paper">
        <div className="content-inner">
          <div className="global-empty">
            <AlertTriangle size={36} />
            <h3>Alignment not found</h3>
            <p>This alignment may have been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const sender = people.find(p => p.id === alignment.sender_id);
  const receiver = people.find(p => p.id === alignment.receiver_id);
  const senderTeam = sender ? teams.find(t => t.id === sender.team_id) : null;
  const receiverTeam = receiver ? teams.find(t => t.id === receiver.team_id) : null;
  const ccPeople = (alignment.cc_ids || []).map(id => people.find(p => p.id === id)).filter(Boolean);
  const extraViewers = (alignment.extra_viewers || []).map(id => people.find(p => p.id === id)).filter(Boolean);

  const tat = formatTAT(alignment.deadline_at, alignment.status, alignment.responded_at);

  const amReceiver = user?.person_id === alignment.receiver_id;
  const amSender = user?.person_id === alignment.sender_id;
  const canRespond = amReceiver && alignment.status === "open";
  const canClose = amSender && alignment.status !== "closed";
  const canReply = amReceiver || amSender;

  // Format deadline as a readable date
  const deadlineDate = new Date(alignment.deadline_at);
  const deadlineText = deadlineDate.toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
  });

  const sendReply = async () => {
    if (!replyText.trim()) return;
    const now = Date.now();
    const thread = [...(alignment.thread || []), { from_id: user.person_id, body: replyText.trim(), at: now }];
    const updates = { ...alignment, thread };
    if (amReceiver && alignment.status === "open") {
      updates.status = "responded";
      updates.responded_at = now;
    }
    await saveAlignment(updates);
    setReplyText("");
    show(amReceiver && alignment.status === "open" ? "Response sent" : "Reply added");
  };

  const markClosed = async () => {
    if (!confirm("Close this alignment? The TAT clock will stop.")) return;
    await saveAlignment({ ...alignment, status: "closed", closed_at: Date.now() });
    show("Alignment closed");
  };

  const reopen = async () => {
    await saveAlignment({ ...alignment, status: "open", closed_at: null });
    show("Alignment reopened");
  };

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <button className="btn ghost" style={{ marginBottom: 12 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={13} /> Back
        </button>

        <div className="page-header">
          <div className="page-crumb">
            Alignment · {alignment.mode === "structured" ? "Structured" : "Freeform"}
          </div>
          <h1 className="page-title">{alignment.title}</h1>
          <div className="page-meta">
            <span className={`alignment-status status-${alignment.status}`}>{alignment.status}</span>
            <span style={{ fontSize: 12, color: "var(--text-dark-mute)" }}>
              Created {formatRelativeTime(alignment.created_at)}
            </span>
            {alignment.responded_at && (
              <span style={{ fontSize: 12, color: "var(--text-dark-mute)" }}>
                · Responded {formatRelativeTime(alignment.responded_at)}
              </span>
            )}
            {alignment.closed_at && (
              <span style={{ fontSize: 12, color: "var(--text-dark-mute)" }}>
                · Closed {formatRelativeTime(alignment.closed_at)}
              </span>
            )}
          </div>
        </div>

        {/* TAT Ribbon */}
        <div className={`tat-ribbon ${tat.band}`}>
          <Clock size={24} />
          <div className="tat-ribbon-main">
            <div className="label">
              {tat.band === "bad" ? "Breached deadline" : tat.band === "neutral" ? "Resolved" : "Time remaining"}
            </div>
            <div className="big">{tat.text}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="label">Deadline</div>
            <div style={{ fontSize: 13 }}>{deadlineText} ({alignment.tat_hours}h TAT)</div>
          </div>
        </div>

        {/* Participants */}
        <div className="alignment-meta-grid">
          <div className="alignment-meta-item">
            <div className="k">Sender</div>
            <div className="v">
              {sender && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className={`person-avatar ${sender.role}`} style={{ width: 28, height: 28, fontSize: 11 }}>
                    {getInitials(sender.name)}
                  </div>
                  <div>
                    <div>{sender.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dark-mute)", fontWeight: 400 }}>{senderTeam?.name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="alignment-meta-item">
            <div className="k">Receiver</div>
            <div className="v">
              {receiver && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className={`person-avatar ${receiver.role}`} style={{ width: 28, height: 28, fontSize: 11 }}>
                    {getInitials(receiver.name)}
                  </div>
                  <div>
                    <div>{receiver.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dark-mute)", fontWeight: 400 }}>{receiverTeam?.name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="alignment-meta-item">
            <div className="k">Cc'd (auto)</div>
            <div className="v" style={{ fontWeight: 400, fontSize: 12.5 }}>
              {ccPeople.map(p => p.name).join(", ") || "—"}
            </div>
          </div>
          {extraViewers.length > 0 && (
            <div className="alignment-meta-item">
              <div className="k">Extra viewers</div>
              <div className="v" style={{ fontWeight: 400, fontSize: 12.5 }}>
                {extraViewers.map(p => p.name).join(", ")}
              </div>
            </div>
          )}
        </div>

        {/* Request content */}
        <div className="section">
          <div className="section-head">
            <span className="section-num">01</span>
            <h2 className="section-title">The request</h2>
          </div>
          {alignment.mode === "structured" && alignment.structured_fields?.length > 0 ? (
            <table className="struct-table">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {alignment.structured_fields.map((f, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{f.label}</td>
                    <td style={{ whiteSpace: "pre-wrap" }}>{f.value || <span style={{ color: "var(--text-dark-mute)", fontStyle: "italic" }}>(empty)</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="card" style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.65 }}>
              {alignment.body}
            </div>
          )}
        </div>

        {/* Thread */}
        {alignment.thread && alignment.thread.length > 0 && (
          <div className="section">
            <div className="section-head">
              <span className="section-num">02</span>
              <h2 className="section-title">Thread</h2>
            </div>
            <div className="thread">
              {alignment.thread.map((msg, i) => {
                const person = people.find(p => p.id === msg.from_id);
                const isMe = msg.from_id === user?.person_id;
                return (
                  <div key={i} className={`thread-msg ${isMe ? "from-me" : ""}`}>
                    <div className="thread-msg-head">
                      {person && (
                        <div className={`person-avatar ${person.role}`} style={{ width: 26, height: 26, fontSize: 11 }}>
                          {getInitials(person.name)}
                        </div>
                      )}
                      <span className="who">{person?.name}</span>
                      <span className="when">· {formatRelativeTime(msg.at)}</span>
                    </div>
                    <div className="thread-msg-body">{msg.body}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reply area */}
        {canReply && alignment.status !== "closed" && (
          <div className="section">
            <div className="section-head">
              <span className="section-num">
                {(alignment.thread && alignment.thread.length > 0) ? "03" : "02"}
              </span>
              <h2 className="section-title">
                {canRespond ? (
                  <>Your <em>response</em> {alignment.mode === "structured" && alignment.receiver_field_label ? `— ${alignment.receiver_field_label}` : ""}</>
                ) : (
                  "Reply"
                )}
              </h2>
            </div>
            <div className="card">
              <textarea
                className="form-textarea"
                style={{ minHeight: 120 }}
                placeholder={canRespond ? "Type your resolution / response here…" : "Add a follow-up reply…"}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
              <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                {canRespond && (
                  <div style={{ flex: 1, fontSize: 12, color: "var(--text-dark-mute)", alignSelf: "center" }}>
                    Sending will mark this as <b>Responded</b>.
                  </div>
                )}
                <button className="btn primary accent" onClick={sendReply} disabled={!replyText.trim()}>
                  <Send size={13} /> {canRespond ? "Send response" : "Send reply"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {(canClose || (amSender && alignment.status === "closed")) && (
          <div className="section">
            <div className="section-head">
              <span className="section-num">·</span>
              <h2 className="section-title">Actions</h2>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {canClose && alignment.status !== "closed" && (
                <button className="btn ok" onClick={markClosed}>
                  <CheckCircle2 size={13} /> Mark as closed
                </button>
              )}
              {amSender && alignment.status === "closed" && (
                <button className="btn" onClick={reopen}>
                  Reopen
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
