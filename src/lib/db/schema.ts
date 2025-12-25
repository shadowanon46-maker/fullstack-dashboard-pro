// src/lib/db/schema.ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type for selecting users from the database
export type User = InferSelectModel<typeof users>;

import { z } from "zod";

export const userInsertSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["user", "admin"]).optional().default("user"),
});

export const userUpdateSchema = userInsertSchema.partial().extend({
  id: z.number().int().positive(),
});

// Audit Log table for tracking activities
import { integer, json } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  action: text('action').notNull(), // e.g., 'user.created', 'user.deleted', 'login', 'logout'
  entityId: integer('entity_id'), // ID of the affected entity
  metadata: json('metadata'), // Additional data (optional)
  createdAt: timestamp('created_at').defaultNow(),
});

export type AuditLog = InferSelectModel<typeof auditLogs>;