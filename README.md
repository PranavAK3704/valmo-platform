# Valmo Ops — Partner Support Platform

Internal platform for Meesho's Valmo Partner Support team and adjacent pods.

Two top-level surfaces:
1. **Playbook** — multi-team SOP library. Agents browse, POCs author and publish. Becomes the single source of truth for your Chrome extension.
2. **Alignments** — structured dependency requests with TATs, auto-cc of managers, and a dashboard showing who's blocking you (the thing you bring to GM reviews).

Three roles:
- **POC** — full access: author SOPs, raise alignments, respond to alignments
- **Manager** — read-only oversight, automatically cc'd on team alignments
- **L1 Agent** — SOP playbook only, read-only

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Run dev server (works locally with localStorage — no Firebase needed)
npm run dev

# 3. Build for production
npm run build

# 4. Preview the production build
npm run preview
```

Open http://localhost:5173. On first load, pick any person from the sign-in dropdown — Pranav (POC) to see everything, Aakash (L1) to see the read-only agent view, or a manager to see oversight mode.

---

## Firebase setup (for multi-user deployment)

**Without Firebase,** data lives in your browser's localStorage — great for local demos, but each user sees only their own browser's data.

**With Firebase,** SOPs, templates, alignments, teams, and people are all stored in Firestore — multiple users see the same live data.

### Step 1 — Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project**, name it (e.g. `valmo-ops`)
3. Disable Google Analytics (not needed)

### Step 2 — Enable Firestore

1. In the Firebase Console, open **Build → Firestore Database**
2. Click **Create database**
3. Start in **Production mode** (we'll set rules next)
4. Pick a location close to you (e.g. `asia-south1` for Mumbai)

### Step 3 — Set Firestore security rules

In **Firestore → Rules**, paste this starter rule set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // V1: allow any authenticated user to read/write everything.
    // Tighten later when you add proper user management.
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

### Step 4 — Enable Anonymous Authentication

1. In the Firebase Console, open **Build → Authentication**
2. Click **Get started**
3. On the **Sign-in method** tab, click **Anonymous** and **Enable**
4. Save

(Anonymous auth is enough for v1 — the app's internal role system handles who-is-who. You can swap in Google SSO or email-link auth later.)

### Step 5 — Get your web app config

1. In Firebase Console, click the ⚙ gear → **Project settings**
2. Scroll down to **Your apps** → click the **`</>`** (Web) icon
3. Register the app (any nickname works)
4. Copy the config values shown

### Step 6 — Create .env.local

In the project root, create a file called `.env.local`:

```bash
VITE_FIREBASE_API_KEY=AIza...your_actual_key
VITE_FIREBASE_AUTH_DOMAIN=valmo-ops.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=valmo-ops
VITE_FIREBASE_STORAGE_BUCKET=valmo-ops.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

Restart `npm run dev`. The sign-in screen will no longer show the "Local mode" banner.

**First run will auto-seed Firestore** with the 12 SOPs, 37 templates, 13 people, 4 teams, and 6 sample alignments from the included seed data.

---

## Deployment

Any static host works since this is a Vite SPA. A few options:

### Option A — Vercel (easiest)

```bash
npm install -g vercel
vercel
```

Follow the prompts. Set the env vars in Vercel Dashboard → Project Settings → Environment Variables (paste the same VITE_FIREBASE_* keys).

### Option B — Firebase Hosting (keeps everything in Google)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# When asked: public directory = dist
# Single-page app = Yes
# Set up automatic builds with GitHub = No (unless you want that)

npm run build
firebase deploy --only hosting
```

### Option C — Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

Don't forget to set the VITE_FIREBASE_* env vars in your host's dashboard.

---

## Project structure

```
src/
├── main.jsx              # entry point
├── App.jsx               # routing + auth gate
├── styles.css            # design system
│
├── data/
│   ├── firebase.js       # Firebase init
│   ├── storage.js        # Firestore/localStorage adapter
│   ├── seedSops.js       # 12 SOPs from the Google Doc
│   ├── seedTemplates.js  # 37 reply templates
│   └── seedTeams.js      # teams, people, sample alignments
│
├── context/
│   ├── AuthContext.jsx   # current user + sign in/out
│   └── DataContext.jsx   # all collections, CRUD ops
│
├── components/
│   ├── Nav.jsx           # left sidebar
│   ├── Toast.jsx
│   └── helpers.js        # TAT formatting, permissions
│
└── pages/
    ├── auth/
    │   └── SignIn.jsx
    ├── playbook/
    │   ├── PlaybookHome.jsx
    │   ├── SopDetail.jsx
    │   ├── AddSopForm.jsx
    │   ├── TemplatesAdmin.jsx
    │   └── ExportView.jsx
    └── alignments/
        ├── Directory.jsx
        ├── PersonProfile.jsx
        ├── NewAlignment.jsx
        ├── Inbox.jsx
        ├── AlignmentDetail.jsx
        └── Dashboard.jsx
```

---

## Next steps to harden for real use

- **Real SSO** — swap anonymous Firebase auth for Google SSO (restrict to your meesho.com domain)
- **Real notifications** — hook Firebase Cloud Messaging or a simple SendGrid-backed Cloud Function to email the receiver + cc'd managers when an alignment is raised
- **Audit log** — add a `status_history` array to alignments so every state transition is recorded with who and when
- **Attachments** — upload to Firebase Storage and link from the alignment
- **L2 SLA policies** — encode per-team default TATs so new alignments suggest the right deadline automatically
- **Chrome extension wiring** — the Export view gives you the JSON shape; point the extension at `https://firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents/sops` or a Cloud Function that serves the merged payload

---

## License

Internal tool — not for redistribution outside Meesho.
