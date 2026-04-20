export const SEED_TEAMS = [
  {
    id: "team_partner_support",
    name: "Partner Support",
    short: "PS",
    description: "L1/L2 resolution of Valmo captain (partner) tickets — losses, payments, orders, consumables.",
    color: "#e9a530"
  },
  {
    id: "team_losses",
    name: "Losses & Debits",
    short: "LD",
    description: "Owns loss attribution, reversal approvals, debit adjustments. Partner Support's biggest dependency for reversals.",
    color: "#c64848"
  },
  {
    id: "team_cost_ops",
    name: "Cost Operations",
    short: "CO",
    description: "Payment cycles, F&F settlements, SD refunds, arrears.",
    color: "#6b94c4"
  },
  {
    id: "team_orders_planning",
    name: "Orders & Planning",
    short: "OP",
    description: "Load distribution, polygon management, pin-code configuration for partner hubs.",
    color: "#7fae6b"
  }
];

export const SEED_PEOPLE = [
  // Partner Support (the user's team)
  {
    id: "p_pranav",
    name: "Pranav",
    team_id: "team_partner_support",
    role: "poc",
    email: "pranav@meesho.com",
    handles: ["L2 escalations", "Hardstop", "Shortage", "F&F"],
    is_me: true
  },
  {
    id: "p_ps_mgr",
    name: "Rohan (PS Lead)",
    team_id: "team_partner_support",
    role: "manager",
    email: "ps-lead@meesho.com",
    handles: ["Team oversight", "Escalation governance"]
  },
  {
    id: "p_l1_aakash",
    name: "Aakash",
    team_id: "team_partner_support",
    role: "l1",
    email: "aakash@meesho.com",
    handles: ["Tier-1 ticket resolution"]
  },
  {
    id: "p_l1_priya",
    name: "Priya",
    team_id: "team_partner_support",
    role: "l1",
    email: "priya@meesho.com",
    handles: ["Tier-1 ticket resolution"]
  },

  // Losses & Debits
  {
    id: "p_naveen",
    name: "Naveen",
    team_id: "team_losses",
    role: "poc",
    email: "naveen@meesho.com",
    handles: ["Hardstop reversals", "Loss attribution queries", "Misroute review"]
  },
  {
    id: "p_losses_mgr",
    name: "Vikram (L&D Lead)",
    team_id: "team_losses",
    role: "manager",
    email: "losses-lead@meesho.com",
    handles: ["Team oversight"]
  },
  {
    id: "p_kritika",
    name: "Kritika",
    team_id: "team_losses",
    role: "poc",
    email: "kritika@meesho.com",
    handles: ["Shortage evidence validation", "CCTV requests"]
  },

  // Cost Ops
  {
    id: "p_christopher",
    name: "Christopher",
    team_id: "team_cost_ops",
    role: "poc",
    email: "christopher@meesho.com",
    handles: ["F&F deposit issues", "Held by ops"]
  },
  {
    id: "p_sachin",
    name: "Sachin",
    team_id: "team_cost_ops",
    role: "poc",
    email: "sachin@meesho.com",
    handles: ["SD refunds", "Partner dependency cases"]
  },
  {
    id: "p_co_mgr",
    name: "Meera (CO Lead)",
    team_id: "team_cost_ops",
    role: "manager",
    email: "co-lead@meesho.com",
    handles: ["Team oversight"]
  },

  // Orders & Planning
  {
    id: "p_aman",
    name: "Aman",
    team_id: "team_orders_planning",
    role: "poc",
    email: "aman@meesho.com",
    handles: ["Load zero / reactivation", "RVP load queries"]
  },
  {
    id: "p_riyaz",
    name: "Riyaz",
    team_id: "team_orders_planning",
    role: "poc",
    email: "riyaz@meesho.com",
    handles: ["CMS alignment", "Pin-code changes"]
  },
  {
    id: "p_op_mgr",
    name: "Sanjay (O&P Lead)",
    team_id: "team_orders_planning",
    role: "manager",
    email: "op-lead@meesho.com",
    handles: ["Team oversight"]
  }
];

// A few sample alignments to demo the dashboard & inbox
const now = Date.now();
const HOUR = 3600 * 1000;

