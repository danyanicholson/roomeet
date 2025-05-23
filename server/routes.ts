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
    try {
      console.log("GET /api/conversations request from user ID:", req.user?.id);
      
      if (!req.isAuthenticated()) {
        res.status(401).send("Unauthorized");
        return;
      }
      
      const conversations = await storage.getUserConversations(req.user!.id);
      console.log("Raw conversations found:", JSON.stringify(conversations, null, 2));
      
      // Enhance conversations with user information
      const enhancedConversations = await Promise.all(conversations.map(async (conversation) => {
        // Determine which user ID is the other participant (not the current user)
        const otherUserId = conversation.user1Id === req.user!.id 
          ? conversation.user2Id 
          : conversation.user1Id;
        
        console.log(`For conversation ${conversation.id}, other user ID is: ${otherUserId}`);
        
        // Get the other user's info
        const otherUser = await storage.getUser(otherUserId);
        const otherUserProfile = await storage.getUserProfile(otherUserId);
        
        console.log(`Other user info for conversation ${conversation.id}:`, 
          JSON.stringify({ otherUser, otherUserProfile }, null, 2));
        
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
      
      console.log("Enhanced conversations to return:", JSON.stringify(sortedConversations, null, 2));
      res.json(sortedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).send("Internal server error");
    }
  });
  
  // Get messages for a specific conversation
  app.get("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      console.log(`GET /api/conversations/${req.params.conversationId}/messages request`);
      
      if (!req.isAuthenticated()) {
        res.status(401).send("Unauthorized");
        return;
      }
      
      const conversationId = parseInt(req.params.conversationId);
      console.log(`Looking for conversation ID: ${conversationId}`);
      
      const conversation = await storage.getConversationById(conversationId);
      
      if (!conversation) {
        console.log(`Conversation ${conversationId} not found`);
        return res.status(404).send("Conversation not found");
      }
      
      console.log(`Conversation found:`, JSON.stringify(conversation, null, 2));
      
      // Check if the user is part of this conversation
      if (conversation.user1Id !== req.user!.id && conversation.user2Id !== req.user!.id) {
        console.log(`User ${req.user!.id} is not part of conversation ${conversationId}`);
        return res.status(403).send("Forbidden");
      }
      
      const messages = await storage.getMessages(conversationId);
      console.log(`Found ${messages.length} messages for conversation ${conversationId}`);
      
      // Mark messages as read if the current user is the recipient
      await storage.markMessagesAsRead(conversationId, req.user!.id);
      
      console.log("Messages to return:", JSON.stringify(messages, null, 2));
      res.json(messages);
    } catch (error) {
      console.error(`Error fetching messages for conversation:`, error);
      res.status(500).send("Internal server error");
    }
  });
  
  // Send a message
  app.post("/api/messages", async (req, res) => {
    try {
      console.log("POST /api/messages request:", JSON.stringify(req.body, null, 2));
      
      if (!req.isAuthenticated()) {
        res.status(401).send("Unauthorized");
        return;
      }
      
      const messageData = {
        ...req.body,
        senderId: req.user!.id
      };
      
      console.log("Message data with sender ID:", JSON.stringify(messageData, null, 2));
      
      const parseResult = insertMessageSchema.safeParse(messageData);
      
      if (!parseResult.success) {
        console.log("Message validation error:", parseResult.error);
        return res.status(400).json(parseResult.error);
      }
      
      // Validate that the receiver exists
      const receiver = await storage.getUser(parseResult.data.receiverId);
      if (!receiver) {
        console.log(`Recipient user ID ${parseResult.data.receiverId} not found`);
        return res.status(404).send("Recipient not found");
      }
      
      console.log(`Sending message to user ${receiver.username} (ID: ${receiver.id})`);
      
      const message = await storage.sendMessage(parseResult.data);
      console.log("Message sent successfully:", JSON.stringify(message, null, 2));
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).send("Internal server error");
    }
  });
  
  // Start a new conversation with another user
  app.post("/api/conversations", async (req, res) => {
    try {
      console.log("POST /api/conversations request:", JSON.stringify(req.body, null, 2));
      console.log("User authenticated:", req.isAuthenticated());
      
      if (!req.isAuthenticated()) {
        res.status(401).send("Unauthorized");
        return;
      }
      
      console.log("Current user ID:", req.user!.id);
      const { otherUserId } = req.body;
      console.log("Other user ID from request:", otherUserId);
      
      if (!otherUserId) {
        console.log("Error: otherUserId is missing");
        return res.status(400).send("otherUserId is required");
      }
      
      // Validate that the other user exists
      const otherUser = await storage.getUser(parseInt(otherUserId));
      if (!otherUser) {
        console.log("Error: Other user not found");
        return res.status(404).send("User not found");
      }
      console.log("Other user found:", otherUser.username);
      
      const conversation = await storage.createOrUpdateConversation(
        req.user!.id,
        parseInt(otherUserId)
      );
      console.log("Conversation created/updated:", JSON.stringify(conversation, null, 2));
      
      // Get other user's profile for the response
      const otherUserProfile = await storage.getUserProfile(parseInt(otherUserId));
      console.log("Other user profile:", JSON.stringify(otherUserProfile, null, 2));
      
      const enhancedConversation = {
        ...conversation,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          fullName: otherUserProfile?.fullName,
          avatarUrl: otherUser.avatarUrl,
        }
      };
      
      console.log("Enhanced conversation to return:", JSON.stringify(enhancedConversation, null, 2));
      res.status(200).json(enhancedConversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).send("Internal server error");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
