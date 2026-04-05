import { newspapers, advertisements, type Newspaper, type Advertisement, type InsertNewspaper, type InsertAdvertisement } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import fs from 'fs';
import path from 'path';

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
  constructor() {
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }

  // Newspaper operations
  async getNewspapers(): Promise<Newspaper[]> {
    return await db.select().from(newspapers).orderBy(desc(newspapers.date));
  }

  async getNewspaperById(id: number): Promise<Newspaper | undefined> {
    const [newspaper] = await db.select().from(newspapers).where(eq(newspapers.id, id));
    return newspaper || undefined;
  }

  async getActiveNewspapers(): Promise<Newspaper[]> {
    return await db.select().from(newspapers)
      .where(eq(newspapers.isActive, true))
      .orderBy(desc(newspapers.date));
  }

  async getLatestNewspaper(): Promise<Newspaper | undefined> {
    const [latest] = await db.select().from(newspapers)
      .where(eq(newspapers.isActive, true))
      .orderBy(desc(newspapers.date))
      .limit(1);
    return latest || undefined;
  }

 async createNewspaper(insertNewspaper: InsertNewspaper): Promise<Newspaper> {
  console.log("📝 Inserting newspaper into DB with data:", insertNewspaper);

  try {
    await db.insert(newspapers).values(insertNewspaper);

    // Fetch the newly inserted newspaper by a unique key (e.g., filePath and date)
    const [newspaper] = await db.select().from(newspapers)
      .where(
        and(
          eq(newspapers.filePath, insertNewspaper.filePath),
          eq(newspapers.date, insertNewspaper.date)
        )
      )
      .limit(1);

    console.log("✅ Retrieved inserted newspaper record:", newspaper);
    return newspaper!;
  } catch (error: any) {
    console.error("❌ DB Insert failed:", error);
    if (error.stack) console.error(error.stack);
    throw error;
  }
}



  async updateNewspaper(id: number, updates: Partial<Newspaper>): Promise<Newspaper | undefined> {
    const [updated] = await db.update(newspapers)
      .set(updates)
      .where(eq(newspapers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteNewspaper(id: number): Promise<boolean> {
    const [newspaper] = await db.select().from(newspapers).where(eq(newspapers.id, id));
    if (!newspaper) return false;
    
    // Delete file from filesystem
    try {
      fs.unlinkSync(newspaper.filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
    
    await db.delete(newspapers).where(eq(newspapers.id, id));
    return true;
  }

  // Advertisement operations
  async getAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements);
  }

  async getAdvertisementsByPosition(position: string): Promise<Advertisement[]> {
    return await db.select().from(advertisements)
      .where(and(eq(advertisements.position, position), eq(advertisements.isActive, true)));
  }

  async getActiveAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements)
      .where(eq(advertisements.isActive, true));
  }

async createAdvertisement(insertAd: InsertAdvertisement): Promise<Advertisement> {
  console.log("📢 Inserting advertisement into DB with data:", insertAd);

  try {
    await db.insert(advertisements).values(insertAd);

    // Fetch the inserted ad (based on unique fields)
    const [ad] = await db.select().from(advertisements)
      .where(
        and(
          eq(advertisements.filePath, insertAd.filePath),
          eq(advertisements.position, insertAd.position)
        )
      )
      .limit(1);

    console.log("✅ Retrieved inserted advertisement:", ad);
    return ad!;
  } catch (error: any) {
    console.error("❌ DB Insert failed:", error);
    if (error.stack) console.error(error.stack);
    throw error;
  }
}


  async updateAdvertisement(id: number, updates: Partial<Advertisement>): Promise<Advertisement | undefined> {
    const [updated] = await db.update(advertisements)
      .set(updates)
      .where(eq(advertisements.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAdvertisement(id: number): Promise<boolean> {
    const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
    if (!ad) return false;
    
    // Delete file from filesystem
    try {
      fs.unlinkSync(ad.filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
    
    await db.delete(advertisements).where(eq(advertisements.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
