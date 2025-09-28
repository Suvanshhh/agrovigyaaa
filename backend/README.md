# Agrishift Backend (Express + Prisma + Cloudinary)

This backend provides simple profile endpoints for the frontend. It uses MySQL (Prisma), Cloudinary for image uploads, and Firebase Admin to verify ID tokens.

Setup

1. Copy `.env.example` to `.env` and fill the values (DATABASE_URL, Cloudinary creds, Firebase service account or GOOGLE_APPLICATION_CREDENTIALS).

2. Install dependencies:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

3. Frontend: set `REACT_APP_API_URL=http://localhost:4000` in your frontend `.env` and restart the dev server.

Notes

- If you don't have a Firebase service account yet, generate it in Firebase Console > Project Settings > Service Accounts and paste the JSON into `FIREBASE_SERVICE_ACCOUNT` in `.env` or upload the JSON file and set `GOOGLE_APPLICATION_CREDENTIALS`.
- For local development without Firebase admin, the server accepts header `x-dev-uid` to act as an authenticated user (not secure). Provide this header when testing, or provide a valid Firebase ID token via `Authorization: Bearer <idToken>`.

Gemini-powered crop recommendation

Add these to `backend/.env` to enable the Gemini endpoint `/api/crop-recommendation`:

```
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-1.5-flash
```
