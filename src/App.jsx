import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import { ToastProvider } from "./components/Toast";
import { can } from "./components/helpers";

import Nav from "./components/Nav";
import SignIn from "./pages/auth/SignIn";

import PlaybookHome from "./pages/playbook/PlaybookHome";
import SopDetail from "./pages/playbook/SopDetail";
import AddSopForm from "./pages/playbook/AddSopForm";
import TemplatesAdmin from "./pages/playbook/TemplatesAdmin";
import ExportView from "./pages/playbook/ExportView";

import Directory from "./pages/alignments/Directory";
import PersonProfile from "./pages/alignments/PersonProfile";
import NewAlignment from "./pages/alignments/NewAlignment";
import Inbox from "./pages/alignments/Inbox";
import AlignmentDetail from "./pages/alignments/AlignmentDetail";
import Dashboard from "./pages/alignments/Dashboard";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <Shell />
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

function Shell() {
  const { user, ready } = useAuth();
  const { loading } = useData();

  if (!ready || loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink)", color: "var(--text-mute)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "var(--paper)" }}>
            Valmo <em style={{ color: "var(--signal)" }}>·</em> Ops
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-faint)", marginTop: 8, letterSpacing: "0.08em" }}>
            loading…
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  const canViewAlignments = can.viewAlignments(user);

  return (
    <div className="app">
      <Nav />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/playbook" replace />} />

          {/* Playbook — all roles */}
          <Route path="/playbook" element={<PlaybookHome />} />
          <Route path="/playbook/new" element={
            can.editSops(user) ? <AddSopForm /> : <Navigate to="/playbook" replace />
          } />
          <Route path="/playbook/templates" element={
            can.editTemplates(user) ? <TemplatesAdmin /> : <Navigate to="/playbook" replace />
          } />
          <Route path="/playbook/export" element={
            can.editSops(user) ? <ExportView /> : <Navigate to="/playbook" replace />
          } />
          <Route path="/playbook/:sopId" element={<SopDetail />} />

          {/* Alignments — POC and Manager only */}
          {canViewAlignments ? (
            <>
              <Route path="/alignments" element={<Navigate to="/alignments/inbox" replace />} />
              <Route path="/alignments/directory" element={
                can.createAlignments(user) ? <Directory /> : <Navigate to="/alignments/inbox" replace />
              } />
              <Route path="/alignments/person/:personId" element={<PersonProfile />} />
              <Route path="/alignments/new" element={
                can.createAlignments(user) ? <NewAlignment /> : <Navigate to="/alignments/inbox" replace />
              } />
              <Route path="/alignments/inbox" element={<Inbox />} />
              <Route path="/alignments/sent" element={<Inbox />} />
              <Route path="/alignments/dashboard" element={<Dashboard />} />
              <Route path="/alignments/:alignmentId" element={<AlignmentDetail />} />
            </>
          ) : (
            <Route path="/alignments/*" element={<Navigate to="/playbook" replace />} />
          )}

          <Route path="*" element={<Navigate to="/playbook" replace />} />
        </Routes>
      </main>
    </div>
  );
}
