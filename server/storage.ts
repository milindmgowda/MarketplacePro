import {
  users,
  forms,
  scripts,
  formSubmissions,
  notifications,
  userSettings,
  activityLogs,
  User,
  Form,
  Script,
  FormSubmission,
  Notification,
  UserSetting,
  ActivityLog,
  InsertUser,
  InsertForm,
  InsertScript,
  InsertFormSubmission
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Form operations
  getForm(id: number): Promise<Form | undefined>;
  getFormsByUserId(userId: number): Promise<Form[]>;
  getPublicForms(): Promise<Form[]>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: number, data: Partial<Form>): Promise<Form>;
  deleteForm(id: number): Promise<void>;

  // Script operations
  getScript(id: number): Promise<Script | undefined>;
  getScriptByFormId(formId: number): Promise<Script | undefined>;
  createScript(script: InsertScript): Promise<Script>;
  updateScript(id: number, data: Partial<Script>): Promise<Script>;
  deleteScript(id: number): Promise<void>;

  // Form submission operations
  getFormSubmission(id: number): Promise<FormSubmission | undefined>;
  getFormSubmissionsByFormId(formId: number): Promise<FormSubmission[]>;
  createFormSubmission(submission: Partial<InsertFormSubmission>): Promise<FormSubmission>;

  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: Partial<Notification>): Promise<Notification>;
  updateNotification(id: number, data: Partial<Notification>): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;

  // User settings operations
  getUserSettingsByUserId(userId: number): Promise<UserSetting | undefined>;
  createUserSettings(userId: number): Promise<UserSetting>;
  updateUserSettings(id: number, data: Partial<UserSetting>): Promise<UserSetting>;

  // Activity log operations
  createActivityLog(log: Partial<ActivityLog>): Promise<ActivityLog>;
  getActivityLogsByUserId(userId: number): Promise<ActivityLog[]>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private formsMap: Map<number, Form>;
  private scriptsMap: Map<number, Script>;
  private formSubmissionsMap: Map<number, FormSubmission>;
  private notificationsMap: Map<number, Notification>;
  private userSettingsMap: Map<number, UserSetting>;
  private activityLogsMap: Map<number, ActivityLog>;
  
  userIdCounter: number;
  formIdCounter: number;
  scriptIdCounter: number;
  submissionIdCounter: number;
  notificationIdCounter: number;
  settingsIdCounter: number;
  activityLogIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.usersMap = new Map();
    this.formsMap = new Map();
    this.scriptsMap = new Map();
    this.formSubmissionsMap = new Map();
    this.notificationsMap = new Map();
    this.userSettingsMap = new Map();
    this.activityLogsMap = new Map();
    
    this.userIdCounter = 1;
    this.formIdCounter = 1;
    this.scriptIdCounter = 1;
    this.submissionIdCounter = 1;
    this.notificationIdCounter = 1;
    this.settingsIdCounter = 1;
    this.activityLogIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      isAdmin: false,
      profileImage: null,
    };
    this.usersMap.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = this.usersMap.get(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    const updatedUser = { ...user, ...data };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    this.usersMap.delete(id);
  }

  // Form operations
  async getForm(id: number): Promise<Form | undefined> {
    return this.formsMap.get(id);
  }

  async getFormsByUserId(userId: number): Promise<Form[]> {
    return Array.from(this.formsMap.values()).filter(
      (form) => form.userId === userId,
    );
  }

  async getPublicForms(): Promise<Form[]> {
    return Array.from(this.formsMap.values()).filter(
      (form) => form.isPublic,
    );
  }

  async createForm(insertForm: InsertForm): Promise<Form> {
    const id = this.formIdCounter++;
    const now = new Date();
    const form: Form = {
      ...insertForm,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.formsMap.set(id, form);
    return form;
  }

  async updateForm(id: number, data: Partial<Form>): Promise<Form> {
    const form = this.formsMap.get(id);
    if (!form) {
      throw new Error(`Form with ID ${id} not found`);
    }
    const updatedForm = { ...form, ...data, updatedAt: new Date() };
    this.formsMap.set(id, updatedForm);
    return updatedForm;
  }

  async deleteForm(id: number): Promise<void> {
    this.formsMap.delete(id);
    
    // Also delete related scripts and submissions
    const scriptsToDelete = Array.from(this.scriptsMap.values())
      .filter(script => script.formId === id)
      .map(script => script.id);
    
    const submissionsToDelete = Array.from(this.formSubmissionsMap.values())
      .filter(submission => submission.formId === id)
      .map(submission => submission.id);
    
    scriptsToDelete.forEach(scriptId => this.scriptsMap.delete(scriptId));
    submissionsToDelete.forEach(submissionId => this.formSubmissionsMap.delete(submissionId));
  }

  // Script operations
  async getScript(id: number): Promise<Script | undefined> {
    return this.scriptsMap.get(id);
  }

  async getScriptByFormId(formId: number): Promise<Script | undefined> {
    return Array.from(this.scriptsMap.values()).find(
      (script) => script.formId === formId,
    );
  }

  async createScript(insertScript: InsertScript): Promise<Script> {
    const id = this.scriptIdCounter++;
    const now = new Date();
    const script: Script = {
      ...insertScript,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.scriptsMap.set(id, script);
    return script;
  }

  async updateScript(id: number, data: Partial<Script>): Promise<Script> {
    const script = this.scriptsMap.get(id);
    if (!script) {
      throw new Error(`Script with ID ${id} not found`);
    }
    const updatedScript = { ...script, ...data, updatedAt: new Date() };
    this.scriptsMap.set(id, updatedScript);
    return updatedScript;
  }

  async deleteScript(id: number): Promise<void> {
    this.scriptsMap.delete(id);
  }

  // Form submission operations
  async getFormSubmission(id: number): Promise<FormSubmission | undefined> {
    return this.formSubmissionsMap.get(id);
  }

  async getFormSubmissionsByFormId(formId: number): Promise<FormSubmission[]> {
    return Array.from(this.formSubmissionsMap.values()).filter(
      (submission) => submission.formId === formId,
    );
  }

  async createFormSubmission(submission: Partial<InsertFormSubmission>): Promise<FormSubmission> {
    const id = this.submissionIdCounter++;
    const now = new Date();
    const formSubmission: FormSubmission = {
      ...submission,
      id,
      submittedAt: now,
      formId: submission.formId!,
      formData: submission.formData!,
    };
    this.formSubmissionsMap.set(id, formSubmission);
    return formSubmission;
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationsMap.get(id);
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values()).filter(
      (notification) => notification.userId === userId,
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notification: Partial<Notification>): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const newNotification: Notification = {
      id,
      userId: notification.userId!,
      type: notification.type!,
      message: notification.message!,
      isRead: notification.isRead || false,
      createdAt: now,
      metadata: notification.metadata || null,
    };
    this.notificationsMap.set(id, newNotification);
    return newNotification;
  }

  async updateNotification(id: number, data: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationsMap.get(id);
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    const updatedNotification = { ...notification, ...data };
    this.notificationsMap.set(id, updatedNotification);
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<void> {
    this.notificationsMap.delete(id);
  }

  // User settings operations
  async getUserSettingsByUserId(userId: number): Promise<UserSetting | undefined> {
    return Array.from(this.userSettingsMap.values()).find(
      (settings) => settings.userId === userId,
    );
  }

  async createUserSettings(userId: number): Promise<UserSetting> {
    const id = this.settingsIdCounter++;
    const settings: UserSetting = {
      id,
      userId,
      theme: 'light',
      emailNotifications: true,
      smsNotifications: false,
      language: 'en',
    };
    this.userSettingsMap.set(id, settings);
    return settings;
  }

  async updateUserSettings(id: number, data: Partial<UserSetting>): Promise<UserSetting> {
    const settings = this.userSettingsMap.get(id);
    if (!settings) {
      throw new Error(`User settings with ID ${id} not found`);
    }
    const updatedSettings = { ...settings, ...data };
    this.userSettingsMap.set(id, updatedSettings);
    return updatedSettings;
  }

  // Activity log operations
  async createActivityLog(log: Partial<ActivityLog>): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const now = log.timestamp || new Date();
    const activityLog: ActivityLog = {
      id,
      userId: log.userId,
      action: log.action!,
      ip: log.ip || null,
      userAgent: log.userAgent || null,
      timestamp: now,
      details: log.details || null,
    };
    this.activityLogsMap.set(id, activityLog);
    return activityLog;
  }

  async getActivityLogsByUserId(userId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogsMap.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
