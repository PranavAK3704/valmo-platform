// Format a TAT deadline as human text and a status band.
// Returns { text, band } where band ∈ 'ok' | 'warn' | 'bad' | 'neutral'
export function formatTAT(deadline_at, status, responded_at) {
  if (status === "closed" || status === "responded") {
    return { text: "Resolved", band: "neutral" };
  }
  const now = Date.now();
  const diff = deadline_at - now;
  const absHours = Math.abs(diff) / (1000 * 60 * 60);
  const absMins = Math.floor(Math.abs(diff) / (1000 * 60)) % 60;

  if (diff < 0) {
    // Breached
    const days = Math.floor(absHours / 24);
    if (days > 0) return { text: `${days}d ${Math.floor(absHours % 24)}h breached`, band: "bad" };
    if (absHours >= 1) return { text: `${Math.floor(absHours)}h ${absMins}m breached`, band: "bad" };
    return { text: `${absMins}m breached`, band: "bad" };
  } else {
    // Remaining
    const days = Math.floor(absHours / 24);
    if (days > 0) return { text: `${days}d ${Math.floor(absHours % 24)}h left`, band: absHours < 12 ? "warn" : "ok" };
    if (absHours < 2) return { text: `${Math.floor(absHours)}h ${absMins}m left`, band: "warn" };
    if (absHours < 8) return { text: `${Math.floor(absHours)}h ${absMins}m left`, band: "warn" };
    return { text: `${Math.floor(absHours)}h left`, band: "ok" };
  }
}

export function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const decisionLabel = (d) => ({
  escalate: "Escalate",
  reject: "No Reversal",
  respond: "Respond",
  redirect_tech: "Route to Tech"
}[d] || d);

export function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// TAT presets
export const TAT_PRESETS = [
  { label: "4 hours", hours: 4 },
  { label: "End of day (8h)", hours: 8 },
  { label: "24 hours", hours: 24 },
  { label: "48 hours", hours: 48 },
  { label: "1 week", hours: 168 }
];

// Role-based permissions
export const can = {
  viewPlaybook: () => true, // all roles
  editSops: (user) => user?.role === "poc",
  editTemplates: (user) => user?.role === "poc",
  viewAlignments: (user) => user?.role === "poc" || user?.role === "manager",
  createAlignments: (user) => user?.role === "poc",
  respondToAlignment: (user, alignment) => user?.role === "poc" && user.person_id === alignment.receiver_id,
  closeAlignment: (user, alignment) => user?.role === "poc" && (user.person_id === alignment.sender_id || user.person_id === alignment.receiver_id),
  editPeople: (user) => user?.role === "poc"
};
