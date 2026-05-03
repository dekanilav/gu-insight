import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define 'newspapers' table for PostgreSQL (Neon)
export const newspapers = pgTable("newspapers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // 'pdf' | 'image'
  pageCount: integer("page_count").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Define 'advertisements' table for PostgreSQL (Neon)
export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  position: text("position").notNull(), // 'top-banner' | 'sidebar' | 'between-pages'
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Validation Schemas
export const insertNewspaperSchema = createInsertSchema(newspapers).omit({
  id: true,
  uploadedAt: true,
});

export const insertAdvertisementSchema = createInsertSchema(advertisements).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type InsertNewspaper = z.infer<typeof insertNewspaperSchema>;
export type Newspaper = typeof newspapers.$inferSelect;

export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisements.$inferSelect;
