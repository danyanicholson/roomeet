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
    // Get profile ID directly from our mapping
    const profileId = this.userIdToProfileIdMap.get(userId);
    
    // If we don't have a profile ID for this user yet, create a new profile instead
    if (profileId === undefined) {
      return this.createUserProfile(userId, updateData as InsertUserProfile);
    }
    
    const existingProfile = this.userProfiles.get(profileId);
    
    // Double-check that we have an existing profile
    if (!existingProfile) {
      // If somehow we have a profile ID but no profile, create a new one with the update data
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
    // Make sure we have a consistent order for user IDs to avoid duplicate conversations
    const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    
    // Find a conversation with these two users
    const conversation = Array.from(this.conversations.values()).find(
      conv => (conv.user1Id === smallerId && conv.user2Id === largerId)
    );
    
    return conversation;
  }
  
  async getConversationById(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async getUserConversations(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      conv => conv.user1Id === userId || conv.user2Id === userId
    );
  }
  
  async createOrUpdateConversation(user1Id: number, user2Id: number): Promise<Conversation> {
    // Make sure we have a consistent order for user IDs to avoid duplicate conversations
    const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    
    // Check if a conversation already exists
    const existingConversation = await this.getConversation(smallerId, largerId);
    
    if (existingConversation) {
      // Update the last message timestamp
      const updatedConversation: Conversation = {
        ...existingConversation,
        lastMessageAt: new Date(),
      };
      this.conversations.set(existingConversation.id, updatedConversation);
      return updatedConversation;
    }
    
    // Create a new conversation
    const id = this.currentConversationId++;
    const newConversation: Conversation = {
      id,
      user1Id: smallerId,
      user2Id: largerId,
      lastMessageAt: new Date(),
      unreadCount: 0,
    };
    
    this.conversations.set(id, newConversation);
    return newConversation;
  }
  
  async getMessages(conversationId: number): Promise<Message[]> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return [];
    
    return Array.from(this.messages.values())
      .filter(message => 
        // Find messages that belong to the specific conversation
        // by checking if they involve both users of the conversation
        (
          (message.senderId === conversation.user1Id && message.receiverId === conversation.user2Id) ||
          (message.senderId === conversation.user2Id && message.receiverId === conversation.user1Id)
        )
      )
      .sort((a, b) => new Date(a.createdAt || Date.now()).getTime() - new Date(b.createdAt || Date.now()).getTime());
  }
  
  async sendMessage(message: InsertMessage): Promise<Message> {
    // Ensure we have a conversation between these users
    const conversation = await this.createOrUpdateConversation(
      message.senderId, 
      message.receiverId
    );
    
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
    
    // Update the conversation's last message time and unread count
    const updatedConversation: Conversation = {
      ...conversation,
      lastMessageAt: newMessage.createdAt,
      unreadCount: (conversation.unreadCount || 0) + 1,
    };
    
    this.messages.set(id, newMessage);
    this.conversations.set(conversation.id, updatedConversation);
    
    return newMessage;
  }
  
  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return;
    
    // Update messages
    Array.from(this.messages.values())
      .filter(message => 
        // Mark as read if the user is the receiver of the message
        message.receiverId === userId &&
        // and if the message belongs to this conversation
        ((message.senderId === conversation.user1Id && message.receiverId === conversation.user2Id) ||
         (message.senderId === conversation.user2Id && message.receiverId === conversation.user1Id))
      )
      .forEach(message => {
        if (!message.read) {
          const updatedMessage: Message = {
            ...message,
            read: true
          };
          this.messages.set(message.id, updatedMessage);
        }
      });
    
    // Reset unread count on the conversation
    const updatedConversation: Conversation = {
      ...conversation,
      unreadCount: 0,
    };
    
    this.conversations.set(conversationId, updatedConversation);
  }
}

export const storage = new MemStorage();