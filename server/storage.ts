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
  private userProfiles: Map<number, UserProfile>; // userId -> profile
  private properties: Map<number, Property>;
  private currentUserId: number;
  private currentPropertyId: number;
  private currentProfileId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.userProfiles = new Map();
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
    // Convert to array first to avoid iterator issues
    const profiles = Array.from(this.userProfiles.values());
    return profiles.find(profile => profile.userId === userId);
  }

  async createUserProfile(userId: number, insertProfile: InsertUserProfile): Promise<UserProfile> {
    const id = this.currentProfileId++;
    const profile: UserProfile = {
      id,
      userId,
      fullName: insertProfile.fullName ?? null,
      age: insertProfile.age ?? null,
      occupation: insertProfile.occupation ?? null,
      location: insertProfile.location ?? null, 
      budget: insertProfile.budget ?? null,
      hobbies: insertProfile.hobbies ?? null,
      interests: insertProfile.interests ?? null,
      lifestyle: insertProfile.lifestyle ?? null,
      cleanliness: insertProfile.cleanliness ?? null,
      smokingPreference: insertProfile.smokingPreference ?? null,
      petPreference: insertProfile.petPreference ?? null,
      roommateQualities: insertProfile.roommateQualities ?? null,
      additionalInfo: insertProfile.additionalInfo ?? null,
      profileComplete: insertProfile.fullName !== null && 
                      insertProfile.interests !== null && 
                      insertProfile.hobbies !== null,
    };
    this.userProfiles.set(id, profile);
    return profile;
  }

  async updateUserProfile(userId: number, updateData: Partial<InsertUserProfile>): Promise<UserProfile> {
    let existingProfile: UserProfile | undefined;
    let profileId: number = 0;
    
    // Find the existing profile using Array.from to avoid iterator issues
    const profiles = Array.from(this.userProfiles.entries());
    const foundProfile = profiles.find(([, profile]) => profile.userId === userId);
    
    if (foundProfile) {
      [profileId, existingProfile] = foundProfile;
    }

    if (!existingProfile) {
      // If no profile exists, create a new one with the update data
      return this.createUserProfile(userId, updateData as InsertUserProfile);
    }

    // Update the existing profile
    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...updateData,
      profileComplete: Boolean(
        (updateData.fullName || existingProfile.fullName) && 
        (updateData.interests || existingProfile.interests) && 
        (updateData.hobbies || existingProfile.hobbies)
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
    const property: Property = {
      id,
      userId,
      title: insertProperty.title,
      description: insertProperty.description,
      price: insertProperty.price,
      location: insertProperty.location,
      roomType: insertProperty.roomType,
      imageUrls: insertProperty.imageUrls ?? null,
      amenities: insertProperty.amenities ?? null,
      available: insertProperty.available ?? true,
    };
    this.properties.set(id, property);
    return property;
  }
}

export const storage = new MemStorage();