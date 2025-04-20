import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "formscript-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register a new user
  app.post("/api/register", async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Create default user settings
        storage.createUserSettings(user.id);
        
        // Log the registration activity
        storage.createActivityLog({
          userId: user.id,
          action: "registration",
          ip: req.ip,
          userAgent: req.headers["user-agent"] || "",
          timestamp: new Date(),
          details: { method: "email_password" },
        });

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login user
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      req.login(user, (err) => {
        if (err) return next(err);

        // Log the login activity
        storage.createActivityLog({
          userId: user.id,
          action: "login",
          ip: req.ip,
          userAgent: req.headers["user-agent"] || "",
          timestamp: new Date(),
          details: { method: "username_password" },
        });

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout user
  app.post("/api/logout", (req, res, next) => {
    if (req.isAuthenticated()) {
      const userId = req.user.id;
      req.logout((err) => {
        if (err) return next(err);
        
        // Log the logout activity
        storage.createActivityLog({
          userId,
          action: "logout",
          ip: req.ip,
          userAgent: req.headers["user-agent"] || "",
          timestamp: new Date(),
        });
        
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Update user profile
  app.put("/api/user/profile", (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const { fullName, email } = req.body;
      
      // Validate data
      if (!fullName || !email) {
        return res.status(400).json({ message: "fullName and email are required" });
      }
      
      storage.updateUser(req.user.id, { fullName, email })
        .then(updatedUser => {
          storage.createActivityLog({
            userId: req.user.id,
            action: "profile_update",
            ip: req.ip,
            userAgent: req.headers["user-agent"] || "",
            timestamp: new Date(),
            details: { fields: ["fullName", "email"] },
          });
          
          // Remove password from response
          const { password, ...userWithoutPassword } = updatedUser;
          res.json(userWithoutPassword);
        })
        .catch(error => next(error));
    } catch (error) {
      next(error);
    }
  });

  // Update user password
  app.put("/api/user/password", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Verify current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const passwordMatches = await comparePasswords(currentPassword, user.password);
      if (!passwordMatches) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash and save new password
      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUser(req.user.id, { password: hashedNewPassword });
      
      // Log password change
      storage.createActivityLog({
        userId: req.user.id,
        action: "password_change",
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
        timestamp: new Date(),
      });
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });
}
