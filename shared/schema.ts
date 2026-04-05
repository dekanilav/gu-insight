import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define 'newspapers' table for SQLite
export const newspapers = sqliteTable("newspapers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // 'pdf' | 'image'
  pageCount: integer("page_count").default(1).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).default(new Date()).notNull(),
});

// Define 'advertisements' table for SQLite
export const advertisements = sqliteTable("advertisements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  position: text("position").notNull(), // 'top-banner' | 'sidebar' | 'between-pages'
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).default(new Date()).notNull(),
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
