import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  readCollection, writeDoc, deleteDocument, seedIfEmpty, writeCollection
} from "../data/storage";
import { SEED_SOPS } from "../data/seedSops";
import { SEED_TEMPLATES } from "../data/seedTemplates";
import { SEED_TEAMS, SEED_PEOPLE, SEED_ALIGNMENTS } from "../data/seedTeams";

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const [sops, setSops] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [people, setPeople] = useState([]);
  const [alignments, setAlignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, tm, p, a] = await Promise.all([
        seedIfEmpty("sops", SEED_SOPS),
        seedIfEmpty("templates", SEED_TEMPLATES),
        seedIfEmpty("teams", SEED_TEAMS),
        seedIfEmpty("people", SEED_PEOPLE),
        seedIfEmpty("alignments", SEED_ALIGNMENTS)
      ]);
      setSops(s);
      setTemplates(t);
      setTeams(tm);
      setPeople(p);
      setAlignments(a);
    } catch (e) {
      console.error("Load failed", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ===== SOPs =====
  const saveSop = async (sop) => {
    const saved = await writeDoc("sops", sop.id, sop);
    setSops(prev => {
      const idx = prev.findIndex(s => s.id === sop.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    return saved;
  };
  const removeSop = async (id) => {
    await deleteDocument("sops", id);
    setSops(prev => prev.filter(s => s.id !== id));
  };

  // ===== Templates =====
  const saveTemplate = async (tpl) => {
    const saved = await writeDoc("templates", tpl.id, tpl);
    setTemplates(prev => {
      const idx = prev.findIndex(x => x.id === tpl.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    return saved;
  };
  const removeTemplate = async (id) => {
    await deleteDocument("templates", id);
    setTemplates(prev => prev.filter(x => x.id !== id));
  };
  const bulkTemplates = async (arr) => {
    // Merge-insert a batch of templates
    for (const tpl of arr) await writeDoc("templates", tpl.id, tpl);
    setTemplates(prev => {
      const map = new Map(prev.map(x => [x.id, x]));
      for (const tpl of arr) map.set(tpl.id, tpl);
      return Array.from(map.values());
    });
  };

  // ===== Teams =====
  const saveTeam = async (team) => {
    const saved = await writeDoc("teams", team.id, team);
    setTeams(prev => {
      const idx = prev.findIndex(x => x.id === team.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    return saved;
  };

  // ===== People =====
  const savePerson = async (p) => {
    const saved = await writeDoc("people", p.id, p);
    setPeople(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    return saved;
  };
  const removePerson = async (id) => {
    await deleteDocument("people", id);
    setPeople(prev => prev.filter(x => x.id !== id));
  };

  // ===== Alignments =====
  const saveAlignment = async (al) => {
    const saved = await writeDoc("alignments", al.id, al);
    setAlignments(prev => {
      const idx = prev.findIndex(x => x.id === al.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    return saved;
  };
  const removeAlignment = async (id) => {
    await deleteDocument("alignments", id);
    setAlignments(prev => prev.filter(x => x.id !== id));
  };

  // ===== Reset =====
  const resetAll = async () => {
    await writeCollection("sops", SEED_SOPS);
    await writeCollection("templates", SEED_TEMPLATES);
    await writeCollection("teams", SEED_TEAMS);
    await writeCollection("people", SEED_PEOPLE);
    await writeCollection("alignments", SEED_ALIGNMENTS);
    await loadAll();
  };

  return (
    <DataContext.Provider value={{
      sops, templates, teams, people, alignments, loading,
      saveSop, removeSop,
      saveTemplate, removeTemplate, bulkTemplates,
      saveTeam,
      savePerson, removePerson,
      saveAlignment, removeAlignment,
      resetAll, reload: loadAll
    }}>
      {children}
    </DataContext.Provider>
  );
}
