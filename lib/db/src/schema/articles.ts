import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  title: text("title"),
  url: text("url"),
  content: text("content"),
  verdict: text("verdict").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  explanation: text("explanation").notNull(),
  evidence: jsonb("evidence").notNull().$type<string[]>().default([]),
  redFlags: jsonb("red_flags").notNull().$type<string[]>().default([]),
  positiveIndicators: jsonb("positive_indicators").notNull().$type<string[]>().default([]),
  shareToken: text("share_token"),
  analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({ id: true, createdAt: true, analyzedAt: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
