// All 12 seed SOPs built directly from the Google Doc source of truth.
// Each SOP has a team_id for multi-team support.

export const SEED_SOPS = [
  {
    id: "sop_hardstop",
    team_id: "team_partner_support",
    problem_theme: "Hardstop Loss",
    category: "Losses & Debits",
    queue: "W- LD",
    tat_hours: 72,
    intent: "Captain contests a hardstop loss marking",
    summary: "Captain received loss AWB details and is contesting the loss marked on them. Apply hardstop rule (7d forward / 5d reverse) and scan validity checks.",
    trigger_keywords: ["hardstop", "loss marked", "wrong loss", "reversal", "not connected"],
    required_inputs: [{ field: "awb_numbers", label: "AWB Numbers", required: true }],
    preprocessing_notes: [
      "If scans show a node named PCXX — that's a Packaging Center. The AWB is consolidated into a parent. Look up the parent AWB in Single AWB Tracking and process the parent, not the child.",
      "If the ticket has Bag IDs (UN-prefixed like UN117197848) but no AWBs, enter the Bag ID into the Valmo lost Metabase query to extract the individual AWB numbers — do not ask the captain."
    ],
    data_sources: [
      { label: "Loss attribution Metabase query", url: "https://metabase-main.bi.meeshogcp.in/question/177019-valmo-lost-data-2k24" },
      { label: "LM FE Loss Marked query", url: "https://metabase-main.bi.meeshogcp.in/question/178546-lm-fe-loss-marked-awbs" },
      { label: "Single AWB Tracking", url: "https://metabase-main.bi.meeshogcp.in/question/177020-single-awb-tracking" },
      { label: "Hardstop SOP reference", url: "https://sites.google.com/meesho.com/valmo-sop/hardstop-policy-lm-fm" },
      { label: "Seller Dependency SOP", url: "https://docs.google.com/spreadsheets/d/1Y8QOhA-e0M3iuBzP3wD-Pn2vFlwqvw8dElLQzGKvJQw" },
      { label: "Log10 (scan history)", url: "https://log10-support.freshdesk.com/support/login" }
    ],
    rule_facts: [
      "Hardstop rule: any shipment arriving at the hub must be connected forward within 7 days (forward leg) or 5 days (reverse leg). Breach → loss stands.",
      "Misroute: captain must route to correct hub within 2 days. Max 2 misroutes allowed — loss falls on original hub if exceeded."
    ],
    scenarios: [
      { id: "HS_1_1", label: "Scans valid + hardstop SOP followed", conditions: ["Log10 scans show a valid forward connection", "Connection happened within the 7d / 5d window"], decision: "escalate", decision_level: "L2", response: "Loss will be reversed. Escalating to L2 with the scan evidence.", template_id: "tpl_hardstop_reversal" },
      { id: "HS_1_2", label: "Scans valid + hardstop SOP NOT followed", conditions: ["Log10 scans show valid connection", "Connection happened AFTER the 7d / 5d window"], decision: "reject", response: "Reversal not applicable — Hardstop SOP was breached.", template_id: "tpl_hardstop_breach" },
      { id: "HS_2", label: "Scans invalid (wrong destination)", conditions: ["Log10 shows shipment connected to the wrong destination"], decision: "reject", response: "Reversal not applicable — wrong connection destination.", template_id: "tpl_hardstop_wrong_dest" },
      { id: "HS_3", label: "Fails to connect after Customer Rejection", conditions: ["Captain's reason = customer rejection", "No forward connection within the RTO timeline"], decision: "reject", response: "Reversal not applicable — no forward connection within RTO timeline.", template_id: "tpl_hardstop_na" },
      { id: "HS_4", label: "Fails to connect after Customer Unreachable", conditions: ["Captain's reason = customer unreachable", "Shipment not delivered within 7 days"], decision: "reject", response: "Reversal not applicable — shipment not delivered within 7 days.", template_id: "tpl_hardstop_na" },
      { id: "HS_5", label: "Customer denies cancellation OTP", conditions: ["Captain's reason = customer denies OTP", "Fewer than 3 delivery attempts within 7 days"], decision: "reject", response: "Reversal not applicable — fewer than 3 delivery attempts.", template_id: "tpl_hardstop_na" },
      { id: "HS_6", label: "Customer wants shipment post 7 days", conditions: ["Customer wants shipment post 7 days", "Fewer than 3 attempts"], decision: "reject", response: "Reversal not applicable. Advise customer to cancel and reorder.", template_id: "tpl_hardstop_post7" },
      { id: "HS_7", label: "Delivered but couldn't be marked", conditions: ["Captain says shipment was delivered but marking failed"], decision: "redirect_tech", response: "Raise this with the tech team directly with proof of delivery.", template_id: "tpl_tech_team" },
      { id: "HS_8_1", label: "Not inscanned to hub + FE amount recovered", conditions: ["Shipment never inscanned back to hub", "LM FE Loss Marked shows amount recovered from FE"], decision: "escalate", decision_level: "L2", response: "Loss will be reversed. Escalating to L2.", template_id: "tpl_hardstop_reversal" },
      { id: "HS_8_2", label: "Not inscanned + FE not recovered + Consignment_Lost", conditions: ["Shipment never inscanned back to hub", "Amount NOT recovered from FE", "Log10 last status = Consignment_Lost"], decision: "escalate", decision_level: "L2", response: "Loss will be reversed. Escalating to L2.", template_id: "tpl_hardstop_reversal" },
      { id: "HS_9_1", label: "Awaited instruction (seller dep.) — SOP breached", conditions: ["Captain's reason = awaited instruction", "Seller Dependency SOP not followed"], decision: "reject", response: "No reversal — Seller Dependency SOP was breached.", template_id: "tpl_hardstop_breach" },
      { id: "HS_9_2", label: "Awaited instruction (seller dep.) — SOP followed", conditions: ["Captain's reason = awaited instruction", "Seller Dependency SOP followed"], decision: "escalate", decision_level: "L2", response: "Loss will be reversed. Escalating to L2.", template_id: "tpl_hardstop_reversal" },
      { id: "HS_10", label: "Wrong shipments received — misroute deadline missed", conditions: ["Captain received wrong shipments/bags", "Captain missed 2-day misroute deadline"], decision: "reject", response: "Reversal not applicable — misroute deadline missed.", template_id: "tpl_misroute_breach" },
      { id: "HS_11_1", label: "Shipments correctly misrouted", conditions: ["Scans show MISROUTE within 2 days of previous scan"], decision: "escalate", decision_level: "L2", response: "Loss will be reversed. Escalating to L2.", template_id: "tpl_hardstop_reversal" },
      { id: "HS_11_2", label: "Shipments incorrectly misrouted (>2 bounces)", conditions: ["Misroute exceeded — shipment bounced more than 2 times"], decision: "reject", response: "Reversal not applicable — loss attributed to original hub.", template_id: "tpl_misroute_breach" }
    ],
    guardrails: [
      "Hardstop waiver allowed only if: captain tenure < 60 days AND zero prior reversals AND at least 1 payment cycle invoiced AND current hardstop pendency = 0.",
      "L2 waive-off approval limit: ₹5,000 per payment cycle."
    ]
  },
  {
    id: "sop_shortage",
    team_id: "team_partner_support",
    problem_theme: "Shortage Loss",
    category: "Losses & Debits",
    queue: "W- LD",
    tat_hours: 72,
    intent: "Captain contests a shortage loss attribution",
    summary: "Captain claims shortage loss was wrongly marked. Validate mail evidence to both partners, SLA compliance, and scan data.",
    trigger_keywords: ["shortage", "missing shipment", "bag shortage", "evidence", "CCTV"],
    required_inputs: [{ field: "awb_numbers", label: "AWB Numbers", required: true }],
    preprocessing_notes: ["Check that AWB numbers are valid and added correctly by the captain."],
    data_sources: [
      { label: "Loss attribution Metabase query", url: "https://metabase-main.bi.meeshogcp.in/question/177019-valmo-lost-data-2k24" },
      { label: "Shortage SOP reference", url: "https://docs.google.com/document/d/1VyAWTNAIaVFVsXtAj7FJcbW-yJ_-c3BtPeKTRYagMJQ" },
      { label: "Log10", url: "https://log10-support.freshdesk.com/support/login" }
    ],
    rule_facts: [
      "Shortage ticket must be raised within 24h of vehicle arrival timestamp.",
      "Both origin and destination partners must be mailed the evidence. If not, re-queue."
    ],
    scenarios: [
      { id: "SL_1", label: "Evidence mails not sent to one or both partners", conditions: ["Shortage Data Query shows mails NOT sent to both partners"], decision: "escalate", decision_level: "L3", response: "Re-escalating on Kapture to re-queue the mails.", template_id: "tpl_shortage_requeue" },
      { id: "SL_2a", label: "Captain unable to mark — SOP followed (tech issue)", conditions: ["Ticket raised within 24h of vehicle arrival", "Status = CLOSED"], decision: "redirect_tech", response: "This is a tech issue. Please raise with the tech team.", template_id: "tpl_tech_team" },
      { id: "SL_2b", label: "Captain unable to mark — SOP breached", conditions: ["Ticket raised AFTER 24h window"], decision: "reject", response: "Shortage marking window breached (>24h). No reversal.", template_id: "tpl_shortage_breach" },
      { id: "SL_3", label: "Only one partner shared evidence", conditions: ["One partner shared evidence within SLA", "Other partner = SLA_BREACHED"], decision: "reject", response: "Loss attributed to partner that didn't share evidence.", template_id: "tpl_shortage_sla" },
      { id: "SL_4", label: "Both partners shared evidence — contest needs validation", conditions: ["Both have valid evidence", "Captain is contesting"], decision: "escalate", decision_level: "L2", response: "Escalating to L2 evidence-validation team.", template_id: "tpl_shortage_escalate" },
      { id: "SL_5", label: "Captain claims wrong email ID was shared", conditions: ["Captain claims wrong email ID"], decision: "reject", response: "You should have intimated this previously. No reversal.", template_id: "tpl_shortage_wrong_email" }
    ]
  },
  {
    id: "sop_payment_not_received",
    team_id: "team_partner_support",
    problem_theme: "Payment not received",
    category: "Payments",
    queue: "M_V",
    tat_hours: 12,
    intent: "Captain wants to know why payment for a cycle wasn't received",
    summary: "Run the Captain Payment Status query and respond with the status-specific template based on the Remarks column.",
    trigger_keywords: ["payment", "not received", "cycle", "invoice", "enbolt"],
    required_inputs: [
      { field: "payment_cycle", label: "Payment Cycle", required: true },
      { field: "enbolt_id", label: "Enbolt ID", required: true },
      { field: "invoice_number", label: "Invoice Number", required: true },
      { field: "hub_code", label: "Hub Code", required: true }
    ],
    data_sources: [
      { label: "Captain Payment Status & Amount query", url: "https://metabase-main.bi.meeshogcp.in/question/177461-captain-payment-status-amount" },
      { label: "Payment tracker (L2)", url: "https://docs.google.com/spreadsheets/d/1R9JKAaARaJNjxlgN7VPY6MgkSmGtUj5668a--X90F0s" }
    ],
    scenarios: [
      { id: "PAY_STATUS", label: "Known status in Remarks column", conditions: ["Remarks shows: Payment processed / Pending E-Sign / Hold Negative / GST Defaulter / Risk above threshold / DC under FnF / Payment Failed / etc."], decision: "respond", response: "Reply with the template matching the exact Remarks status.", template_id: "tpl_payment_status" },
      { id: "PAY_UNDER_COMP", label: "Under Computation", conditions: ["Remarks column = Under Computation"], decision: "escalate", decision_level: "L2", response: "Escalate to L2 — check payment tracker for cycle status.", template_id: "tpl_payment_under_comp" }
    ]
  },
  {
    id: "sop_fnf",
    team_id: "team_partner_support",
    problem_theme: "Full and Final Settlement",
    category: "Payments",
    queue: "M_V",
    tat_hours: null,
    intent: "Captain wants to close their DC / requests F&F or SD refund",
    summary: "Check the F&F Dashboard AP Remarks column; respond directly for common statuses, escalate for others.",
    trigger_keywords: ["fnf", "full and final", "security deposit", "close dc", "sd refund"],
    required_inputs: [
      { field: "hub_code", label: "Hub Code", required: true },
      { field: "enbolt_id", label: "Enbolt ID", required: true },
      { field: "bank_details", label: "Bank transaction detail + cancelled cheque", required: true }
    ],
    data_sources: [
      { label: "F&F Dashboard", url: "https://docs.google.com/spreadsheets/d/1QgAWIzrtIK-tx3ZR9aoJzLZxSV7hHmokJVvMBwzz1gI" },
      { label: "F&F Refund / SD tracker", url: "https://docs.google.com/spreadsheets/d/16qBalPtdQyxaJ6aiLvdCpEns0HzoRc84pxi3PBD87Dk" }
    ],
    rule_facts: ["F&F cases are picked every 15 days. SD refunds are picked every week."],
    scenarios: [
      { id: "FNF_1", label: "AP Remarks = FnF Done / GST Issue / Signature Pending / Open Pendency", conditions: ["AP Remarks shows one of these four statuses"], decision: "respond", response: "Reply with the corresponding status template.", template_id: "tpl_fnf_status" },
      { id: "FNF_2", label: "AP Remarks = Deposit Issue / Held by Ops / SD missing", conditions: ["AP Remarks is one of these"], decision: "escalate", decision_level: "L2", response: "L2 checks COD hardstop first; then escalates to L3.", template_id: "tpl_fnf_escalate" },
      { id: "SD_DONE", label: "SD refund — Cost Ops = Refund Done / Pending from Cost Ops", conditions: ["SD tracker shows Cost Ops = Done OR Pending from Cost Ops"], decision: "respond", response: "Reply with the SD status template.", template_id: "tpl_sd_status" },
      { id: "SD_PARTNER_DEP", label: "SD refund — Pending from ops / partner dependency", conditions: ["Cost Ops = Pending from ops / Partner dependency"], decision: "escalate", decision_level: "L3", response: "Escalate to L3 (Sachin Yadav).", template_id: "tpl_sd_escalate" }
    ]
  },
  {
    id: "sop_shipment_count_mismatch",
    team_id: "team_partner_support",
    problem_theme: "Shipment count mismatch in invoice",
    category: "Payments",
    queue: "M_V",
    tat_hours: 24,
    intent: "Captain claims FWD + RVP count in invoice doesn't match actual",
    summary: "Compute delta between invoiced and actual counts from the query; respond with the delta template.",
    trigger_keywords: ["count mismatch", "invoice wrong", "fwd rvp", "shipment count"],
    required_inputs: [
      { field: "hub_code", label: "Hub Code", required: true },
      { field: "invoice_number", label: "Invoice Number", required: true },
      { field: "payment_cycle", label: "Payment Cycle", required: true }
    ],
    data_sources: [{ label: "Captain Payment Status & Amount query", url: "https://metabase-main.bi.meeshogcp.in/question/177461-captain-payment-status-amount" }],
    scenarios: [
      { id: "SCM_1", label: "Compute delta and respond", conditions: ["Pull FWD/RVP actual vs invoiced from query", "Compute Delta = Actual − Invoice"], decision: "respond", response: "Reply with the delta template. Keep ticket 'awaiting user response' — auto-close after 72h.", template_id: "tpl_count_delta" }
    ]
  },
  {
    id: "sop_orders_planning",
    team_id: "team_partner_support",
    problem_theme: "Orders & Planning (load / polygon)",
    category: "Orders & Planning",
    queue: "M_V",
    tat_hours: 12,
    intent: "Captain raises low load, load fluctuation, pin-code change, or RVP reactivation",
    summary: "Run the Orders and Planning View query; action depends on the L1_Remarks column.",
    trigger_keywords: ["load", "volume", "pin code", "polygon", "rvp load", "reactivate"],
    required_inputs: [
      { field: "hub_code", label: "Hub Code", required: true },
      { field: "user_pin", label: "User Pin", required: true }
    ],
    data_sources: [
      { label: "Orders and Planning View query", url: "https://metabase-main.bi.meeshogcp.in/question/177022-orders-planning-view-performance" },
      { label: "Signal Superset (L2)", url: "https://di-prd-superset.meesho.com/" }
    ],
    scenarios: [
      { id: "OP_1", label: "L1_Remarks = Improve RTO Performance", conditions: ["L1_Remarks suggests RTO improvement"], decision: "respond", response: "Improve RTO by X% — load will grow with polygon demand.", template_id: "tpl_orders_rto" },
      { id: "OP_2", label: "L1_Remarks = Max volume for polygon", conditions: ["L1_Remarks indicates max volume"], decision: "respond", response: "Current volume is the max offered. Will grow with polygon demand.", template_id: "tpl_orders_max_vol" },
      { id: "OP_3", label: "L1_Remarks = Escalate to L2", conditions: ["L1_Remarks explicitly flags L2"], decision: "escalate", decision_level: "L2", response: "L2 runs Signal Superset for volume loss drivers.", template_id: "tpl_orders_l2" },
      { id: "OP_4", label: "Pin code add/subtract request", conditions: ["Captain asks to add/remove a pin code"], decision: "escalate", decision_level: "L2", response: "L2 contacts Cluster Head via Slack.", template_id: "tpl_orders_pincode" },
      { id: "OP_5", label: "Load made zero without intimation", conditions: ["Captain's load shows zero unexpectedly"], decision: "escalate", decision_level: "L3", response: "Escalate to L3 (Aman Agrawal).", template_id: "tpl_orders_zero" },
      { id: "OP_6", label: "RVP load zero / reactivate RVP", conditions: ["Captain wants RVP reactivated"], decision: "escalate", decision_level: "L2", response: "Same SOP as forward leg, RVP analytics path.", template_id: "tpl_orders_rvp" },
      { id: "OP_7", label: "Increase RVP load", conditions: ["Captain wants RVP load increased"], decision: "escalate", decision_level: "L2", response: "Same SOP as forward leg, RVP analytics path.", template_id: "tpl_orders_rvp" }
    ]
  },
  {
    id: "sop_cod_pendency",
    team_id: "team_partner_support",
    problem_theme: "COD pendency reflecting wrongly",
    category: "Cash Handover",
    queue: "M_V",
    tat_hours: null,
    intent: "Captain deposited money but COD pendency still reflects",
    summary: "Check live COD pendency + cash handover transaction. If pendency is zero, reassure; if CMS issue, escalate.",
    trigger_keywords: ["cod pendency", "deposited", "cms", "transaction id"],
    required_inputs: [
      { field: "source", label: "Source (CMS / Bank Account)", required: true },
      { field: "transaction_id", label: "Transaction ID", required: true },
      { field: "attachment", label: "Attachment (proof)", required: true }
    ],
    data_sources: [
      { label: "LM DC COD pendency query", url: "https://metabase-main.bi.meeshogcp.in/question/179010-valmo-lmdc-cod-pendency" },
      { label: "Cash handover query", url: "https://metabase-main.bi.meeshogcp.in/question/178927-cash-handover" }
    ],
    scenarios: [
      { id: "COD_1", label: "COD pendency is zero", conditions: ["Current COD pendency for hub = 0"], decision: "respond", response: "Pendency is 0. Closing; partner may reopen after 48h.", template_id: "tpl_cod_zero" },
      { id: "COD_2", label: "CMS not coming to collect", conditions: ["Captain reports CMS partner not collecting"], decision: "escalate", decision_level: "L3", response: "Escalate via L2 to L3 (Riyaz) for CMS alignment.", template_id: "tpl_cms_align" }
    ]
  },
  {
    id: "sop_consumables_order",
    team_id: "team_partner_support",
    problem_theme: "Consumables order issues",
    category: "Consumables",
    queue: "C_V",
    tat_hours: 24,
    intent: "Captain hasn't received consumables or cannot order them",
    summary: "Four scenarios: how-to, whitelisting, order tracking, quantity mismatch.",
    trigger_keywords: ["consumables", "order", "packets", "whitelisting", "tracking"],
    required_inputs: [
      { field: "order_id", label: "Order ID", required: false },
      { field: "hub_id", label: "Hub ID", required: true }
    ],
    data_sources: [{ label: "RVP consumables partner details", url: "https://docs.google.com/spreadsheets/d/1_ghgg3DNq12N2dTma2zkdgPkJbtT0H_aiEegvtB1LSc" }],
    scenarios: [
      { id: "CON_1", label: "How to place an order", conditions: ["Captain asks how to order"], decision: "respond", response: "Reply with ordering process.", template_id: "tpl_con_howto" },
      { id: "CON_2", label: "Not whitelisted", conditions: ["Captain can't order — not whitelisted"], decision: "respond", response: "Collect partner details, whitelist, reply confirming.", template_id: "tpl_con_whitelist" },
      { id: "CON_3a", label: "Tracking — order Delivered", conditions: ["Sheet shows Order Status = Delivered"], decision: "escalate", decision_level: "L3", response: "Loop in the Supplier directly.", template_id: "tpl_con_supplier" },
      { id: "CON_3b", label: "Tracking — order Dispatched", conditions: ["Sheet shows Order Status = Dispatched"], decision: "respond", response: "Share courier + docket; tell captain how to track.", template_id: "tpl_con_tracking" },
      { id: "CON_4a", label: "Qty mismatch — qty matches + Delivered", conditions: ["Captain's qty = sheet qty", "Status = Delivered"], decision: "escalate", decision_level: "L3", response: "Loop in Supplier.", template_id: "tpl_con_supplier" },
      { id: "CON_4c", label: "Qty mismatch — qty does NOT match", conditions: ["Captain's qty ≠ sheet qty"], decision: "escalate", decision_level: "L3", response: "Loop in Supplier.", template_id: "tpl_con_supplier" }
    ]
  },
  {
    id: "sop_consumables_quality",
    team_id: "team_partner_support",
    problem_theme: "Consumables quality (damage / QC)",
    category: "Consumables",
    queue: "C_V",
    tat_hours: 24,
    intent: "Captain reports damaged consumables or secondary QC failure",
    summary: "Both scenarios route directly to supplier (L3 loop-in).",
    trigger_keywords: ["damaged", "qc mismatch", "tampered", "scanning failure"],
    required_inputs: [
      { field: "order_id", label: "Order ID", required: true },
      { field: "hub_id", label: "Hub ID", required: true },
      { field: "video_evidence", label: "Video / photo evidence", required: true }
    ],
    scenarios: [
      { id: "CQ_1", label: "Damaged consumables", conditions: ["Captain shared video of damage"], decision: "escalate", decision_level: "L3", response: "Loop in supplier.", template_id: "tpl_con_damaged" },
      { id: "CQ_2", label: "Secondary QC failure (code mismatch)", conditions: ["Code format mismatch on packets"], decision: "escalate", decision_level: "L3", response: "Loop in supplier with photo.", template_id: "tpl_con_qc" }
    ]
  },
  {
    id: "sop_rvp_consumables_payment",
    team_id: "team_partner_support",
    problem_theme: "RVP consumables payment not received",
    category: "Consumables",
    queue: "C_V",
    tat_hours: null,
    intent: "Captain hasn't received payment for RVP consumables",
    summary: "High-fraud queue. Validate ordered vs claimed packets using the captain payout query before refunding.",
    trigger_keywords: ["rvp payment", "consumable payment", "count mismatch consumables"],
    required_inputs: [
      { field: "hub_id", label: "Hub ID", required: true },
      { field: "order_id", label: "Order ID", required: true },
      { field: "billing_cycle", label: "Billing Cycle", required: true }
    ],
    data_sources: [{ label: "Captain payout query", url: "https://metabase-main.bi.meeshogcp.in/question/177461-captain-payment-status-amount" }],
    rule_facts: [
      "Payment is processed 2 weeks after the order cycle.",
      "Validation formula: rate × count = amount. Query count < captain's stated count → escalate."
    ],
    scenarios: [
      { id: "CP_1a", label: "Partial — query count < stated count", conditions: ["rvp_consumable_packet_count < captain's stated count"], decision: "escalate", decision_level: "L3", response: "Escalate to L3 Cost-Ops.", template_id: "tpl_rvp_escalate" },
      { id: "CP_1b", label: "Partial — count matches query", conditions: ["Count in query = captain's stated count"], decision: "respond", response: "Records match; reply confirming.", template_id: "tpl_rvp_match" },
      { id: "CP_2", label: "No payment — count ≈ 0 in query", conditions: ["rvp_consumable_packet_count ≈ 0 for stated cycles"], decision: "respond", response: "Classified as arrear — paid 2 weeks after order cycle.", template_id: "tpl_rvp_arrear" },
      { id: "CP_3", label: "Manual entries post-scan failure", conditions: ["Captain entered manually after scan failure"], decision: "respond", response: "Same as arrear — refund in next cycle.", template_id: "tpl_rvp_arrear" }
    ]
  },
  {
    id: "sop_tech_issue",
    team_id: "team_partner_support",
    problem_theme: "Tech issue (scan / TMS / app)",
    category: "All Queues",
    queue: "*",
    tat_hours: 24,
    intent: "Captain reports a technical / system error",
    summary: "Two branches: pure tech issue (redirect to Log10) vs tech issue causing a loss (two-track).",
    trigger_keywords: ["tms closed", "scan not working", "system error", "log10", "app error"],
    required_inputs: [],
    scenarios: [
      { id: "TECH_1", label: "Pure tech issue — no loss marked", conditions: ["Scan/system/process error reported", "No loss is being marked"], decision: "respond", response: "Contact Log10 team directly with a screenshot / error message.", template_id: "tpl_tech_team" },
      { id: "TECH_2", label: "Tech issue + loss being marked", conditions: ["System error reported", "Loss is being attributed because of the error"], decision: "escalate", decision_level: "L2", response: "Two-track: captain goes to Log10 with proof, we escalate internally for loss reversal.", template_id: "tpl_tech_plus_loss" }
    ]
  }
];
