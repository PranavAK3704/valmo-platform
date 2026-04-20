import React, { createContext, useContext, useEffect, useState } from "react";
import { HAS_FIREBASE, auth } from "../data/firebase";
import { signInAnonymously, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";

// Simple auth model:
// - A user has: email, name, role (poc | manager | l1), team_id, person_id (link to people)
// - For demo/prototype: email + pick-your-role dropdown → stored in localStorage
// - With Firebase: anonymous auth for a session ID, but profile is still our model
// This gives real auth infrastructure you can swap later for Google SSO / email-link.

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const LS_USER = "valmo:current_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load persisted profile
    try {
      const raw = localStorage.getItem(LS_USER);
      if (raw) setUser(JSON.parse(raw));
    } catch (e) { /* ignore */ }

    if (HAS_FIREBASE) {
      // Ensure there's a Firebase session (anonymous is fine for now)
      const unsub = onAuthStateChanged(auth, (fbUser) => {
        if (!fbUser) {
          signInAnonymously(auth).catch(() => {});
        }
        setReady(true);
      });
      return unsub;
    } else {
      setReady(true);
    }
  }, []);

  const signIn = (profile) => {
    localStorage.setItem(LS_USER, JSON.stringify(profile));
    setUser(profile);
  };

  const signOut = async () => {
    localStorage.removeItem(LS_USER);
    setUser(null);
    if (HAS_FIREBASE) {
      try { await fbSignOut(auth); } catch (e) { /* ignore */ }
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, ready }}>
      {children}
    </AuthContext.Provider>
  );
}
