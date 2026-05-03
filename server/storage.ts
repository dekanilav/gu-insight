import {
  newspapers,
  advertisements,
  type Newspaper,
  type Advertisement,
  type InsertNewspaper,
  type InsertAdvertisement,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary is configured once globally (env vars set in Vercel Dashboard)
cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
});

/** Extract Cloudinary public_id from a secure URL.
 *  e.g. "https://res.cloudinary.com/.../gu-insight/abc123.pdf" → "gu-insight/abc123"
 */
function extractPublicId(url: string): string {
  const parts = url.split("/");
  const filename = parts.pop()!; // "abc123.pdf"
  const folder   = parts.pop()!; // "gu-insight"  (or v<timestamp>)
  const name     = filename.replace(/\.[^.]+$/, ""); // strip extension
  // If the second-to-last segment looks like a version tag, go one level up
  return `${folder}/${name}`;
}

export interface IStorage {
  // Newspaper operations
  getNewspapers(): Promise<Newspaper[]>;
  getNewspaperById(id: number): Promise<Newspaper | undefined>;
  getActiveNewspapers(): Promise<Newspaper[]>;
  getLatestNewspaper(): Promise<Newspaper | undefined>;
  createNewspaper(newspaper: InsertNewspaper): Promise<Newspaper>;
  updateNewspaper(id: number, updates: Partial<Newspaper>): Promise<Newspaper | undefined>;
  deleteNewspaper(id: number): Promise<boolean>;

  // Advertisement operations
  getAdvertisements(): Promise<Advertisement[]>;
  getAdvertisementsByPosition(position: string): Promise<Advertisement[]>;
  getActiveAdvertisements(): Promise<Advertisement[]>;
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  updateAdvertisement(id: number, updates: Partial<Advertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // No constructor needed — no local filesystem setup

  // ── Newspaper operations ────────────────────────────────────────────────

  async getNewspapers(): Promise<Newspaper[]> {
    return await db.select().from(newspapers).orderBy(desc(newspapers.date));
  }

  async getNewspaperById(id: number): Promise<Newspaper | undefined> {
    const [newspaper] = await db.select().from(newspapers).where(eq(newspapers.id, id));
    return newspaper || undefined;
  }

  async getActiveNewspapers(): Promise<Newspaper[]> {
    return await db
      .select()
      .from(newspapers)
      .where(eq(newspapers.isActive, true))
      .orderBy(desc(newspapers.date));
  }

  async getLatestNewspaper(): Promise<Newspaper | undefined> {
    const [latest] = await db
      .select()
      .from(newspapers)
      .where(eq(newspapers.isActive, true))
      .orderBy(desc(newspapers.date))
      .limit(1);
    return latest || undefined;
  }

  async createNewspaper(insertNewspaper: InsertNewspaper): Promise<Newspaper> {
    console.log("📝 Inserting newspaper:", insertNewspaper);
    try {
      const [newspaper] = await db
        .insert(newspapers)
        .values(insertNewspaper)
        .returning();
      console.log("✅ Inserted newspaper:", newspaper);
      return newspaper!;
    } catch (error: any) {
      console.error("❌ DB Insert failed:", error);
      throw error;
    }
  }

  async updateNewspaper(id: number, updates: Partial<Newspaper>): Promise<Newspaper | undefined> {
    const [updated] = await db
      .update(newspapers)
      .set(updates)
      .where(eq(newspapers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteNewspaper(id: number): Promise<boolean> {
    const [newspaper] = await db.select().from(newspapers).where(eq(newspapers.id, id));
    if (!newspaper) return false;

    // Delete from Cloudinary (no local fs)
    try {
      const publicId = extractPublicId(newspaper.filePath);
      await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
    } catch (err) {
      console.error("⚠️ Cloudinary delete failed (non-fatal):", err);
    }

    await db.delete(newspapers).where(eq(newspapers.id, id));
    return true;
  }

  // ── Advertisement operations ────────────────────────────────────────────

  async getAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements);
  }

  async getAdvertisementsByPosition(position: string): Promise<Advertisement[]> {
    return await db
      .select()
      .from(advertisements)
      .where(and(eq(advertisements.position, position), eq(advertisements.isActive, true)));
  }

  async getActiveAdvertisements(): Promise<Advertisement[]> {
    return await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.isActive, true));
  }

  async createAdvertisement(insertAd: InsertAdvertisement): Promise<Advertisement> {
    console.log("📢 Inserting advertisement:", insertAd);
    try {
      const [ad] = await db
        .insert(advertisements)
        .values(insertAd)
        .returning();
      console.log("✅ Inserted advertisement:", ad);
      return ad!;
    } catch (error: any) {
      console.error("❌ DB Insert failed:", error);
      throw error;
    }
  }

  async updateAdvertisement(id: number, updates: Partial<Advertisement>): Promise<Advertisement | undefined> {
    const [updated] = await db
      .update(advertisements)
      .set(updates)
      .where(eq(advertisements.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAdvertisement(id: number): Promise<boolean> {
    const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
    if (!ad) return false;

    // Delete from Cloudinary
    try {
      const publicId = extractPublicId(ad.filePath);
      await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
    } catch (err) {
      console.error("⚠️ Cloudinary delete failed (non-fatal):", err);
    }

    await db.delete(advertisements).where(eq(advertisements.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
