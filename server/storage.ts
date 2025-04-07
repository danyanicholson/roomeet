import { User, Property, InsertUser, InsertProperty, UserProfile, InsertUserProfile } from "@shared/schema";
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
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userProfiles: Map<number, UserProfile>; // Map with profile ID as key
  private userIdToProfileIdMap: Map<number, number>; // Maps user ID to their profile ID
  private properties: Map<number, Property>;
  private currentUserId: number;
  private currentPropertyId: number;
  private currentProfileId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.userProfiles = new Map();
    this.userIdToProfileIdMap = new Map(); // Added this map to track which profile belongs to which user
    this.properties = new Map();
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentProfileId = 1;
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
    const hobbies = insertProfile.hobbies ?? [];
    const interests = insertProfile.interests ?? [];
    const roommateQualities = insertProfile.roommateQualities ?? [];
    
    const profile: UserProfile = {
      id,
      userId,
      fullName: insertProfile.fullName ?? null,
      age: insertProfile.age ?? null,
      occupation: insertProfile.occupation ?? null,
      location: insertProfile.location ?? null, 
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
    const existingProfile = profileId !== undefined ? this.userProfiles.get(profileId) : undefined;

    if (!existingProfile) {
      // If no profile exists, create a new one with the update data
      return this.createUserProfile(userId, updateData as InsertUserProfile);
    }

    // Handle array fields separately to ensure proper typing
    const hobbies = updateData.hobbies !== undefined ? updateData.hobbies : existingProfile.hobbies;
    const interests = updateData.interests !== undefined ? updateData.interests : existingProfile.interests;
    const roommateQualities = updateData.roommateQualities !== undefined ? 
      updateData.roommateQualities : existingProfile.roommateQualities;

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
        (interests || existingProfile.interests) && 
        (hobbies || existingProfile.hobbies)
      ),
    };
    
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
}

export const storage = new MemStorage();