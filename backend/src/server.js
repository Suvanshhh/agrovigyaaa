import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// Define allowed origins. The frontend URL can be a comma-separated list.
// const allowedOrigins = (process.env.FRONTEND_URL|| "http://localhost:3000" || "https://agrovigyaaa-2tok.vercel.app" || "https://agrovigyaaa-production.up.railway.app" || "http://localhost:3000")
//   .split(",")
//   .map((origin) => origin.trim());

// CORS: explicitly allow frontend origins and preflight auth headers
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .map((o) => o.replace(/^['"]|['"]$/g, "")) // strip quotes if present
  .map((o) => o.replace(/\/$/, "")); // remove trailing slash
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Lang"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// explicit CORS options so preflight allows Authorization header
// const corsOptions = {
//   origin: (origin, callback) => {
//     console.log("CORS origin received:", origin);
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));
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
  if (!GEMINI_API_KEY) {
    console.warn(
      "[WARN] GEMINI_API_KEY is not set. /api/crop-recommendation will return an error."
    );
  }
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
  res.json({
    ok: true,
    now: new Date().toISOString(),
    geminiConfigured: Boolean(GEMINI_API_KEY),
    firebaseAdminInitialized,
  });
});

// --- Labour Estimation Route -------------------------------------------------
// The original labour estimation Python service is currently commented out.
// To make the frontend feature functional, we provide a lightweight estimation
// here. This can later be replaced with a proper ML service or connected to
// the restored Flask app behind an internal call.
// Input JSON body: { crop_fname, area, season, wage_type }
// Response matches what the frontend `LabourEstimation.jsx` expects:
// {
//   crop, area, season, wage_type,
//   total_labour_per_ha, cost_per_hectare, total_cost
// }

// Simple canonical dataset (can be moved to DB later)
const LABOUR_BASE = [
  { crop: "Tomato", labourPerHa: 32, govtWage: 350, expectedWage: 450 },
  { crop: "Potato", labourPerHa: 28, govtWage: 350, expectedWage: 450 },
  { crop: "Onion", labourPerHa: 40, govtWage: 350, expectedWage: 450 },
];

// Seasonal multipliers roughly reflecting variation (placeholder values)
const SEASON_FACTORS = { Spring: 1.0, Summer: 1.1, Fall: 0.95, Winter: 0.9 };

// Farm size efficiency (larger farms gain slight efficiency per ha)
function efficiencyForArea(area) {
  if (area <= 1) return 1.0;
  if (area <= 3) return 0.97;
  if (area <= 5) return 0.94;
  return 0.9; // >5 ha
}

