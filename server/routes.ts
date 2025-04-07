import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPropertySchema, insertUserProfileSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // User Profile Routes
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }

    const profile = await storage.getUserProfile(req.user!.id);
    if (!profile) {
      res.status(404).send("Profile not found");
      return;
    }
    res.json(profile);
  });

  app.post("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }

    const parseResult = insertUserProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(parseResult.error);
      return;
    }

    const existingProfile = await storage.getUserProfile(req.user!.id);
    let profile;

    if (existingProfile) {
      profile = await storage.updateUserProfile(req.user!.id, parseResult.data);
    } else {
      profile = await storage.createUserProfile(req.user!.id, parseResult.data);
    }

    res.status(201).json(profile);
  });

  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }

    // For partial updates we don't need to validate the entire schema
    const profile = await storage.updateUserProfile(req.user!.id, req.body);
    res.json(profile);
  });

  // Get all user profiles (for matching)
  app.get("/api/profiles", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }

    const profiles = await storage.getAllUserProfiles();
    // Filter out the current user's profile
    const otherProfiles = profiles.filter(profile => profile.userId !== req.user!.id);
    res.json(otherProfiles);
  });

  // Legacy Property Routes - Keeping for backward compatibility
  app.get("/api/properties", async (_req, res) => {
    const properties = await storage.getProperties();
    res.json(properties);
  });

  app.get("/api/properties/:id", async (req, res) => {
    const property = await storage.getProperty(parseInt(req.params.id));
    if (!property) {
      res.status(404).send("Property not found");
      return;
    }
    res.json(property);
  });

  app.post("/api/properties", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }

    const parseResult = insertPropertySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(parseResult.error);
      return;
    }

    const property = await storage.createProperty(req.user!.id, parseResult.data);
    res.status(201).json(property);
  });

  const httpServer = createServer(app);
  return httpServer;
}
