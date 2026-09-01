# Sympra Healthcare Referral System

Sympra is a healthcare referral workspace for clinics, hospitals, laboratories, and administrators. The application is **Firebase-native and Firestore-only**: Firebase Authentication manages accounts and sessions, Cloud Firestore stores user profiles and healthcare records, and Firebase Hosting serves the Vite frontend. Firebase Storage is deliberately not used.

## Architecture

| Area | Firebase service | Application location |
|---|---|---|
| Authentication | Firebase Authentication with email/password | `frontend/src/firebase/auth.ts` |
| User profiles and roles | Cloud Firestore `users/{uid}` | `frontend/src/firebase/auth.ts` |
| Clinical records and inline attachments | Cloud Firestore collections | `frontend/src/firebase/firestore.ts` |
| Access control | Firestore Security Rules | `frontend/firestore.rules` |
| Web delivery | Firebase Hosting with SPA fallback | `frontend/firebase.json` |

The old Express/MongoDB service under `backend/` has been removed from this repository and is not part of the application runtime or deployment path. If a Render service still appears in your Render dashboard, it is an external account resource; delete or suspend it there because repository changes cannot remove an already-created Render service.

## Local development

```bash
cd frontend
npm install
npm run dev
```

The application uses the Firebase project configured in `frontend/.firebaserc`. The active web configuration is included in `frontend/src/firebase/config.ts`; optional `VITE_FIREBASE_*` variables can override it for another project. Copy `.env.example` to `.env.local` only when an override is needed.

## Production build and deployment

```bash
cd frontend
npm install
npm run build
firebase deploy --only hosting,firestore:rules
```

The build performs the TypeScript check and Vite production build through a cross-platform Node runner. The deployment publishes the compiled `dist` directory and Firestore security rules.

## Firestore-only file policy

Attachments are stored inline in Firestore as base64 data. To stay below Firestore’s document-size limit, patient attachments are limited to 650 KB and avatars to 150 KB. Larger files are intentionally rejected because the project does not use Firebase Storage or another paid object-storage service.

## Firebase console setup

Enable **Authentication → Sign-in method → Email/Password** and create a Cloud Firestore database. The deployment command publishes the repository’s security rules; do not replace them with open read/write rules.

Public registration permits clinic, hospital, and laboratory accounts. Administrator access is not self-service. Register the first account, then update the matching `users/{uid}.role` field to `admin` through an approved administrative process.

Password changes use Firebase’s native, time-limited reset email. No custom password hashes, JWT secrets, SMTP credentials, verification-code collection, or Storage bucket is required.

## Main workflows

1. A clinic registers a patient, records a visit, and creates a referral.
2. The receiving hospital reviews the referral and can accept it while scheduling an appointment, reject it, or mark treatment completed.
3. Authorized participants can exchange referral messages.
4. Clinics and hospitals can request laboratory tests, and laboratory users can upload results.
5. Authorized healthcare users can view patient records, prescriptions, visits, and small inline attachments.

## Security notes

The client Firebase configuration contains public web-app identifiers only. Service-account keys must never be placed in the frontend or committed to the repository. Firestore rules require authentication, enforce administrator-only directory mutations and audit-log access, and constrain referral conversations to participating organizations.
