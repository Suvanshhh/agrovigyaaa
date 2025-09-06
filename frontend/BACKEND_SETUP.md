Quick backend setup (local)

1. Copy backend/.env.example to backend/.env and edit if needed (DATABASE_URL already set to your MySQL).
2. Put your Firebase service account JSON into `FIREBASE_SERVICE_ACCOUNT` in backend/.env (as a single-line JSON string) or set `GOOGLE_APPLICATION_CREDENTIALS` to the JSON file path.
3. From project root:

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

4. In frontend `.env` add:

REACT_APP_API_URL=http://localhost:4000

5. Restart frontend dev server.

Notes

- For testing without Firebase admin, add header `x-dev-uid: <your-uid>` to requests (the server accepts it only when firebase admin isn't configured).
- Cloudinary credentials are already present in `backend/.env.example` per your input.
