import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPropertySchema, insertUserProfileSchema, insertMessageSchema } from "@shared/schema";

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
      // Return an empty profile if none exists yet
      return res.json({
        id: null,
        userId: req.user!.id,
        fullName: null,
        age: null,
        occupation: null,
        location: null,
        idealLocation: null,
        budget: null,
        hobbies: [],
        interests: [],
        lifestyle: null,
        cleanliness: null,
        smokingPreference: null,
        petPreference: null,
        roommateQualities: [],
        additionalInfo: null,
        profileComplete: false
      });
    }
    res.json(profile);
  });

  app.post("/api/profile", async (req, res) => {
    console.log("Profile save request, auth status:", req.isAuthenticated(), "user:", req.user);
    console.log("Profile data received:", JSON.stringify(req.body, null, 2));
    
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }

    // Log idealLocation value specifically
    console.log("idealLocation value:", req.body.idealLocation);

    const parseResult = insertUserProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.log("Profile validation error:", parseResult.error);
      res.status(400).json(parseResult.error);
      return;
    }
    console.log("Parsed profile data:", JSON.stringify(parseResult.data, null, 2));

    const existingProfile = await storage.getUserProfile(req.user!.id);
    let profile;

    if (existingProfile) {
      profile = await storage.updateUserProfile(req.user!.id, parseResult.data);
    } else {
      profile = await storage.createUserProfile(req.user!.id, parseResult.data);
    }

    console.log("Saved profile:", JSON.stringify(profile, null, 2));
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

  // Messaging Routes
  
  // Get user conversations
  app.get("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }
    
    const conversations = await storage.getUserConversations(req.user!.id);
    
    // Enhance conversations with user information
    const enhancedConversations = await Promise.all(conversations.map(async (conversation) => {
      // Determine which user ID is the other participant (not the current user)
      const otherUserId = conversation.user1Id === req.user!.id 
        ? conversation.user2Id 
        : conversation.user1Id;
      
      // Get the other user's info
      const otherUser = await storage.getUser(otherUserId);
      const otherUserProfile = await storage.getUserProfile(otherUserId);
      
      return {
        ...conversation,
        otherUser: {
          id: otherUser?.id,
          username: otherUser?.username,
          fullName: otherUserProfile?.fullName,
          avatarUrl: otherUser?.avatarUrl,
        }
      };
    }));
    
    // Sort by most recent message first
    const sortedConversations = enhancedConversations.sort((a, b) => {
      const dateA = new Date(a.lastMessageAt || 0);
      const dateB = new Date(b.lastMessageAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    res.json(sortedConversations);
  });
  
  // Get messages for a specific conversation
  app.get("/api/conversations/:conversationId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }
    
    const conversationId = parseInt(req.params.conversationId);
    const conversation = await storage.getConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).send("Conversation not found");
    }
    
    // Check if the user is part of this conversation
    if (conversation.user1Id !== req.user!.id && conversation.user2Id !== req.user!.id) {
      return res.status(403).send("Forbidden");
    }
    
    const messages = await storage.getMessages(conversationId);
    
    // Mark messages as read if the current user is the recipient
    await storage.markMessagesAsRead(conversationId, req.user!.id);
    
    res.json(messages);
  });
  
  // Send a message
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }
    
    const parseResult = insertMessageSchema.safeParse({
      ...req.body,
      senderId: req.user!.id
    });
    
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }
    
    // Validate that the receiver exists
    const receiver = await storage.getUser(parseResult.data.receiverId);
    if (!receiver) {
      return res.status(404).send("Recipient not found");
    }
    
    const message = await storage.sendMessage(parseResult.data);
    res.status(201).json(message);
  });
  
  // Start a new conversation with another user
  app.post("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }
    
    const { otherUserId } = req.body;
    
    if (!otherUserId) {
      return res.status(400).send("otherUserId is required");
    }
    
    // Validate that the other user exists
    const otherUser = await storage.getUser(parseInt(otherUserId));
    if (!otherUser) {
      return res.status(404).send("User not found");
    }
    
    const conversation = await storage.createOrUpdateConversation(
      req.user!.id,
      parseInt(otherUserId)
    );
    
    // Get other user's profile for the response
    const otherUserProfile = await storage.getUserProfile(parseInt(otherUserId));
    
    const enhancedConversation = {
      ...conversation,
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
        fullName: otherUserProfile?.fullName,
        avatarUrl: otherUser.avatarUrl,
      }
    };
    
    res.status(201).json(enhancedConversation);
  });

  const httpServer = createServer(app);
  return httpServer;
}
