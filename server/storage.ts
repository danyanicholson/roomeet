import { 
  User, 
  Property, 
  InsertUser, 
  InsertProperty, 
  UserProfile, 
  InsertUserProfile,
  Message,
  InsertMessage,
  Conversation,
  InsertConversation
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(userId: number, profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  getAllUserProfiles(): Promise<UserProfile[]>;
  
  // Legacy property methods - keeping for backward compatibility
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(userId: number, property: InsertProperty): Promise<Property>;
  
  // Messaging methods
  getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getUserConversations(userId: number): Promise<Conversation[]>;
  createOrUpdateConversation(user1Id: number, user2Id: number): Promise<Conversation>;
  
  getMessages(conversationId: number): Promise<Message[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;
  
  sessionStore: session.Store;
}

// Helper type to ensure array fields are always string arrays, never null
type NonNullStringArray = string[];

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userProfiles: Map<number, UserProfile>; // Map with profile ID as key
  private userIdToProfileIdMap: Map<number, number>; // Maps user ID to their profile ID
  private properties: Map<number, Property>;
  private messages: Map<number, Message>;
  private conversations: Map<number, Conversation>;
  private currentUserId: number;
  private currentPropertyId: number;
  private currentProfileId: number;
  private currentMessageId: number;
  private currentConversationId: number;
  sessionStore: session.Store;

  constructor() {
    console.log("Initializing MemStorage...");
    this.users = new Map();
    this.userProfiles = new Map();
    this.userIdToProfileIdMap = new Map(); // Added this map to track which profile belongs to which user
    this.properties = new Map();
    this.messages = new Map();
    this.conversations = new Map();
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentProfileId = 1;
    this.currentMessageId = 1;
    this.currentConversationId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    console.log("MemStorage initialization complete");
    console.log("Storage maps initialized:", {
      users: this.users.size,
      userProfiles: this.userProfiles.size,
      userIdToProfileIdMap: this.userIdToProfileIdMap.size,
      properties: this.properties.size,
      messages: this.messages.size,
      conversations: this.conversations.size
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      avatarUrl: insertUser.avatarUrl ?? null,
      bio: insertUser.bio ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    // Look up the profile ID from the user ID mapping
    const profileId = this.userIdToProfileIdMap.get(userId);
    
    // If no profile ID exists for this user, they don't have a profile yet
    if (profileId === undefined) {
      return undefined;
    }
    
    // Get the profile using the profile ID
    return this.userProfiles.get(profileId);
  }

  async createUserProfile(userId: number, insertProfile: InsertUserProfile): Promise<UserProfile> {
    const id = this.currentProfileId++;
    
    // Handle array fields with proper default values
    const hobbies: string[] = insertProfile.hobbies ?? [];
    const interests: string[] = insertProfile.interests ?? [];
    const roommateQualities: string[] = insertProfile.roommateQualities ?? [];
    
    const profile: UserProfile = {
      id,
      userId,
      fullName: insertProfile.fullName ?? null,
      age: insertProfile.age ?? null,
      occupation: insertProfile.occupation ?? null,
      location: insertProfile.location ?? null,
      idealLocation: insertProfile.idealLocation ?? null,
      budget: insertProfile.budget ?? null,
      hobbies,
      interests,
      lifestyle: insertProfile.lifestyle ?? null,
      cleanliness: insertProfile.cleanliness ?? null,
      smokingPreference: insertProfile.smokingPreference ?? null,
      petPreference: insertProfile.petPreference ?? null,
      roommateQualities,
      additionalInfo: insertProfile.additionalInfo ?? null,
      profileComplete: insertProfile.fullName !== null && 
                      interests.length > 0 && 
                      hobbies.length > 0,
    };
    
    // Store the profile and update the user-to-profile mapping
    this.userProfiles.set(id, profile);
    this.userIdToProfileIdMap.set(userId, id);
    
    return profile;
  }

  async updateUserProfile(userId: number, updateData: Partial<InsertUserProfile>): Promise<UserProfile> {
    console.log("Updating user profile for userId:", userId);
    console.log("Update data received:", JSON.stringify(updateData, null, 2));
    console.log("idealLocation value:", updateData.idealLocation);
    
    // Get profile ID directly from our mapping
    const profileId = this.userIdToProfileIdMap.get(userId);
    
    // If we don't have a profile ID for this user yet, create a new profile instead
    if (profileId === undefined) {
      console.log("No existing profile found, creating a new one");
      return this.createUserProfile(userId, updateData as InsertUserProfile);
    }
    
    const existingProfile = this.userProfiles.get(profileId);
    console.log("Existing profile:", JSON.stringify(existingProfile, null, 2));
    
    // Double-check that we have an existing profile
    if (!existingProfile) {
      // If somehow we have a profile ID but no profile, create a new one with the update data
      console.log("Profile ID exists but no profile found, creating a new one");
      return this.createUserProfile(userId, updateData as InsertUserProfile);
    }

    // Handle array fields separately to ensure proper typing
    const hobbies: string[] = updateData.hobbies !== undefined ? (updateData.hobbies ?? []) : (existingProfile.hobbies ?? []);
    const interests: string[] = updateData.interests !== undefined ? (updateData.interests ?? []) : (existingProfile.interests ?? []);
    const roommateQualities: string[] = updateData.roommateQualities !== undefined ? 
      (updateData.roommateQualities ?? []) : (existingProfile.roommateQualities ?? []);

    // Update the existing profile
    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...updateData,
      // Explicitly ensure idealLocation is included
      idealLocation: updateData.idealLocation !== undefined ? updateData.idealLocation : existingProfile.idealLocation,
      // Explicitly assign array fields to ensure proper types
      hobbies,
      interests,
      roommateQualities,
      profileComplete: Boolean(
        (updateData.fullName || existingProfile.fullName) && 
        interests && interests.length > 0 && 
        hobbies && hobbies.length > 0
      ),
    };
    
    console.log("Updated profile to be saved:", JSON.stringify(updatedProfile, null, 2));
    
    // Now profileId is definitely defined
    this.userProfiles.set(profileId, updatedProfile);
    return updatedProfile;
  }

  async getAllUserProfiles(): Promise<UserProfile[]> {
    return Array.from(this.userProfiles.values());
  }

  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(userId: number, insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    
    // Handle array fields with proper default values
    const imageUrls = insertProperty.imageUrls ?? [];
    const amenities = insertProperty.amenities ?? [];
    
    const property: Property = {
      id,
      userId,
      title: insertProperty.title,
      description: insertProperty.description,
      price: insertProperty.price,
      location: insertProperty.location,
      roomType: insertProperty.roomType,
      imageUrls,
      amenities,
      available: insertProperty.available ?? true,
    };
    this.properties.set(id, property);
    return property;
  }

  // Messaging methods
  
  async getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    console.log(`getConversation called for users ${user1Id} and ${user2Id}`);
    
    // Make sure we have a consistent order for user IDs to avoid duplicate conversations
    const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    console.log(`Normalized user IDs: smaller=${smallerId}, larger=${largerId}`);
    
    // Find a conversation with these two users
    const conversation = Array.from(this.conversations.values()).find(
      conv => (conv.user1Id === smallerId && conv.user2Id === largerId)
    );
    
    console.log(conversation 
      ? `Found existing conversation: ${JSON.stringify(conversation, null, 2)}` 
      : `No conversation found between users ${smallerId} and ${largerId}`);
    
    return conversation;
  }
  
  async getConversationById(id: number): Promise<Conversation | undefined> {
    console.log(`getConversationById called for ID ${id}`);
    const conversation = this.conversations.get(id);
    console.log(conversation 
      ? `Found conversation: ${JSON.stringify(conversation, null, 2)}` 
      : `No conversation found with ID ${id}`);
    return conversation;
  }
  
  async getUserConversations(userId: number): Promise<Conversation[]> {
    console.log(`getUserConversations called for user ${userId}`);
    
    const allConversations = Array.from(this.conversations.values());
    console.log(`Total conversations in storage: ${allConversations.length}`);
    
    const userConversations = allConversations.filter(
      conv => conv.user1Id === userId || conv.user2Id === userId
    );
    
    console.log(`Found ${userConversations.length} conversations for user ${userId}`);
    return userConversations;
  }
  
  async createOrUpdateConversation(user1Id: number, user2Id: number): Promise<Conversation> {
    console.log(`createOrUpdateConversation called for users ${user1Id} and ${user2Id}`);
    
    // Make sure we have a consistent order for user IDs to avoid duplicate conversations
    const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    console.log(`Normalized user IDs: smaller=${smallerId}, larger=${largerId}`);
    
    // Check if a conversation already exists
    const existingConversation = await this.getConversation(smallerId, largerId);
    
    if (existingConversation) {
      console.log(`Updating existing conversation ID ${existingConversation.id}`);
      // Update the last message timestamp
      const updatedConversation: Conversation = {
        ...existingConversation,
        lastMessageAt: new Date(),
      };
      this.conversations.set(existingConversation.id, updatedConversation);
      console.log(`Updated conversation: ${JSON.stringify(updatedConversation, null, 2)}`);
      return updatedConversation;
    }
    
    // Create a new conversation
    const id = this.currentConversationId++;
    console.log(`Creating new conversation with ID ${id}`);
    
    const newConversation: Conversation = {
      id,
      user1Id: smallerId,
      user2Id: largerId,
      lastMessageAt: new Date(),
      unreadCount: 0,
    };
    
    this.conversations.set(id, newConversation);
    console.log(`Created new conversation: ${JSON.stringify(newConversation, null, 2)}`);
    
    // Log all current conversations after this update
    console.log(`Current conversations in storage: ${Array.from(this.conversations.values()).length}`);
    
    return newConversation;
  }
  
  async getMessages(conversationId: number): Promise<Message[]> {
    console.log(`getMessages called for conversation ${conversationId}`);
    
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      console.log(`No conversation found with ID ${conversationId}, returning empty message array`);
      return [];
    }
    
    const allMessages = Array.from(this.messages.values());
    console.log(`Total messages in storage: ${allMessages.length}`);
    
    const conversationMessages = allMessages
      .filter(message => 
        // Find messages that belong to the specific conversation
        // by checking if they involve both users of the conversation
        (
          (message.senderId === conversation.user1Id && message.receiverId === conversation.user2Id) ||
          (message.senderId === conversation.user2Id && message.receiverId === conversation.user1Id)
        )
      )
      .sort((a, b) => new Date(a.createdAt || Date.now()).getTime() - new Date(b.createdAt || Date.now()).getTime());
    
    console.log(`Found ${conversationMessages.length} messages for conversation ${conversationId}`);
    return conversationMessages;
  }
  
  async sendMessage(message: InsertMessage): Promise<Message> {
    console.log(`sendMessage called with data: ${JSON.stringify(message, null, 2)}`);
    
    // Ensure we have a conversation between these users
    const conversation = await this.createOrUpdateConversation(
      message.senderId, 
      message.receiverId
    );
    console.log(`Message will be added to conversation ID ${conversation.id}`);
    
    // Create the message
    const id = this.currentMessageId++;
    const newMessage: Message = {
      id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      read: message.read ?? false,
      createdAt: new Date(),
    };
    
    console.log(`Created new message with ID ${id}: ${JSON.stringify(newMessage, null, 2)}`);
    
    // Update the conversation's last message time and unread count
    const updatedConversation: Conversation = {
      ...conversation,
      lastMessageAt: newMessage.createdAt,
      unreadCount: (conversation.unreadCount || 0) + 1,
    };
    
    this.messages.set(id, newMessage);
    this.conversations.set(conversation.id, updatedConversation);
    
    console.log(`Updated conversation: ${JSON.stringify(updatedConversation, null, 2)}`);
    console.log(`Total messages in storage after adding: ${this.messages.size}`);
    
    return newMessage;
  }
  
  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    console.log(`markMessagesAsRead called for conversation ${conversationId} and user ${userId}`);
    
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      console.log(`No conversation found with ID ${conversationId}, cannot mark messages as read`);
      return;
    }
    
    // Update messages
    const allMessages = Array.from(this.messages.values());
    console.log(`Total messages in storage: ${allMessages.length}`);
    
    const messagesToMark = allMessages.filter(message => 
      // Mark as read if the user is the receiver of the message
      message.receiverId === userId &&
      // and if the message belongs to this conversation
      ((message.senderId === conversation.user1Id && message.receiverId === conversation.user2Id) ||
       (message.senderId === conversation.user2Id && message.receiverId === conversation.user1Id))
    );
    
    console.log(`Found ${messagesToMark.length} messages to mark as read`);
    
    let markedCount = 0;
    messagesToMark.forEach(message => {
      if (!message.read) {
        const updatedMessage: Message = {
          ...message,
          read: true
        };
        this.messages.set(message.id, updatedMessage);
        markedCount++;
      }
    });
    
    console.log(`Marked ${markedCount} messages as read`);
    
    // Reset unread count on the conversation
    const updatedConversation: Conversation = {
      ...conversation,
      unreadCount: 0,
    };
    
    this.conversations.set(conversationId, updatedConversation);
    console.log(`Updated conversation unread count to 0: ${JSON.stringify(updatedConversation, null, 2)}`);
  }
}

export const storage = new MemStorage();