import { pgTable, text, serial, integer, timestamp, varchar, doublePrecision } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 1. Users Table
export const users = pgTable("users", {
  userId: serial("user_id").primaryKey(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  userRole: varchar("user_role", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Children Table
export const children = pgTable("children", {
  childId: serial("child_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
  childName: varchar("child_name", { length: 100 }).notNull(),
  age: integer("age").notNull(),
  gender: varchar("gender", { length: 20 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 3. Drawings Table
export const drawings = pgTable("drawings", {
  drawingId: serial("drawing_id").primaryKey(),
  childId: integer("child_id").notNull().references(() => children.childId, { onDelete: "cascade" }),
  imagePath: text("image_path").notNull(),
  parentExplanation: text("parent_explanation"),
  uploadDate: timestamp("upload_date").default(sql`CURRENT_TIMESTAMP`),
  status: text("status"),
});

// 4. Emotion Results Table
export const emotionResults = pgTable("emotion_results", {
  resultId: serial("result_id").primaryKey(),
  drawingId: integer("drawing_id").notNull().unique().references(() => drawings.drawingId, { onDelete: "cascade" }),
  predictedEmotion: varchar("predicted_emotion", { length: 50 }).notNull(),
  confidenceScore: doublePrecision("confidence_score"),
  analysisDate: timestamp("analysis_date").default(sql`CURRENT_TIMESTAMP`),
  modelVersion: varchar("model_version", { length: 50 }),
});

// 5. Explanations Table
export const explanations = pgTable("explanations", {
  explanationId: serial("explanation_id").primaryKey(),
  resultId: integer("result_id").notNull().unique().references(() => emotionResults.resultId, { onDelete: "cascade" }),
  explanationText: text("explanation_text").notNull(),
  visualFeatures: text("visual_features"),
});

// 6. Suggestions Table
export const suggestions = pgTable("suggestions", {
  suggestionId: serial("suggestion_id").primaryKey(),
  resultId: integer("result_id").notNull().references(() => emotionResults.resultId, { onDelete: "cascade" }),
  suggestionText: text("suggestion_text").notNull(),
});