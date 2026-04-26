<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TechLance Next.js App

This project now runs on Next.js (App Router) with the frontend located in `frontend/`.

## Vertex AI ML Engines (Now Added)

This app now includes 3 ML engines powered by Vertex AI:

1. Idea Similarity + Novelty Scoring
2. Smart Actor Matching Engine
3. Project Success Prediction

### What they do

1. Idea Similarity + Novelty
   - When a project is created, the app generates an embedding for the idea and stores it in Firestore (`embeddings`).
   - Novelty is computed as `1 - max_similarity` against existing projects.
   - You can see this in the post details panel.

2. Smart Actor Matching
   - Actor profiles can be embedded and stored in Firestore (`actorEmbeddings`).
   - The backend ranks actors for a project using embedding similarity + profile signals.
   - If a Vertex ranking endpoint is configured, the same API forwards to your deployed ranking model.

3. Project Success Prediction
   - The backend predicts how likely a project is to complete successfully using project detail quality, budget/timeline fit, novelty, creator readiness, and actor-market fit.
   - If a Vertex project-success endpoint is configured, the API forwards the same feature set to your deployed model.
   - A prediction card is shown on the project details page.

Backend API routes (mounted at `/api/vertex`):

- `POST /embeddings`
- `POST /embeddings/store`
- `POST /embeddings/nearest`
- `GET /novelty/:postId`
- `POST /actors/embed`
- `POST /match`
- `POST /project-success`
- `POST /bid-success`
- `POST /predict`

## Run Locally

Prerequisites: Node.js

1. Install dependencies:
   `npm install`
2. Create `.env.local` at the repository root and add your keys:
   `GEMINI_API_KEY=your_key_here`
   `NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key`
   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com`
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id`
   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com`
   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id`
   `NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id`
3. Start development server:
   `npm run dev`
4. Open:
   `http://localhost:3000`

### Run Backend (Required for Vertex APIs)

This project has a separate Express backend in `backend/`.

1. Start backend:
   `npm run dev:backend`
2. Start frontend:
   `npm run dev`

If both run together on your machine, you can use:

`npm run dev:all`

Note for Windows users: if `dev:all` has shell issues, run the two commands in separate terminals.

## Production Commands

1. Build:
   `npm run build`
2. Start production server:
   `npm run start`

## Firebase Setup (Required)

### 1. Create Firebase Project

1. Open Firebase Console.
2. Create a new project.
3. Add a Web App inside the project.
4. Copy Firebase config values into `.env.local`.

### 2. Enable Firebase Authentication

1. Go to Build > Authentication > Sign-in method.
2. Enable Email/Password provider.
3. Save changes.

### Firebase Admin Credentials for Backend

Backend Vertex routes use Firebase Admin and Vertex AI.

1. Create a Google Cloud service account with permissions:
   - Vertex AI User
   - Firestore User (or Editor for quick setup)
2. Download JSON key.
3. Set env var before running backend:
   - Windows PowerShell:
     `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"`
4. Also run once:
   - `gcloud auth application-default login`

If you see `PERMISSION_DENIED` from `/api/vertex/*` routes, your service account is missing IAM roles.
Grant these roles to the service account used by backend:

- `Vertex AI User`
- `Cloud Datastore User` (Firestore)
- Optional for easier setup: `Editor` (not recommended for production)

PowerShell (copy/paste) for this project:

```powershell
gcloud projects add-iam-policy-binding techlance-28e1b --member="serviceAccount:vertex-ai-service@techlance-28e1b.iam.gserviceaccount.com" --role="roles/aiplatform.user"
gcloud projects add-iam-policy-binding techlance-28e1b --member="serviceAccount:vertex-ai-service@techlance-28e1b.iam.gserviceaccount.com" --role="roles/datastore.user"
```

