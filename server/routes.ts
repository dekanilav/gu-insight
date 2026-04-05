import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import session from "express-session";
import { insertNewspaperSchema, insertAdvertisementSchema } from "@shared/schema";
import { z } from "zod";
import { storage } from "./storage";

// ✅ Define custom type for multer usage
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// ✅ Local disk storage for uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "uploads/"),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  })
});

// 🔐 Admin password (use env in production)
const ADMIN_PASSWORD = "admin123";

// ✅ Admin middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if ((req.session as any)?.isAdmin) return next();
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: "newspaper-admin-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
    })
  );

  app.use("/uploads", express.static("uploads"));

  // 🔐 Auth
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      (req.session as any).isAdmin = true;
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
    res.json({ isAuthenticated: !!(req.session as any)?.isAdmin });
  });

  // 🗞️ Newspapers
  app.get("/api/newspapers", async (_req, res) => {
    try {
      const newspapers = await storage.getActiveNewspapers();
      res.json(newspapers);
    } catch {
      res.status(500).json({ message: "Failed to fetch newspapers" });
    }
  });

  app.get("/api/newspapers/latest", async (_req, res) => {
    try {
      const latest = await storage.getLatestNewspaper();
      if (!latest) return res.status(404).json({ message: "No newspapers found" });
      res.json(latest);
    } catch {
      res.status(500).json({ message: "Failed to fetch latest newspaper" });
    }
  });

  app.get("/api/newspapers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const newspaper = await storage.getNewspaperById(id);
      if (!newspaper) return res.status(404).json({ message: "Newspaper not found" });
      res.json(newspaper);
    } catch {
      res.status(500).json({ message: "Failed to fetch newspaper" });
    }
  });

  app.post("/api/newspapers", isAuthenticated, upload.single("file"), async (req: MulterRequest, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { title, date } = req.body;
    const fileType = req.file.mimetype.includes("pdf") ? "pdf" : "image";

    const newspaperData = {
      title: title || `Edition ${date}`,
      date,
      filename: req.file.originalname,
      filePath: `uploads/${req.file.filename}`,
      fileType,
      pageCount: 1,
      isActive: true,
    };

    try {
      const validatedData = insertNewspaperSchema.parse(newspaperData);
      const newspaper = await storage.createNewspaper(validatedData);
      res.status(201).json(newspaper);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Database insert failed", error: error.message });
    }
  });

  app.delete("/api/newspapers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNewspaper(id);
      if (!success) return res.status(404).json({ message: "Newspaper not found" });
      res.json({ message: "Deleted successfully" });
    } catch {
      res.status(500).json({ message: "Failed to delete newspaper" });
    }
  });

  // 📢 Advertisements
  app.get("/api/advertisements", async (req, res) => {
    try {
      const { position } = req.query;
      const ads = position
        ? await storage.getAdvertisementsByPosition(position as string)
        : await storage.getActiveAdvertisements();
      res.json(ads);
    } catch {
      res.status(500).json({ message: "Failed to fetch advertisements" });
    }
  });

  app.post("/api/advertisements", isAuthenticated, upload.single("file"), async (req: MulterRequest, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { position } = req.body;
    if (!["top-banner", "sidebar", "between-pages"].includes(position)) {
      return res.status(400).json({ message: "Invalid position" });
    }

    const existingAds = await storage.getAdvertisementsByPosition(position);
    await Promise.all(existingAds.map((ad) => storage.deleteAdvertisement(ad.id)));

    const adData = {
      position,
      filename: req.file.originalname,
      filePath: `uploads/${req.file.filename}`,
      isActive: true,
    };

    try {
      const validatedData = insertAdvertisementSchema.parse(adData);
      const advertisement = await storage.createAdvertisement(validatedData);
      res.status(201).json(advertisement);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Database insert failed", error: error.message });
    }
  });

  app.delete("/api/advertisements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAdvertisement(id);
      if (!success) return res.status(404).json({ message: "Ad not found" });
      res.json({ message: "Deleted successfully" });
    } catch {
      res.status(500).json({ message: "Failed to delete ad" });
    }
  });

  return createServer(app);
}
