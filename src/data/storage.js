// Storage adapter.
// - If Firebase is configured: reads/writes Firestore collections.
// - Otherwise: uses localStorage, keyed per collection.
// API:
//   await readCollection(name)   -> array of {id, ...data}
//   await writeDoc(name, id, data)
//   await deleteDoc(name, id)
//   await seedIfEmpty(name, seedArr)  (seed data on first run)

import { HAS_FIREBASE, db } from "./firebase";
import {
  collection, getDocs, setDoc, deleteDoc as fsDelete,
  doc, query, orderBy
} from "firebase/firestore";

const LS_PREFIX = "valmo:";

// ---------- localStorage driver ----------
const ls = {
  async readCollection(name) {
    try {
      const raw = localStorage.getItem(LS_PREFIX + name);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error("LS read failed", name, e);
      return [];
    }
  },
  async writeDoc(name, id, data) {
    const all = await this.readCollection(name);
    const idx = all.findIndex(x => x.id === id);
    const withId = { ...data, id };
    if (idx >= 0) all[idx] = withId;
    else all.push(withId);
    localStorage.setItem(LS_PREFIX + name, JSON.stringify(all));
    return withId;
  },
  async deleteDoc(name, id) {
    const all = await this.readCollection(name);
    const next = all.filter(x => x.id !== id);
    localStorage.setItem(LS_PREFIX + name, JSON.stringify(next));
  },
  async writeCollection(name, items) {
    localStorage.setItem(LS_PREFIX + name, JSON.stringify(items));
  }
};

// ---------- Firestore driver ----------
const fb = {
  async readCollection(name) {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async writeDoc(name, id, data) {
    const ref = doc(db, name, id);
    const { id: _ignore, ...rest } = data;
    await setDoc(ref, rest, { merge: true });
    return { ...data, id };
  },
  async deleteDoc(name, id) {
    await fsDelete(doc(db, name, id));
  },
  async writeCollection(name, items) {
    // Used only for seeding; write each doc
    for (const item of items) {
      const { id, ...rest } = item;
      await setDoc(doc(db, name, id), rest);
    }
  }
};

const driver = HAS_FIREBASE ? fb : ls;

export const readCollection = (name) => driver.readCollection(name);
export const writeDoc = (name, id, data) => driver.writeDoc(name, id, data);
export const deleteDocument = (name, id) => driver.deleteDoc(name, id);
export const writeCollection = (name, items) => driver.writeCollection(name, items);

export async function seedIfEmpty(name, seedArr) {
  const existing = await readCollection(name);
  if (existing.length > 0) return existing;
  await writeCollection(name, seedArr);
  return seedArr;
}
