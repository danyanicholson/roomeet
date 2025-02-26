import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPropertySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

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