After granting roles, restart backend and run health check:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3001/api/vertex/health | ConvertTo-Json -Depth 8
```

Expected healthy state:
- `checks.vertexEmbeddings.ok = true`
- `checks.firestoreRead.ok = true`
- `checks.firestoreWrite.ok = true`

### 3. Enable Firestore Database

1. Go to Build > Firestore Database.
2. Create database in production mode.
3. Choose your region.

### 4. Enable Firebase Storage

1. Go to Build > Storage.
2. Create a storage bucket.
3. Use rules that only allow each signed-in user to access their own upload folder.

Starter Storage rules:

```txt
rules_version = '2';
service firebase.storage {
   match /b/{bucket}/o {
      match /users/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
      }
   }
}
```

### 5. Add Firestore Security Rules (Starter)

Use these rules first, then tighten based on your app needs:

```txt
rules_version = '2';
service cloud.firestore {
   match /databases/{database}/documents {
      match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /authLogs/{logId} {
         allow create: if request.auth != null;
         allow read: if false;
         allow update, delete: if false;
      }

      match /projectPosts/{postId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null && request.resource.data.createdBy == request.auth.uid;
         allow update, delete: if request.auth != null && resource.data.createdBy == request.auth.uid;
      }

      match /offers/{offerId} {
         allow read, create: if request.auth != null;
         allow update: if request.auth != null;
         allow delete: if false;
      }

      match /products/{productId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null && request.resource.data.supplierId == request.auth.uid;
         allow update, delete: if request.auth != null && resource.data.supplierId == request.auth.uid;
      }

      match /savedPosts/{savedPostId} {
         allow read, write: if request.auth != null && request.resource.data.uid == request.auth.uid;
      }
   }
}
```

## What Is Already Wired In Code

1. Firebase Auth email/password sign-in and sign-up.
2. User profile document upsert in Firestore collection `users`.
3. Login/register/logout/onboarding event logging in Firestore collection `authLogs`.
4. Route-level auth guard in app router entry.
5. Sign out now uses Firebase signOut.
6. Registration file inputs upload to Firebase Storage and save file URLs/metadata on the user profile.
7. Live project posts, offers, and supplier products are stored in Firestore.
8. Vertex embeddings are created/stored for projects and queried for novelty.
9. Actor embedding sync and actor ranking API are available.
10. Project success prediction is available through `/api/vertex/project-success` and the post details sidebar.

## Beginner Step-by-Step (Do This)

1. Install dependencies:
   `npm install`
2. Fill `.env.local` with Firebase + Vertex vars.
   - `VERTEX_EMBEDDING_MODEL=text-embedding-004`
   - Optional endpoint vars:
     - `VERTEX_RANKING_ENDPOINT_ID=YOUR_ENDPOINT_ID`
     - `VERTEX_BID_ENDPOINT_ID=YOUR_ENDPOINT_ID`
     - `VERTEX_PROJECT_SUCCESS_ENDPOINT_ID=YOUR_ENDPOINT_ID`
3. Set `GOOGLE_APPLICATION_CREDENTIALS` to your service account key.
4. Start backend: `npm run dev:backend`
5. Start frontend: `npm run dev`
6. Create a project from Create Look-In page.
7. Open that post detail page. You should see:
   - Project success prediction
   - Novelty score
   - Smart actor ranking panel
8. If you have actors, set role to actor and log in once to trigger actor embedding sync.

## Train + Deploy Ranking Model on Vertex AI

This repo includes helper scripts:

- Export dataset: `npm run ml:export-ranking-data`
- Full guide: `scripts/train-ranking-model.md`

Flow:

1. Export `ranking-dataset.csv` from Firestore offers + embeddings.
2. Upload to GCS.
3. Train a tabular model in Vertex AI.
4. Deploy to endpoint.
5. Put endpoint ID in `.env.local`:
   `VERTEX_RANKING_ENDPOINT_ID=YOUR_ENDPOINT_ID`

Then `/api/vertex/match` and `/api/vertex/predict` can route inference to that endpoint.

## Train + Deploy Project Success Model on Vertex AI

This repo also includes project-success training helpers:

- Export dataset: `npm run ml:export-project-success-data`
- Full guide: `scripts/train-project-success-model.md`

Flow:

1. Export `project-success-dataset.csv` from Firestore posts + embeddings.
2. Upload to GCS.
3. Train a tabular classification model in Vertex AI.
4. Deploy to endpoint.
5. Put endpoint ID in `.env.local`:
   `VERTEX_PROJECT_SUCCESS_ENDPOINT_ID=YOUR_ENDPOINT_ID`

Then `/api/vertex/project-success` can route inference to that endpoint.
