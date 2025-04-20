import { 
  users, forms, scripts, formSubmissions, notifications, userSettings, activityLogs,
  type User, type Form, type Script, type FormSubmission, type Notification, type UserSetting, type ActivityLog,
  type InsertUser, type InsertForm, type InsertScript, type InsertFormSubmission
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'sessions'
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      fullName: insertUser.fullName || null,
      profileImage: null,
      isAdmin: false
    }).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Form operations
  async getForm(id: number): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form;
  }

  async getFormsByUserId(userId: number): Promise<Form[]> {
    return await db.select().from(forms).where(eq(forms.userId, userId));
  }

  async getPublicForms(): Promise<Form[]> {
    return await db.select().from(forms).where(eq(forms.isPublic, true));
  }

  async createForm(insertForm: InsertForm): Promise<Form> {
    const now = new Date();
    const [form] = await db.insert(forms).values({
      ...insertForm,
      description: insertForm.description || null,
      isPublic: insertForm.isPublic || false,
      createdAt: now,
      updatedAt: now
    }).returning();
    return form;
  }

  async updateForm(id: number, data: Partial<Form>): Promise<Form> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    const [form] = await db.update(forms).set(updateData).where(eq(forms.id, id)).returning();
    return form;
  }

  async deleteForm(id: number): Promise<void> {
    await db.delete(forms).where(eq(forms.id, id));
  }

  // Script operations
  async getScript(id: number): Promise<Script | undefined> {
    const [script] = await db.select().from(scripts).where(eq(scripts.id, id));
    return script;
  }

  async getScriptByFormId(formId: number): Promise<Script | undefined> {
    const [script] = await db.select().from(scripts).where(eq(scripts.formId, formId));
    return script;
  }

  async createScript(insertScript: InsertScript): Promise<Script> {
    const now = new Date();
    const [script] = await db.insert(scripts).values({
      ...insertScript,
      createdAt: now,
      updatedAt: now
    }).returning();
    return script;
  }

  async updateScript(id: number, data: Partial<Script>): Promise<Script> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    const [script] = await db.update(scripts).set(updateData).where(eq(scripts.id, id)).returning();
    return script;
  }

  async deleteScript(id: number): Promise<void> {
    await db.delete(scripts).where(eq(scripts.id, id));
  }

  // Form submission operations
  async getFormSubmission(id: number): Promise<FormSubmission | undefined> {
    const [submission] = await db.select().from(formSubmissions).where(eq(formSubmissions.id, id));
    return submission;
  }

  async getFormSubmissionsByFormId(formId: number): Promise<FormSubmission[]> {
    return await db.select().from(formSubmissions).where(eq(formSubmissions.formId, formId));
  }

  async createFormSubmission(submission: Partial<InsertFormSubmission>): Promise<FormSubmission> {
    const [formSubmission] = await db.insert(formSubmissions).values({
      formId: submission.formId!,
      formData: submission.formData!,
      userId: submission.userId || null,
      ip: submission.ip || null,
      scriptOutput: submission.scriptOutput || null,
      submittedAt: new Date()
    }).returning();
    return formSubmission;
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: Partial<Notification>): Promise<Notification> {
    const now = new Date();
    const [newNotification] = await db.insert(notifications).values({
      userId: notification.userId!,
      type: notification.type!,
      message: notification.message!,
      isRead: false,
      metadata: notification.metadata || {},
      createdAt: now
    }).returning();
    return newNotification;
  }

  async updateNotification(id: number, data: Partial<Notification>): Promise<Notification> {
    const [notification] = await db.update(notifications).set(data).where(eq(notifications.id, id)).returning();
    return notification;
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // User settings operations
  async getUserSettingsByUserId(userId: number): Promise<UserSetting | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createUserSettings(userId: number): Promise<UserSetting> {
    const [settings] = await db.insert(userSettings).values({
      userId,
      theme: 'system',
      emailNotifications: true,
      updatedAt: new Date()
    }).returning();
    return settings;
  }

  async updateUserSettings(id: number, data: Partial<UserSetting>): Promise<UserSetting> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    const [settings] = await db.update(userSettings).set(updateData).where(eq(userSettings.id, id)).returning();
    return settings;
  }

  // Activity log operations
  async createActivityLog(log: Partial<ActivityLog>): Promise<ActivityLog> {
    const [activityLog] = await db.insert(activityLogs).values({
      userId: log.userId!,
      action: log.action!,
      ip: log.ip || '',
      userAgent: log.userAgent || '',
      timestamp: log.timestamp || new Date(),
      details: log.details || {}
    }).returning();
    return activityLog;
  }

  async getActivityLogsByUserId(userId: number): Promise<ActivityLog[]> {
    return await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp));
  }
}