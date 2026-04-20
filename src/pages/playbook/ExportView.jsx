import React, { useState } from "react";
import { Download, Copy } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../components/Toast";

export default function ExportView() {
  const { sops, templates } = useData();
  const { show } = useToast();
  const [tab, setTab] = useState("sops");

  const payload = tab === "sops" ? sops : tab === "templates" ? templates : { sops, templates };
  const json = JSON.stringify(payload, null, 2);

  const download = () => {
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = tab === "sops" ? "sops.json" : tab === "templates" ? "templates.json" : "valmo_playbook.json";
    a.click();
  };

  const copyJson = () => {
    navigator.clipboard.writeText(json);
    show("Copied");
  };

  return (
    <div className="content on-paper">
      <div className="content-inner">
        <div className="page-header">
          <div className="page-crumb">Admin · Export</div>
          <h1 className="page-title">Export for the <em>Chrome extension</em></h1>
          <p className="page-subtitle">
            This is the machine-readable JSON your Chrome extension can fetch. Point the extension at this data
            structure instead of the Google Doc — same shape as the one generated for you originally.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button className={`btn ${tab === "sops" ? "primary" : ""}`} onClick={() => setTab("sops")}>SOPs only ({sops.length})</button>
          <button className={`btn ${tab === "templates" ? "primary" : ""}`} onClick={() => setTab("templates")}>Templates only ({templates.length})</button>
          <button className={`btn ${tab === "both" ? "primary" : ""}`} onClick={() => setTab("both")}>Full payload</button>
          <button className="btn" style={{ marginLeft: "auto" }} onClick={copyJson}><Copy size={13} /> Copy</button>
          <button className="btn primary" onClick={download}><Download size={13} /> Download .json</button>
        </div>

        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="json-viewer">{json}</div>
        </div>

        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="admin-card-head"><h3 className="admin-card-title">How to wire the Chrome extension</h3></div>
          <ol style={{ lineHeight: 1.8, color: "var(--text-dark)", paddingLeft: 18 }}>
            <li>Download the JSON above (or fetch it from your deployed Firestore).</li>
            <li>Point the extension at the endpoint instead of the Google Doc.</li>
            <li>The extension's search + display logic stays the same — data shape matches.</li>
            <li>When <code>template_id</code> resolves, render from the templates map.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
