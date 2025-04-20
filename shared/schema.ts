import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  profileImage: text("profile_image"),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

// Forms table
export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  schema: jsonb("schema").notNull(), // Stores form elements schema
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Scripts table
export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull().references(() => forms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Form submissions table
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull().references(() => forms.id),
  userId: integer("user_id").references(() => users.id),
  formData: jsonb("form_data").notNull(),
  scriptOutput: jsonb("script_output"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  ip: text("ip"),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // profile_update, form_submission, etc.
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

// User settings table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  theme: text("theme").default("light"),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  language: text("language").default("en"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity logs table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // login, logout, form_creation, etc.
  ip: text("ip"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: jsonb("details"),
});

// OTP table
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email"),
  phone: text("phone"),
  code: text("code").notNull(),
  type: text("type").notNull(), // registration, login, password_reset
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0),
  verified: boolean("verified").default(false),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
});

export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScriptSchema = createInsertSchema(scripts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type User = typeof users.$inferSelect;
export type Form = typeof forms.$inferSelect;
export type Script = typeof scripts.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type UserSetting = typeof userSettings.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type OTP = typeof otps.$inferSelect;

// Form element types
export type FormElementType = 
  | 'text'
  | 'number'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'textarea'
  | 'date';

export type FormElement = {
  id: string;
  type: FormElementType;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: any;
};

export type FormSchema = {
  elements: FormElement[];
};
