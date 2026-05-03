/**
 * api/index.js — Vercel Serverless Entry Point for GU-Insight
 *
 * - NO app.listen()  →  Vercel manages the HTTP lifecycle.
 * - module.exports = app  →  @vercel/node calls the handler directly.
 * - All logic is inlined here so no TypeScript compilation is needed at runtime.
 */

require("dotenv").config();

const express     = require("express");
const session     = require("express-session");
const multer      = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary  = require("cloudinary").v2;
const { neon }    = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const { eq, desc, and } = require("drizzle-orm");

// ── Cloudinary ───────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => ({
    folder        : "gu-insight",
    resource_type : "auto",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    public_id     : `${Date.now()}-${file.originalname.replace(/\.[^.]+$/, "")}`,
  }),
});

const upload = multer({ storage: cloudinaryStorage });

// ── Database (Neon) ──────────────────────────────────────────────────────────
const sql = neon(process.env.DATABASE_URL);
const db  = drizzle(sql);

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session
app.use(
  session({
    secret           : process.env.SESSION_SECRET || "newspaper-admin-secret-key",
    resave           : false,
    saveUninitialized: false,
    cookie           : {
      secure : process.env.NODE_ENV === "production",
      maxAge : 24 * 60 * 60 * 1000,
    },
  })
);

// Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

// ── Auth ─────────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD || "admin123";
const isAuthenticated = (req, res, next) => {
  if (req.session?.isAdmin) return next();
  return res.status(401).json({ message: "Unauthorized" });
};

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

// ── Newspapers ───────────────────────────────────────────────────────────────
app.get("/api/newspapers", async (_req, res) => {
  try {
    const rows = await db.execute(
      `SELECT * FROM newspapers WHERE is_active = true ORDER BY date DESC`
    );
    res.json(rows.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch newspapers" });
  }
});

app.get("/api/newspapers/latest", async (_req, res) => {
  try {
    const rows = await db.execute(
      `SELECT * FROM newspapers WHERE is_active = true ORDER BY date DESC LIMIT 1`
    );
    if (!rows.rows.length) return res.status(404).json({ message: "No newspapers found" });
    res.json(rows.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch latest newspaper" });
  }
});

app.get("/api/newspapers/:id", async (req, res) => {
  try {
    const rows = await db.execute(
      `SELECT * FROM newspapers WHERE id = ${parseInt(req.params.id)}`
    );
    if (!rows.rows.length) return res.status(404).json({ message: "Newspaper not found" });
    res.json(rows.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch newspaper" });
  }
});

app.post("/api/newspapers", isAuthenticated, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const { title, date } = req.body;
  const fileType  = req.file.mimetype.includes("pdf") ? "pdf" : "image";
  const filePath  = req.file.path;  // Cloudinary secure URL
  const filename  = req.file.originalname;
  const titleVal  = title || `Edition ${date}`;
  try {
    const rows = await db.execute(
      `INSERT INTO newspapers (title, date, filename, file_path, file_type, page_count, is_active)
       VALUES ('${titleVal}', '${date}', '${filename}', '${filePath}', '${fileType}', 1, true)
       RETURNING *`
    );
    res.status(201).json(rows.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Database insert failed" });
  }
});

app.delete("/api/newspapers/:id", isAuthenticated, async (req, res) => {
  try {
    const id   = parseInt(req.params.id);
    const rows = await db.execute(`SELECT * FROM newspapers WHERE id = ${id}`);
    if (!rows.rows.length) return res.status(404).json({ message: "Newspaper not found" });
    const newspaper = rows.rows[0];
    // Delete from Cloudinary
    try {
      const parts    = newspaper.file_path.split("/");
      const filename = parts.pop().replace(/\.[^.]+$/, "");
      const folder   = parts.pop();
      await cloudinary.uploader.destroy(`${folder}/${filename}`, { resource_type: "auto" });
    } catch (e) { console.error("Cloudinary delete:", e); }
    await db.execute(`DELETE FROM newspapers WHERE id = ${id}`);
    res.json({ message: "Deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to delete newspaper" });
  }
});

// ── Advertisements ───────────────────────────────────────────────────────────
app.get("/api/advertisements", async (req, res) => {
  try {
    const { position } = req.query;
    const query = position
      ? `SELECT * FROM advertisements WHERE position = '${position}' AND is_active = true`
      : `SELECT * FROM advertisements WHERE is_active = true`;
    const rows = await db.execute(query);
    res.json(rows.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch advertisements" });
  }
});

app.post("/api/advertisements", isAuthenticated, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const { position } = req.body;
  if (!["top-banner", "sidebar", "between-pages"].includes(position)) {
    return res.status(400).json({ message: "Invalid position" });
  }
  // Delete existing ads in same position
  const existing = await db.execute(
    `SELECT * FROM advertisements WHERE position = '${position}' AND is_active = true`
  );
  for (const ad of existing.rows) {
    try {
      const parts    = ad.file_path.split("/");
      const filename = parts.pop().replace(/\.[^.]+$/, "");
      const folder   = parts.pop();
      await cloudinary.uploader.destroy(`${folder}/${filename}`, { resource_type: "auto" });
    } catch (e) { console.error("Cloudinary delete:", e); }
    await db.execute(`DELETE FROM advertisements WHERE id = ${ad.id}`);
  }
  const filePath = req.file.path;
  const filename = req.file.originalname;
  try {
    const rows = await db.execute(
      `INSERT INTO advertisements (position, filename, file_path, is_active)
       VALUES ('${position}', '${filename}', '${filePath}', true)
       RETURNING *`
    );
    res.status(201).json(rows.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Database insert failed" });
  }
});

app.delete("/api/advertisements/:id", isAuthenticated, async (req, res) => {
  try {
    const id   = parseInt(req.params.id);
    const rows = await db.execute(`SELECT * FROM advertisements WHERE id = ${id}`);
    if (!rows.rows.length) return res.status(404).json({ message: "Ad not found" });
    const ad = rows.rows[0];
    try {
      const parts    = ad.file_path.split("/");
      const filename = parts.pop().replace(/\.[^.]+$/, "");
      const folder   = parts.pop();
      await cloudinary.uploader.destroy(`${folder}/${filename}`, { resource_type: "auto" });
    } catch (e) { console.error("Cloudinary delete:", e); }
    await db.execute(`DELETE FROM advertisements WHERE id = ${id}`);
    res.json({ message: "Deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to delete ad" });
  }
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("❌ Global Error:", err);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

// ── EXPORT — no app.listen() — Vercel handles the server lifecycle ───────────
module.exports = app;
