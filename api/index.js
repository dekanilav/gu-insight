/**
 * api/index.js  ── Vercel Serverless Entry Point for GU-Insight
 *
 * Key changes from the original server/index.ts:
 *  - NO app.listen()  →  Vercel manages the HTTP lifecycle.
 *  - module.exports = app  →  Vercel's @vercel/node runtime calls the app directly.
 *  - TypeScript compiled output is imported from dist/  (see build script).
 *
 * NOTE: This file is plain CommonJS so that @vercel/node can import it without
 *       any extra transpilation step. The actual business logic lives in the
 *       compiled dist/index.js produced by the build script.
 */

// Load env vars first (Vercel injects them automatically in prod,
// dotenv is only needed for local `vercel dev`)
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const multer  = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// ── Cloudinary config (set these in Vercel Dashboard) ──────────────────────
cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
});

// ── Cloudinary multer storage (replaces local disk storage) ────────────────
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder      : "gu-insight",
    allowed_formats: ["jpg", "png", "pdf", "jpeg"],
    resource_type: "auto",
  },
});

const upload = multer({ storage: cloudinaryStorage });

// ── Database (switch from SQLite → Neon/PostgreSQL on Vercel) ──────────────
//   For now the import path points at your compiled server code.
//   Replace with your Neon drizzle import once you migrate the DB.
const { db } = require("../dist/server/db");   // adjust after build

// ── Express app setup ───────────────────────────────────────────────────────
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session store: use memorystore (or switch to connect-pg-simple with Neon)
const MemoryStore = require("memorystore")(session);
app.use(
  session({
    secret           : process.env.SESSION_SECRET || "newspaper-admin-secret-key",
    resave           : false,
    saveUninitialized: false,
    store            : new MemoryStore({ checkPeriod: 86400000 }),
    cookie           : { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
  })
);

// ── Logging middleware ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

// ── Auth helpers ────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // ← set in Vercel Dashboard!

const isAuthenticated = (req, res, next) => {
  if (req.session?.isAdmin) return next();
  return res.status(401).json({ message: "Unauthorized" });
};

// ── Routes ──────────────────────────────────────────────────────────────────
const { storage: dbStorage } = require("../dist/server/storage"); // adjust path after build

// Auth
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: "Invalid password" });
});

app.post("/api/admin/logout", (req, res) => {
  req.session?.destroy((err) => {
    if (err) return res.status(500).json({ message: "Could not log out" });
    res.json({ message: "Logged out successfully" });
  });
});

app.get("/api/admin/check", (req, res) => {
  res.json({ isAuthenticated: !!req.session?.isAdmin });
});

// Newspapers
app.get("/api/newspapers",        async (_req, res) => {
  try { res.json(await dbStorage.getActiveNewspapers()); }
  catch { res.status(500).json({ message: "Failed to fetch newspapers" }); }
});

app.get("/api/newspapers/latest", async (_req, res) => {
  try {
    const latest = await dbStorage.getLatestNewspaper();
    if (!latest) return res.status(404).json({ message: "No newspapers found" });
    res.json(latest);
  } catch { res.status(500).json({ message: "Failed to fetch latest newspaper" }); }
});

app.get("/api/newspapers/:id",    async (req, res) => {
  try {
    const newspaper = await dbStorage.getNewspaperById(parseInt(req.params.id));
    if (!newspaper) return res.status(404).json({ message: "Newspaper not found" });
    res.json(newspaper);
  } catch { res.status(500).json({ message: "Failed to fetch newspaper" }); }
});

app.post("/api/newspapers", isAuthenticated, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const { title, date } = req.body;
  const fileType = req.file.mimetype.includes("pdf") ? "pdf" : "image";
  const newspaperData = {
    title   : title || `Edition ${date}`,
    date,
    filename: req.file.originalname,
    // Cloudinary gives a public URL — store it instead of a local path
    filePath: req.file.path,
    fileType,
    pageCount: 1,
    isActive : true,
  };
  try {
    const newspaper = await dbStorage.createNewspaper(newspaperData);
    res.status(201).json(newspaper);
  } catch (error) {
    res.status(500).json({ message: "Database insert failed", error: error.message });
  }
});

app.delete("/api/newspapers/:id", isAuthenticated, async (req, res) => {
  try {
    const success = await dbStorage.deleteNewspaper(parseInt(req.params.id));
    if (!success) return res.status(404).json({ message: "Newspaper not found" });
    res.json({ message: "Deleted successfully" });
  } catch { res.status(500).json({ message: "Failed to delete newspaper" }); }
});

// Advertisements
app.get("/api/advertisements", async (req, res) => {
  try {
    const { position } = req.query;
    const ads = position
      ? await dbStorage.getAdvertisementsByPosition(position)
      : await dbStorage.getActiveAdvertisements();
    res.json(ads);
  } catch { res.status(500).json({ message: "Failed to fetch advertisements" }); }
});

app.post("/api/advertisements", isAuthenticated, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const { position } = req.body;
  if (!["top-banner", "sidebar", "between-pages"].includes(position)) {
    return res.status(400).json({ message: "Invalid position" });
  }
  const existing = await dbStorage.getAdvertisementsByPosition(position);
  await Promise.all(existing.map((ad) => dbStorage.deleteAdvertisement(ad.id)));
  const adData = {
    position,
    filename: req.file.originalname,
    filePath: req.file.path, // Cloudinary URL
    isActive : true,
  };
  try {
    const advertisement = await dbStorage.createAdvertisement(adData);
    res.status(201).json(advertisement);
  } catch (error) {
    res.status(500).json({ message: "Database insert failed", error: error.message });
  }
});

app.delete("/api/advertisements/:id", isAuthenticated, async (req, res) => {
  try {
    const success = await dbStorage.deleteAdvertisement(parseInt(req.params.id));
    if (!success) return res.status(404).json({ message: "Ad not found" });
    res.json({ message: "Deleted successfully" });
  } catch { res.status(500).json({ message: "Failed to delete ad" }); }
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("❌ Global Error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

// ── EXPORT (NO app.listen) — Vercel handles the server lifecycle ────────────
module.exports = app;
