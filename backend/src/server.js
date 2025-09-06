import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import admin from "firebase-admin";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

// Define allowed origins. The frontend URL can be a comma-separated list.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

// explicit CORS options so preflight allows Authorization header
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) or from whitelisted origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));

// simple request logger to surface incoming requests in backend logs
app.use((req, res, next) => {
  console.log(
    new Date().toISOString(),
    req.method,
    req.originalUrl,
    "headers:",
    Object.keys(req.headers)
  );
  next();
});
// Setup cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Firebase Admin (service account JSON or application default)
let firebaseAdminInitialized = false;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseAdminInitialized = true;
  } catch (err) {
    console.error("Invalid FIREBASE_SERVICE_ACCOUNT JSON:", err);
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    admin.initializeApp();
    firebaseAdminInitialized = true;
  } catch (err) {
    console.error(
      "Failed to initialize firebase admin with GOOGLE_APPLICATION_CREDENTIALS:",
      err
    );
  }
} else {
  console.warn(
    "Firebase admin not initialized: set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS for token verification."
  );
}

// Middlewares
const upload = multer({ storage: multer.memoryStorage() });

// Auth middleware: prefers verifying Firebase ID token. For local dev you may use x-dev-uid header.
async function verifyFirebaseToken(req, res, next) {
  const devUid = req.headers["x-dev-uid"];
  if (devUid && !firebaseAdminInitialized) {
    req.uid = devUid;
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });
  const idToken = auth.split(" ")[1];
  if (!firebaseAdminInitialized)
    return res.status(500).json({ error: "Firebase admin not configured" });
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}

// Get profile for authenticated user
app.get("/api/profile/me", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.uid;
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { experiences: true, notifications: true },
    });
    if (!user) return res.json({ found: false });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update profile (accepts multipart/form-data with optional "image" file OR application/json)
app.put(
  "/api/profile/me",
  verifyFirebaseToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const uid = req.uid;
      let image_url = undefined;

      // If file uploaded, push to Cloudinary
      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          const upload_stream = cloudinary.v2.uploader.upload_stream(
            { folder: "profile_images" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(upload_stream);
        });
        image_url = uploadResult.secure_url;
      }

      // parse body fields (if JSON fields are strings due to multipart)
      const name = req.body.name || undefined;
      const location = req.body.location || undefined;
      const job = req.body.job || undefined;
      const experiences = req.body.experiences
        ? JSON.parse(req.body.experiences)
        : undefined;
      const notifications = req.body.notifications
        ? JSON.parse(req.body.notifications)
        : undefined;

      // Upsert user row
      await prisma.user.upsert({
        where: { id: uid },
        create: {
          id: uid,
          name: name || "Unnamed",
          location,
          job,
          image_url,
        },
        update: {
          name,
          location,
          job,
          image_url,
        },
      });

      // Replace experiences if provided
      if (Array.isArray(experiences)) {
        await prisma.experience.deleteMany({ where: { userId: uid } });
        for (const exp of experiences) {
          await prisma.experience.create({
            data: {
              userId: uid,
              role: exp.role,
              company: exp.company,
              years: Number(exp.years || 0),
            },
          });
        }
      }

      // Replace notifications if provided
      if (Array.isArray(notifications)) {
        await prisma.notification.deleteMany({ where: { userId: uid } });
        for (const n of notifications) {
          await prisma.notification.create({
            data: {
              userId: uid,
              type: n.type,
              caption: n.caption,
              read: !!n.read,
            },
          });
        }
      }

      const updated = await prisma.user.findUnique({
        where: { id: uid },
        include: { experiences: true, notifications: true },
      });

      res.json(updated);
    } catch (err) {
      console.error("Failed to update profile:", err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

// Optional endpoint to persist lists only (front-end autosave)
app.patch("/api/profile/me/lists", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.uid;
    const { experiences, notifications } = req.body;
    if (Array.isArray(experiences)) {
      await prisma.experience.deleteMany({ where: { userId: uid } });
      for (const exp of experiences) {
        await prisma.experience.create({
          data: {
            userId: uid,
            role: exp.role,
            company: exp.company,
            years: Number(exp.years || 0),
          },
        });
      }
    }
    if (Array.isArray(notifications)) {
      await prisma.notification.deleteMany({ where: { userId: uid } });
      for (const n of notifications) {
        await prisma.notification.create({
          data: {
            userId: uid,
            type: n.type,
            caption: n.caption,
            read: !!n.read,
          },
        });
      }
    }
    const updated = await prisma.user.findUnique({
      where: { id: uid },
      include: { experiences: true, notifications: true },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save lists" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
});

// Handle server errors (e.g. port already in use) with a friendly message
server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the process using the port or set a different PORT in your .env (see backend/.env.example).`
    );
    process.exit(1);
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});

// simple health endpoint for quick connectivity checks
app.get("/health", (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});
