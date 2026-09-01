# Sympra Firestore-Only Deployment Guide

This project deploys as a Firebase application without Firebase Storage. Firebase Authentication and Cloud Firestore provide the runtime services, while Firebase Hosting serves the Vite frontend. The legacy Express/MongoDB backend has been removed from the repository and is not required. If an old Render service remains visible in your Render dashboard, delete or suspend that external service manually; deploying Firebase cannot remove resources already created in Render.

## Prerequisites

Install Node.js 20 or newer and the Firebase CLI, then authenticate the CLI with an account that has access to the configured Firebase project.

```bash
npm install -g firebase-tools
firebase login
cd frontend
firebase use healthcare-referral-syst-8e790
npm install
```

## Firebase console setup

Enable **Authentication → Sign-in method → Email/Password** and create the Cloud Firestore database. No Firebase Storage bucket or paid Storage setup is required.

The web configuration in `frontend/src/firebase/config.ts` is populated for the active Firebase web app. For a different project, copy `frontend/.env.example` to `frontend/.env.local` and provide all `VITE_FIREBASE_*` values. Do not use service-account JSON or private keys in frontend environment variables.

## Deploy

From the `frontend` directory:

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

The command publishes the compiled `dist` directory and `firestore.rules`. The Hosting rewrite sends all application routes to `index.html`, preserving React Router navigation after refresh.

## Firestore-only attachment policy

The app stores small attachment files as base64 data in the corresponding Firestore document. Patient attachments are limited to 650 KB and profile avatars to 150 KB. Larger files are rejected because Firebase Storage is intentionally disabled. This keeps the application on Firestore and avoids the paid Storage dependency, at the cost of lower attachment capacity.

## Administrator bootstrap

Public registration deliberately does not offer the administrator role. Register the first account through the application, copy its Firebase Auth UID, and set the matching Firestore document `users/{uid}.role` to `admin` through an approved administrative process. Keep the organization name accurate because referral and laboratory rules use it for organization scoping.

## Verification checklist

After deployment, open the Hosting URL and verify registration, login, password-reset email, patient creation, referral creation, small attachment upload/download, and logout. The browser console should not show Firebase initialization or permission errors.

## Operational rules

Do not deploy `backend/` to Render, do not configure MongoDB Atlas for the application, and do not add `VITE_API_URL`; the frontend no longer calls an Express API. Do not replace the published rules with `allow read, write: if true` rules. Healthcare records and inline attachments must remain behind authenticated Firestore access.

## Troubleshooting

| Symptom | Check |
|---|---|
| `auth/operation-not-allowed` | Enable Email/Password under Firebase Authentication sign-in providers. |
| `permission-denied` after login | Confirm the signed-in user has a `users/{uid}` profile and a supported `role`; publish the rules again. |
| Attachment upload fails | Confirm the file is under 650 KB and the user role is allowed. |
| Password reset email does not arrive | Check Firebase Authentication email templates, authorized domains, spam filtering, and the recipient address. |
| Blank page after refresh | Confirm the Hosting rewrite is deployed and the URL is the Firebase Hosting domain. |
| Build fails in PowerShell | Run `npm install` in `frontend` and then `npm run build`; the build script invokes local binary shims directly. |

## Historical data migration

The codebase no longer reads MongoDB or the Express API. If historical data must be retained, export it from the legacy database, transform it into the Firestore collection shapes documented in `frontend/src/firebase/firestore.ts`, and import it with a one-time trusted migration script using Firebase Admin SDK credentials kept outside the repository. Never run that import from the browser.
