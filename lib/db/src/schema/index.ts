import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const projectStatus = pgEnum("project_status", ["active", "archived"]);
export const generationStatus = pgEnum("generation_status", ["pending", "completed", "failed"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  passwordHash: text("password_hash"),
  freeGenerationUsed: integer("free_generation_used").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatus("status").notNull().default("active"),
  latestBlueprint: jsonb("latest_blueprint"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const generationHistory = pgTable("generation_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  prompt: text("prompt").notNull(),
  blueprint: jsonb("blueprint"),
  status: generationStatus("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  generationHistory: many(generationHistory),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  generationHistory: many(generationHistory),
}));

export const generationHistoryRelations = relations(generationHistory, ({ one }) => ({
  user: one(users, { fields: [generationHistory.userId], references: [users.id] }),
  project: one(projects, { fields: [generationHistory.projectId], references: [projects.id] }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGenerationHistorySchema = createInsertSchema(generationHistory).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type GenerationHistory = typeof generationHistory.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertGenerationHistory = z.infer<typeof insertGenerationHistorySchema>;
