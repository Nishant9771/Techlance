# TechLance

TechLance is a role-based engineering collaboration platform with three user roles:
- `user` (project owner)
- `actor` (engineer/freelancer)
- `supplier` (parts/services supplier)

It includes:
- Next.js frontend (`frontend/`)
- Express + Vertex backend (`backend/`)
- Firebase Auth + Firestore + Storage
- Blockchain trust utilities (Polygon Amoy)
- AI/ML APIs for ranking, novelty, fraud checks, pricing, and project success

## Current Status (Verified)

As of this update:
- Firestore backend health is passing (`firestoreRead.ok = true`, `firestoreWrite.ok = true`).
- Storage/retrieval paths for all roles (`user`, `actor`, `supplier`) are working through backend routes.
- Firestore security rules + indexes are deployed for this project.
- Left sidebar profile cards in dashboards now use signed-in Firebase profile data (no hardcoded `John Doe`).

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript
- Backend: Express, TypeScript runtime via `tsx`
- Database: Firebase Firestore
- Auth: Firebase Authentication
- Files: Firebase Storage
- AI: Google Vertex AI + local fallback logic
- Chain: Ethers + Polygon Amoy

## Project Structure

```txt
.
|- frontend/
|  |- src/
|  |  |- views/
|  |  |- lib/
|  |  |- context/
|- backend/
|  |- routes/
|  |- services/
|  |- scripts/
|  |- firebaseAdmin.ts
|- firestore.rules
|- firestore.indexes.json
|- firebase.json
|- .firebaserc
```

## Environment Setup

### 1) Root `.env.local` (frontend + shared)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_API_BASE=http://localhost:3001/api/vertex
NEXT_PUBLIC_ML_API_BASE=http://localhost:3001/api
```

### 2) `backend/.env` (backend)

```env
PORT=3001
GCP_PROJECT=techlance-28e1b
FIREBASE_PROJECT_ID=techlance-28e1b
GOOGLE_APPLICATION_CREDENTIALS=backend/vertex-key.json

VERTEX_LOCATION=us-central1
VERTEX_EMBEDDING_MODEL=text-embedding-004
VERTEX_RANKING_ENDPOINT_ID=
VERTEX_BID_ENDPOINT_ID=
VERTEX_PROJECT_SUCCESS_ENDPOINT_ID=
VERTEX_FRAUD_ENDPOINT_ID=
VERTEX_PROPOSAL_COPILOT_MODEL=gemini-2.0-flash-001

RPC_URL=...
PRIVATE_KEY=...
CONTRACT_ADDRESS=...
ESCROW_CONTRACT_ADDRESS=...
```

### 3) Service Account Key

Place your Firebase/GCP service account key at:
- `backend/vertex-key.json`

Must include Firestore access role(s):
- `roles/datastore.user` (minimum)
- `roles/aiplatform.user` (for Vertex APIs)

## Install and Run

```bash
npm install
npm run dev:backend
npm run dev
```

Open:
- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:3001/api/vertex/health`

## Firebase Deploy Commands

Rules and indexes are configured in repo (`firebase.json` + `.firebaserc`):

```bash
npm run firebase:rules
npm run firebase:indexes
```

## Firestore Data Model (Core Collections)

- `users`
- `projects`
- `projectPosts`
- `offers`
- `products`
- `applications`
- `milestones`
- `reviews`
- `notifications/{uid}/items`
- `chats/{roomId}/messages`
- `ai_analysis`
- `blockchain_proofs`
- `authLogs`
- `savedPosts`

## Role Flows

### User
- Register/login
- Create project/look-in
- Track applications, milestones, AI analysis, and trust data

### Actor
- Register/login
- Browse projects
- Submit offers/applications
- Access role-based dashboard data

### Supplier
- Register/login
- Add products
- Suggest components and respond to needs

## Jury Demo Runbook (10-12 min)

### Step 1: Start app
- `npm run dev:backend`
- `npm run dev`
- Show backend health endpoint with Firestore checks passing.

### Step 2: Authentication
- Create/login one account per role (`user`, `actor`, `supplier`).
- Show each profile in Firestore `users` collection.

### Step 3: User flow
- Create a project/look-in.
- Show document in `projectPosts` and normalized `projects` collection.

### Step 4: Actor flow
- Actor sends application/offer.
- Show `applications` and `projects/{id}/applications` updates.

### Step 5: Supplier flow
- Supplier adds product.
- Show `products` collection update.

### Step 6: Realtime retrieval
- Refresh dashboards and show data rendered from Firestore (not hardcoded).

### Step 7: AI + trust
- Open project intelligence/post details.
- Show AI analysis endpoint output and stored records where applicable.

## Sidebar Profile Sync Fix

Dashboard sidebars now render signed-in profile values:
- Name from Firebase Auth / Firestore profile
- Role from Firestore profile role
- Avatar from Firebase photo URL or deterministic fallback

Updated files:
- `frontend/src/views/UserDashboard.tsx`
- `frontend/src/views/ActorDashboard.tsx`
- `frontend/src/views/SupplierDashboard.tsx`

## Useful Health Checks

```bash
# Backend AI + Firestore health
curl http://localhost:3001/api/vertex/health
```

Expected:
- `checks.vertexEmbeddings.ok = true`
- `checks.firestoreRead.ok = true`
- `checks.firestoreWrite.ok = true`

## Troubleshooting

### Firestore not writing
- Verify backend health endpoint.
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path.
- Ensure Firestore rules deployed.
- Ensure user is authenticated for frontend direct writes.

### Rules error in frontend writes
- Run `npm run firebase:rules` again.
- Check collection path matches rules.

### Missing indexes
- Run `npm run firebase:indexes`.

## Update GitHub Repo (Beginner Friendly)

Run from project root:

```bash
git status
git add frontend/src/views/UserDashboard.tsx frontend/src/views/ActorDashboard.tsx frontend/src/views/SupplierDashboard.tsx backend/firebaseAdmin.ts backend/routes/blockchain.js firestore.rules firebase.json .firebaserc README.md
git commit -m "Fix Firebase data flow, profile sidebar sync, and improve README"
git remote -v
# if remote missing:
# git remote add origin https://github.com/<your-username>/techlance.git
git push origin main
```

If your branch is not `main`, replace with your current branch name.

## License

MIT