export const SEED_ALIGNMENTS = [
  {
    id: "al_001",
    title: "Reverse loss — 12 AWBs, hardstop SOP followed",
    mode: "structured",
    sender_id: "p_pranav",
    receiver_id: "p_naveen",
    cc_ids: ["p_losses_mgr", "p_ps_mgr"],
    extra_viewers: [],
    structured_fields: [
      { key: "ticket_ids", label: "Ticket IDs", value: "TCK-8824, TCK-8831, TCK-8835" },
      { key: "awbs", label: "AWB Numbers", value: "166274992, 166274993, 166274994, 166274995, 166274996, 166274997, 166274998, 166274999, 166275000, 166275001, 166275002, 166275003" },
      { key: "my_remarks", label: "My remarks", value: "All 12 AWBs have valid forward scans within the 7d window. Scan evidence attached." },
      { key: "reason_for_loss", label: "Reason loss was marked", value: "System auto-marked as hardstop breach despite valid scans." },
      { key: "response_needed", label: "What I need from you", value: "Reverse the loss and confirm on this thread." }
    ],
    receiver_field_label: "Your remarks / resolution",
    body: "",
    attachments: [],
    tat_hours: 4,
    created_at: now - 6 * HOUR,
    deadline_at: now - 2 * HOUR, // BREACHED
    status: "open",
    thread: [],
    responded_at: null,
    closed_at: null
  },
  {
    id: "al_002",
    title: "SD refund — partner aligned, need processing",
    mode: "structured",
    sender_id: "p_pranav",
    receiver_id: "p_sachin",
    cc_ids: ["p_co_mgr", "p_ps_mgr"],
    extra_viewers: [],
    structured_fields: [
      { key: "hub_code", label: "Hub Code", value: "BLR-HUB-042" },
      { key: "enbolt_id", label: "Enbolt ID", value: "ENB-9982" },
      { key: "amount", label: "Amount", value: "₹24,500" },
      { key: "bank_details", label: "Bank details shared", value: "Yes — with cancelled cheque" }
    ],
    receiver_field_label: "Cost Ops remarks",
    body: "",
    attachments: [],
    tat_hours: 24,
    created_at: now - 30 * HOUR,
    deadline_at: now - 6 * HOUR, // BREACHED
    status: "open",
    thread: [],
    responded_at: null,
    closed_at: null
  },
  {
    id: "al_003",
    title: "Reactivate RVP load for hub MUM-HUB-011",
    mode: "freeform",
    sender_id: "p_pranav",
    receiver_id: "p_aman",
    cc_ids: ["p_op_mgr", "p_ps_mgr"],
    extra_viewers: [],
    body: "Hub MUM-HUB-011 has had RVP load at zero for 4 days. Captain has escalated multiple times. Please check with AM and reactivate. L1_Remarks field shows 'Escalate to L2'.",
    attachments: [],
    structured_fields: [],
    tat_hours: 48,
    created_at: now - 20 * HOUR,
    deadline_at: now + 28 * HOUR, // on track
    status: "open",
    thread: [],
    responded_at: null,
    closed_at: null
  },
  {
    id: "al_004",
    title: "Shortage contest — evidence review needed",
    mode: "structured",
    sender_id: "p_pranav",
    receiver_id: "p_kritika",
    cc_ids: ["p_losses_mgr", "p_ps_mgr"],
    extra_viewers: [],
    structured_fields: [
      { key: "awb", label: "AWB", value: "166278823" },
      { key: "origin_hub", label: "Origin hub", value: "DEL-HUB-017" },
      { key: "destination_hub", label: "Destination hub", value: "BLR-HUB-042" },
      { key: "my_remarks", label: "My remarks", value: "Both partners shared evidence on time. Origin has CCTV. Please validate and attribute." }
    ],
    receiver_field_label: "Validation outcome",
    body: "",
    attachments: [],
    tat_hours: 24,
    created_at: now - 48 * HOUR,
    deadline_at: now - 24 * HOUR,
    status: "responded",
    thread: [
      { from_id: "p_kritika", body: "Validated. Loss attributed to origin partner based on CCTV. Destination is cleared — you can reverse.", at: now - 20 * HOUR }
    ],
    responded_at: now - 20 * HOUR,
    closed_at: null
  },
  {
    id: "al_005",
    title: "COD pendency false-positive — captain threat escalated",
    mode: "freeform",
    sender_id: "p_pranav",
    receiver_id: "p_riyaz",
    cc_ids: ["p_op_mgr", "p_ps_mgr"],
    extra_viewers: [],
    body: "CMS hasn't collected at HYD-HUB-008 for 6 days. Captain is threatening escalation. Please align.",
    attachments: [],
    structured_fields: [],
    tat_hours: 12,
    created_at: now - 80 * HOUR,
    deadline_at: now - 68 * HOUR,
    status: "closed",
    thread: [
      { from_id: "p_riyaz", body: "CMS visit scheduled for tomorrow morning. Apologies for delay.", at: now - 65 * HOUR },
      { from_id: "p_pranav", body: "Thanks, captain confirmed collection. Closing.", at: now - 40 * HOUR }
    ],
    responded_at: now - 65 * HOUR,
    closed_at: now - 40 * HOUR
  },
  {
    id: "al_006",
    title: "Batch loss reversal — 8 AWBs, misroute within SLA",
    mode: "structured",
    sender_id: "p_pranav",
    receiver_id: "p_naveen",
    cc_ids: ["p_losses_mgr", "p_ps_mgr"],
    extra_viewers: [],
    structured_fields: [
      { key: "awbs", label: "AWBs", value: "166279001 to 166279008" },
      { key: "scenario", label: "Scenario", value: "HS_11_1 — shipments correctly misrouted within 2 days" },
      { key: "my_remarks", label: "My remarks", value: "All 8 AWBs misrouted within 2 days. Scan evidence via Log10 attached." }
    ],
    receiver_field_label: "Your remarks",
    body: "",
    attachments: [],
    tat_hours: 24,
    created_at: now - 3 * HOUR,
    deadline_at: now + 21 * HOUR,
    status: "open",
    thread: [],
    responded_at: null,
    closed_at: null
  }
];