app.post("/api/labour-estimate", (req, res) => {
  try {
    const { crop_name, area, season, wage_type } = req.body || {};
    if (!crop_name || !area || !season || !wage_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const numericArea = Number(area);
    if (!Number.isFinite(numericArea) || numericArea <= 0) {
      return res.status(400).json({ error: "Area must be a positive number" });
    }
    const record = LABOUR_BASE.find(
      (r) => r.crop.toLowerCase() === String(crop_name).toLowerCase()
    );
    if (!record) return res.status(404).json({ error: "Crop not supported" });
    const seasonFactor = SEASON_FACTORS[season] || 1.0;
    const eff = efficiencyForArea(numericArea);
    // Adjusted labour per ha
    const labourPerHaAdjusted = record.labourPerHa * seasonFactor * eff;
    // Wage selection
    const wage =
      wage_type === "Expected" ? record.expectedWage : record.govtWage;
    const costPerHa = labourPerHaAdjusted * wage;
    const totalCost = costPerHa * numericArea;
    return res.json({
      crop: record.crop,
      area: numericArea,
      season,
      wage_type,
      total_labour_per_ha: Math.round(labourPerHaAdjusted),
      cost_per_hectare: Math.round(costPerHa),
      total_cost: Math.round(totalCost),
    });
  } catch (e) {
    console.error("/api/labour-estimate failed", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Crop Recommendation via Gemini ----------------------------------------
// Input body:
// {
//   Nitrogen, Phosphorus, Potassium, Temperature, Humidity, pH, Rainfall
// }
// Output:
// {
//   crop: string,
//   rationale: string,
//   category: string,              // e.g., Cereal/Pulse/Oilseed/Vegetable/Spice/Fruit/Cash Crop
//   confidence: number,            // 0..1 subjective
//   top_alternatives: [{crop, reason}],
//   warnings: string[]
// }
app.post("/api/crop-recommendation", verifyFirebaseToken, async (req, res) => {
  const started = Date.now();
  function log(stage, extra = {}) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        route: "crop-recommendation",
        stage,
        ms: Date.now() - started,
        ...extra,
      })
    );
  }

  log("enter", { headers: Object.keys(req.headers) });
  try {
    const {
      Nitrogen,
      Phosphorus,
      Potassium,
      Temperature,
      Humidity,
      pH,
      Rainfall,
      state,
      district,
      season, // e.g., Kharif | Rabi | Zaid (Summer)
      irrigation, // None | Occasional | Regular
      soil_type, // Sandy | Loam | Clay | Black (Regur) | Laterite
      previous_crop,
      rainfall_band, // Low | Normal | High
      goal, // Cereal | Pulse | Oilseed | Cash | Horticulture | Fodder
    } = req.body || {};

    // Make numerics optional to support Basic mode. Validate only if provided.
    const numericKeys = [
      "Nitrogen",
      "Phosphorus",
      "Potassium",
      "Temperature",
      "Humidity",
      "pH",
      "Rainfall",
    ];
    for (const k of numericKeys) {
      if (req.body?.[k] !== undefined && req.body?.[k] !== "") {
        if (!Number.isFinite(Number(req.body[k]))) {
          log("validation_fail", { field: k, value: req.body[k] });
          return res.status(400).json({
            error: `Field ${k} must be numeric if provided`,
            code: "VALIDATION_NUMERIC",
          });
        }
      }
    }

    if (!GEMINI_API_KEY) {
      log("config_missing_key");
      return res.status(500).json({
        error: "Server missing GEMINI_API_KEY",
        code: "CONFIG_GEMINI_KEY",
      });
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const reqLang = (req.headers["x-lang"] || "en").toString().slice(0, 5);
    const language = ["en", "hi", "mr"].includes(reqLang) ? reqLang : "en";
    log("after_validation", { language });

    // Craft a compact, structured prompt that mimics the RF model behavior with agronomic priors.
    const langLabel =
      language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English";

    // Allowed crops by state and season (seed list for Maharashtra)
    const allowedByState = {
      Maharashtra: {
        Kharif: ["rice", "soybean", "cotton", "maize", "pigeonpea"],
        Rabi: ["wheat", "chickpea", "sorghum", "mustard"],
        Zaid: ["watermelon", "muskmelon", "vegetables", "fodder"],
        Horticulture: ["onion", "tomato", "pomegranate", "grape"],
      },
    };
    const st = (state || "").trim();
    const ssn = (season || "").trim();
    const allowedCrops =
      (allowedByState[st] && allowedByState[st][ssn]) || null;

    const prompt = `You are an agricultural expert that recommends suitable crops based on soil macro-nutrients and local conditions. Respond strictly in ${langLabel}.
Given these inputs (units in parentheses):
- Nitrogen (N, kg/ha): ${
      Nitrogen !== undefined && Nitrogen !== "" ? Number(Nitrogen) : "unknown"
    }
- Phosphorus (P, kg/ha): ${
      Phosphorus !== undefined && Phosphorus !== ""
        ? Number(Phosphorus)
        : "unknown"
    }
- Potassium (K, kg/ha): ${
      Potassium !== undefined && Potassium !== ""
        ? Number(Potassium)
        : "unknown"
    }
- Temperature (°C): ${
      Temperature !== undefined && Temperature !== ""
        ? Number(Temperature)
        : "unknown"
    }
- Humidity (%): ${
      Humidity !== undefined && Humidity !== "" ? Number(Humidity) : "unknown"
    }
- Soil pH: ${pH !== undefined && pH !== "" ? Number(pH) : "unknown"}
- Rainfall (mm): ${
      Rainfall !== undefined && Rainfall !== "" ? Number(Rainfall) : "unknown"
    }
- Rainfall band: ${rainfall_band || "(not provided)"}

Optional context (use if provided):
- State: ${st || "(not provided)"}
- District: ${district || "(not provided)"}
- Season: ${ssn || "(not provided)"}
- Irrigation: ${irrigation || "(not provided)"}
- Soil type: ${soil_type || "(not provided)"}
- Previous crop: ${previous_crop || "(not provided)"}
- Rainfall band: ${rainfall_band || "(not provided)"}
- Goal: ${goal || "(not provided)"}

Mimic the behavior of a balanced RandomForestClassifier trained on grouped crop categories (Cereal, Pulse, Oilseed, Cash Crop (Cotton), Vegetable/Spice/Fruit), while also providing a single best specific crop example. The output JSON values (category names, rationale text, warnings, fertilizer_advice, alternatives.reason) must be written in ${langLabel}.
If State and Season are provided, treat them as hard constraints. Recommend only crops commonly grown in that state and season. ${
      allowedCrops
        ? `For ${st} in ${ssn}, allowedCrops = ${JSON.stringify(
            allowedCrops
          )}. Choose from allowedCrops unless none fits; if none fits, explain and suggest the closest feasible option.`
        : ``
    }
Use irrigation and rainfall band to avoid water-heavy crops when irrigation=None or rainfall=Low. If soil type is Black (Regur), consider cotton, soybean, sorghum, and pulses as favorable options. If previous crop is provided, favor rotation (e.g., follow paddy with pulses) to break pest/disease cycles.
If any numeric value is "unknown", infer conservatively from season/location and clearly reflect any uncertainty in confidence and warnings.
Consider these heuristics similar to feature importance:
- Cereal (e.g., rice, maize, wheat) tends to prefer adequate N and moderate pH; rice tolerates high rainfall; wheat/rice differ by cool vs warm temps.
- Pulses (e.g., chickpea, moong, pigeon pea) often prefer neutral pH (~6.5–7.5) and moderate N.
- Oilseeds (e.g., mustard, groundnut, soybean) vary: groundnut prefers warm temps and well-drained soils; mustard tolerates cooler temps.
- Cotton (cash crop) prefers warm temps, neutral pH, and moderate rainfall.
- Many vegetables/fruits need neutral pH, adequate K, and season-appropriate temperature.

Return STRICT JSON with this schema and no extra text (no markdown, no comments):
{
  "crop": "string",                    // best specific crop name (e.g., "rice", "maize", "chickpea", "mustard", "cotton")
  "category": "string",                // one of: Cereal, Pulse, Oilseed, Cash Crop (Cotton), Vegetable/Spice/Fruit
  "rationale": "string",
  "confidence": 0.0,                    // 0..1
  "top_alternatives": [
    {"crop": "string", "reason": "string"},
    {"crop": "string", "reason": "string"}
  ],
  "warnings": ["string"],
  "suitability_score": 0,              // 0..100 subjective score based on fit
  "fertilizer_advice": "string"       // one or two short lines (e.g., "Apply NPK 10-26-26; adjust pH with lime if <6.0")
}`;

    let text = "";
    let parsed;
    try {
      const generationConfig = { responseMimeType: "application/json" };
      log("gen_start", { promptChars: prompt.length });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
      const response = await result.response;
      text = response.text();
      log("gen_complete", { chars: text.length });
      try {
        parsed = JSON.parse(text.trim());
      } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }
      if (!parsed || !parsed.crop) {
        log("parse_failure", { snippet: text.slice(0, 180) });
        // Heuristic fallback when parsing fails
        const fallback = heuristicRecommendation({
          Nitrogen,
          Phosphorus,
          Potassium,
          Temperature,
          Humidity,
          pH,
          Rainfall,
        });
        return res.status(200).json({
          crop: fallback.crop,
          category: fallback.category,
          rationale: fallback.rationale + " (AI parse fallback)",
          confidence: 0.35,
          suitability_score: 35,
          fertilizer_advice: fallback.fertilizer_advice,
          top_alternatives: fallback.top_alternatives,
          warnings: ["AI response parse failed; heuristic suggestion provided"],
          model: "heuristic-parse-fallback",
        });
      }
    } catch (modelErr) {
      log("model_fail", { message: modelErr.message });
      const fallback = heuristicRecommendation({
        Nitrogen,
        Phosphorus,
        Potassium,
        Temperature,
        Humidity,
        pH,
        Rainfall,
      });
      return res.status(200).json({
        crop: fallback.crop,
        category: fallback.category,
        rationale: fallback.rationale + " (AI model fallback)",
        confidence: 0.3,
        suitability_score: 30,
        fertilizer_advice: fallback.fertilizer_advice,
        top_alternatives: fallback.top_alternatives,
        warnings: ["Gemini model unavailable; heuristic suggestion provided"],
        model: "heuristic-model-fallback",
        error_code: "MODEL_ERROR",
      });
    }

    // Normalize response fields
    const safe = {
      crop: String(parsed.crop),
      category: parsed.category ? String(parsed.category) : undefined,
      rationale: parsed.rationale ? String(parsed.rationale) : undefined,
      confidence: Number(parsed.confidence ?? 0),
      suitability_score: Number(
        parsed.suitability_score ??
          (parsed.confidence ? Number(parsed.confidence) * 100 : 0)
      ),
      fertilizer_advice: parsed.fertilizer_advice
        ? String(parsed.fertilizer_advice)
        : undefined,
      top_alternatives: Array.isArray(parsed.top_alternatives)
        ? parsed.top_alternatives.slice(0, 3).map((x) => ({
            crop: String(x.crop || ""),
            reason: String(x.reason || ""),
          }))
        : [],
      warnings: Array.isArray(parsed.warnings)
        ? parsed.warnings.map(String)
        : [],
      inputs: {
        Nitrogen,
        Phosphorus,
        Potassium,
        Temperature,
        Humidity,
        pH,
        Rainfall,
        state: st || undefined,
        district: district || undefined,
        season: ssn || undefined,
        irrigation: irrigation || undefined,
        soil_type: soil_type || undefined,
        previous_crop: previous_crop || undefined,
        rainfall_band: rainfall_band || undefined,
        goal: goal || undefined,
      },
    };

    log("success", {
      crop: safe.crop,
      category: safe.category,
      msTotal: Date.now() - started,
    });
    res.json(safe);
  } catch (e) {
    log("unhandled_exception", { message: e.message });
    console.error("/api/crop-recommendation failed", e);
    res.status(500).json({ error: "Internal server error", code: "UNHANDLED" });
  }
});
