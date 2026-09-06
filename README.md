# MindEcho - Multi-Turn AI Journaling & Reflection Platform

MindEcho is an enterprise-grade, user-authenticated AI journaling and psychological reflection web application built on **React 19**, **Express**, **Firebase Authentication**, **Cloud Firestore**, and Google's **`@google/genai` SDK** utilizing `gemini-3.6-flash`.

---

## Architecture Overview

- **Frontend**: React 19, Tailwind CSS, Lucide icons, Motion layout animations.
- **Backend API Server**: Node.js & Express server handling server-side Gemini API proxies, resilient fallback ladders, and audio buffer ingestion.
- **Authentication**: Firebase Authentication via Federated Google Sign-In (OAuth 2.0).
- **Database & Persistence**: Google Cloud Firestore with owner-isolated security rules and undefined-stripped payload sanitization.
- **AI Engine**: Gemini 3.6 Flash with automated fallback across `gemini-3.1-flash-lite`, `gemini-flash-latest`, and `gemini-3.7-flash` for multi-turn empathetic reflection, verbatim voice transcription, and emotion tagging.

---

## 1. Cloud Firestore Security Rules

To enforce strict user-level data isolation where users can only read, write, update, and delete their own profile documents, reflection entries, and sub-interactions, deploy the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /entries/{entryId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 2. Google Cloud Secret Manager Setup

All API keys (including `GEMINI_API_KEY`) are kept strictly server-side and never exposed to client browsers.

```bash
# Set your active GCP Project ID
export PROJECT_ID="YOUR_PROJECT_ID"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Enable necessary Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com

# Create and populate the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Google Cloud Run Deployment Flow

Deploy the containerized full-stack application directly to Google Cloud Run:

```bash
# Build and deploy service to Cloud Run
gcloud run deploy mindecho-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars=NODE_ENV=production
```

---

## 4. Mandatory Campaign Verification Label

Register the service for automated challenge verification:

```bash
gcloud run services update mindecho-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in your GEMINI_API_KEY in .env

# 3. Start full-stack dev server
npm run dev

# 4. Build for production
npm run build

# 5. Launch compiled production server
npm start
```
