import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { executeJavaScript } from "./form-execution";
import { z } from "zod";
import { insertFormSchema, insertScriptSchema, insertFormSubmissionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  // Create a new form
  app.post("/api/forms", ensureAuthenticated, async (req, res, next) => {
    try {
      const formData = insertFormSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newForm = await storage.createForm(formData);
      
      // Log form creation
      storage.createActivityLog({
        userId: req.user.id,
        action: "form_creation",
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
        timestamp: new Date(),
        details: { formId: newForm.id, title: newForm.title },
      });
      
      res.status(201).json(newForm);
    } catch (error) {
      next(error);
    }
  });

  // Get all forms for the current user
  app.get("/api/forms", ensureAuthenticated, async (req, res, next) => {
    try {
      const forms = await storage.getFormsByUserId(req.user.id);
      res.json(forms);
    } catch (error) {
      next(error);
    }
  });

  // Get public forms for the explore page
  app.get("/api/forms/public", async (req, res, next) => {
    try {
      const publicForms = await storage.getPublicForms();
      res.json(publicForms);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific form by ID
  app.get("/api/forms/:id", async (req, res, next) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
      
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check if form is public or belongs to the authenticated user
      if (!form.isPublic && (!req.isAuthenticated() || form.userId !== req.user.id)) {
        return res.status(403).json({ message: "Not authorized to view this form" });
      }
      
      res.json(form);
    } catch (error) {
      next(error);
    }
  });

  // Update a form
  app.put("/api/forms/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
      
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      if (form.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this form" });
      }
      
      const updatedForm = await storage.updateForm(formId, req.body);
      
      // Log form update
      storage.createActivityLog({
        userId: req.user.id,
        action: "form_update",
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
        timestamp: new Date(),
        details: { formId, title: updatedForm.title },
      });
      
      res.json(updatedForm);
    } catch (error) {
      next(error);
    }
  });

  // Delete a form
  app.delete("/api/forms/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
      
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      if (form.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this form" });
      }
      
      await storage.deleteForm(formId);
      
      // Log form deletion
      storage.createActivityLog({
        userId: req.user.id,
        action: "form_deletion",
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
        timestamp: new Date(),
        details: { formId, title: form.title },
      });
      
      res.status(200).json({ message: "Form deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Create or update script for a form
  app.post("/api/forms/:id/script", ensureAuthenticated, async (req, res, next) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
      
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      if (form.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to add script to this form" });
      }
      
      const scriptData = insertScriptSchema.parse({
        formId,
        userId: req.user.id,
        code: req.body.code,
      });
      
      // Check if script already exists for this form
      const existingScript = await storage.getScriptByFormId(formId);
      
      let script;
      if (existingScript) {
        script = await storage.updateScript(existingScript.id, { code: scriptData.code });
      } else {
        script = await storage.createScript(scriptData);
      }
      
      // Log script creation/update
      storage.createActivityLog({
        userId: req.user.id,
        action: existingScript ? "script_update" : "script_creation",
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
        timestamp: new Date(),
        details: { formId, scriptId: script.id },
      });
      
      res.status(existingScript ? 200 : 201).json(script);
    } catch (error) {
      next(error);
    }
  });

  // Get script for a form
  app.get("/api/forms/:id/script", async (req, res, next) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
      
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check if user is authorized to view the script
      if (!form.isPublic && (!req.isAuthenticated() || form.userId !== req.user.id)) {
        return res.status(403).json({ message: "Not authorized to view this script" });
      }
      
      const script = await storage.getScriptByFormId(formId);
      if (!script) {
        return res.status(404).json({ message: "Script not found" });
      }
      
      res.json(script);
    } catch (error) {
      next(error);
    }
  });

  // Submit a form and execute the associated script
  app.post("/api/forms/:id/submit", async (req, res, next) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
      
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Get the script for this form
      const script = await storage.getScriptByFormId(formId);
      if (!script) {
        return res.status(404).json({ message: "Script not found for this form" });
      }
      
      const formData = req.body;
      
      // Execute the JavaScript code
      let scriptOutput;
      try {
        scriptOutput = await executeJavaScript(script.code, formData);
      } catch (error: any) {
        return res.status(400).json({
          message: "Script execution failed",
          error: error.message,
        });
      }
      
      // Create a form submission record
      const submissionData = {
        formId,
        userId: req.isAuthenticated() ? req.user.id : undefined,
        formData,
        scriptOutput,
        ip: req.ip,
      };
      
      const submission = await storage.createFormSubmission(submissionData);
      
      // Log form submission
      if (req.isAuthenticated()) {
        storage.createActivityLog({
          userId: req.user.id,
          action: "form_submission",
          ip: req.ip,
          userAgent: req.headers["user-agent"] || "",
          timestamp: new Date(),
          details: { formId, submissionId: submission.id },
        });
      }
      
      // Create a notification for the form owner if different from submitter
      if (form.userId !== (req.isAuthenticated() ? req.user.id : null)) {
        await storage.createNotification({
          userId: form.userId,
          type: "form_submission",
          message: `Your form "${form.title}" received a new submission`,
          metadata: { formId, submissionId: submission.id },
        });
      }
      
      res.status(201).json({
        submission,
        scriptOutput,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get form submissions for a form
  app.get("/api/forms/:id/submissions", ensureAuthenticated, async (req, res, next) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
      
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      if (form.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view submissions for this form" });
      }
      
      const submissions = await storage.getFormSubmissionsByFormId(formId);
      res.json(submissions);
    } catch (error) {
      next(error);
    }
  });

  // Get user notifications
  app.get("/api/notifications", ensureAuthenticated, async (req, res, next) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id/read", ensureAuthenticated, async (req, res, next) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this notification" });
      }
      
      const updatedNotification = await storage.updateNotification(notificationId, { isRead: true });
      res.json(updatedNotification);
    } catch (error) {
      next(error);
    }
  });

  // Get user settings
  app.get("/api/settings", ensureAuthenticated, async (req, res, next) => {
    try {
      const settings = await storage.getUserSettingsByUserId(req.user.id);
      if (!settings) {
        // Create default settings if not exists
        const defaultSettings = await storage.createUserSettings(req.user.id);
        return res.json(defaultSettings);
      }
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });
  
  // Test endpoint to execute JavaScript code without saving it
  app.post("/api/forms/test/execute", async (req, res, next) => {
    try {
      const { code, formData } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "No code provided" });
      }
      
      // Execute the JavaScript code
      let result;
      try {
        result = await executeJavaScript(code, formData || {});
      } catch (error: any) {
        return res.status(400).json({
          message: "Script execution failed",
          error: error.message,
        });
      }
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Update user settings
  app.put("/api/settings", ensureAuthenticated, async (req, res, next) => {
    try {
      const settings = await storage.getUserSettingsByUserId(req.user.id);
      
      if (!settings) {
        const newSettings = await storage.createUserSettings(req.user.id);
        const updatedSettings = await storage.updateUserSettings(newSettings.id, req.body);
        return res.json(updatedSettings);
      }
      
      const updatedSettings = await storage.updateUserSettings(settings.id, req.body);
      res.json(updatedSettings);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
