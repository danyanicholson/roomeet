import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fullName: text("full_name"),
  age: integer("age"),
  occupation: text("occupation"),
  location: text("location"),
  budget: integer("budget"),
  hobbies: text("hobbies").array(),
  interests: text("interests").array(),
  lifestyle: text("lifestyle"), // e.g., "early-bird", "night-owl", "social", "quiet"
  cleanliness: text("cleanliness"), // e.g., "very-clean", "clean", "casual", "messy"
  smokingPreference: text("smoking_preference"), // e.g., "non-smoker", "outside-only", "smoker"
  petPreference: text("pet_preference"), // e.g., "no-pets", "has-pets", "pet-friendly"
  roommateQualities: text("roommate_qualities").array(), // desired roommate qualities
  additionalInfo: text("additional_info"),
  profileComplete: boolean("profile_complete").default(false),
});

// Only keeping this for reference, we won't use it in the new approach
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  location: text("location").notNull(),
  imageUrls: text("image_urls").array(),
  roomType: text("room_type").notNull(),
  amenities: text("amenities").array(),
  available: boolean("available").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  avatarUrl: true,
  bio: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  userId: true,
  profileComplete: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
