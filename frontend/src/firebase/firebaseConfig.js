// firebaseConfig.js
import { initializeApp } from "firebase/app";

const REQUIRED_KEYS = [
  "REACT_APP_FIREBASE_API_KEY",
  "REACT_APP_FIREBASE_AUTH_DOMAIN",
  "REACT_APP_FIREBASE_PROJECT_ID",
  "REACT_APP_FIREBASE_STORAGE_BUCKET",
  "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  "REACT_APP_FIREBASE_APP_ID",
];

const missing = REQUIRED_KEYS.filter((k) => !process.env[k]);
if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(
    `[Firebase Config] Missing environment variables: ${missing.join(", ")}.\n` +
      `Create a frontend/.env file with these keys. Example:\n` +
      `REACT_APP_FIREBASE_API_KEY=YOUR_KEY_HERE\n` +
      `After adding, fully restart the dev server (Ctrl+C then npm start).`
  );
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export default app;
