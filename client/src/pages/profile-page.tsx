import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserProfileSchema, type InsertUserProfile } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Predefined options for selection
const HOBBY_OPTIONS = [
  "Reading", "Gaming", "Cooking", "Baking", "Hiking", "Biking", 
  "Photography", "Painting", "Drawing", "Playing Music", "Dancing",
  "Yoga", "Meditation", "Gardening", "DIY Projects", "Watching Movies",
  "Sports", "Traveling", "Writing", "Woodworking", "Knitting"
];

const INTEREST_OPTIONS = [
  "Technology", "Science", "History", "Politics", "Philosophy",
  "Art", "Music", "Film", "Literature", "Theater", "Fashion",
  "Food & Drink", "Health & Fitness", "Environment", "Animals",
  "Education", "Business", "Economics", "Psychology", "Sociology"
];

const ROOMMATE_QUALITY_OPTIONS = [
  "Respectful", "Clean", "Organized", "Communicative", "Considerate",
  "Reliable", "Responsible", "Trustworthy", "Easygoing", "Quiet",
  "Fun", "Social", "Friendly", "Financially stable", "Mature",
  "Non-judgmental", "Adaptable", "Open-minded", "Supportive", "Independent"
];

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showHobbySelect, setShowHobbySelect] = useState(false);
  const [showInterestSelect, setShowInterestSelect] = useState(false);
  const [showQualitySelect, setShowQualitySelect] = useState(false);

  // Fetch existing profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async ({ signal }) => {
      try {
        const res = await fetch("/api/profile", { signal });
        if (res.status === 404) {
          return null; // No profile yet, return null for new profile creation
        }
        return await res.json();
      } catch (error) {
        return null; // Handle error, return null for new profile
      }
    },
  });

  // Set up form with Zod validation
  const form = useForm<InsertUserProfile>({
    resolver: zodResolver(insertUserProfileSchema),
    defaultValues: {
      fullName: "",
      age: undefined,
      occupation: "",
      location: "",
      idealLocation: "",
      budget: undefined,
      hobbies: [],
      interests: [],
      lifestyle: undefined,
      cleanliness: undefined,
      smokingPreference: undefined,
      petPreference: undefined,
      roommateQualities: [],
      additionalInfo: "",
    },
  });

  // Update form values when profile data is loaded or user changes
  useEffect(() => {
    if (profile) {
      // Reset form with fetched profile data
      form.reset({
        fullName: profile.fullName ?? "",
        age: profile.age ?? undefined,
        occupation: profile.occupation ?? "",
        location: profile.location ?? "",
        idealLocation: profile.idealLocation ?? "",
        budget: profile.budget ?? undefined,
        hobbies: profile.hobbies ?? [],
        interests: profile.interests ?? [],
        lifestyle: profile.lifestyle ?? undefined,
        cleanliness: profile.cleanliness ?? undefined, 
        smokingPreference: profile.smokingPreference ?? undefined,
        petPreference: profile.petPreference ?? undefined,
        roommateQualities: profile.roommateQualities ?? [],
        additionalInfo: profile.additionalInfo ?? "",
      });
    } else {
      // Reset form to empty values if no profile exists
      form.reset({
        fullName: "",
        age: undefined,
        occupation: "",
        location: "",
        idealLocation: "",
        budget: undefined,
        hobbies: [],
        interests: [],
        lifestyle: undefined,
        cleanliness: undefined,
        smokingPreference: undefined,
        petPreference: undefined,
        roommateQualities: [],
        additionalInfo: "",
      });
    }
  }, [profile, form, user?.id]); // Add user.id to dependencies to re-run when user changes

  // Watch arrays for updating UI
  const hobbies = form.watch("hobbies") || [];
  const interests = form.watch("interests") || [];
  const roommateQualities = form.watch("roommateQualities") || [];

  // Add/remove functions for array fields
  const addHobby = (hobby: string) => {
    if (!hobby) return;
    if (hobbies.includes(hobby)) return; // Prevent duplicates
    const currentHobbies = [...hobbies];
    currentHobbies.push(hobby);
    form.setValue("hobbies", currentHobbies);
    setShowHobbySelect(false);
  };

  const removeHobby = (index: number) => {
    const currentHobbies = [...hobbies];
    currentHobbies.splice(index, 1);
    form.setValue("hobbies", currentHobbies);
  };

  const addInterest = (interest: string) => {
    if (!interest) return;
    if (interests.includes(interest)) return; // Prevent duplicates
    const currentInterests = [...interests];
    currentInterests.push(interest);
    form.setValue("interests", currentInterests);
    setShowInterestSelect(false);
  };

  const removeInterest = (index: number) => {
    const currentInterests = [...interests];
    currentInterests.splice(index, 1);
    form.setValue("interests", currentInterests);
  };

  const addQuality = (quality: string) => {
    if (!quality) return;
    if (roommateQualities.includes(quality)) return; // Prevent duplicates
    const currentQualities = [...roommateQualities];
    currentQualities.push(quality);
    form.setValue("roommateQualities", currentQualities);
    setShowQualitySelect(false);
  };

  const removeQuality = (index: number) => {
    const currentQualities = [...roommateQualities];
    currentQualities.splice(index, 1);
    form.setValue("roommateQualities", currentQualities);
  };

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: InsertUserProfile) => {
      const res = await apiRequest("POST", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Your profile has been saved successfully",
      });
      setLocation("/matches");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Your Roommate Profile</CardTitle>
          <CardDescription>
            Fill out your profile to help us match you with compatible roommates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit((data) => saveProfileMutation.mutate(data))} 
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information Section */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occupation</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Location</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="City, State" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="idealLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ideal Location</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="City, State" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Budget ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-medium">Lifestyle & Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lifestyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lifestyle</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your lifestyle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="early-bird">Early Bird</SelectItem>
                              <SelectItem value="night-owl">Night Owl</SelectItem>
                              <SelectItem value="social">Social</SelectItem>
                              <SelectItem value="quiet">Quiet/Reserved</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cleanliness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cleanliness</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cleanliness level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="very-clean">Very Clean</SelectItem>
                              <SelectItem value="clean">Clean</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="messy">Messy</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="smokingPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Smoking Preference</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select smoking preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="non-smoker">Non-Smoker</SelectItem>
                              <SelectItem value="outside-only">Outside Only</SelectItem>
                              <SelectItem value="smoker">Smoker</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="petPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pet Preference</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select pet preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="no-pets">No Pets</SelectItem>
                              <SelectItem value="has-pets">Has Pets</SelectItem>
                              <SelectItem value="pet-friendly">Pet Friendly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Hobbies Section */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-medium">Hobbies & Interests</h3>

                  <FormField
                    control={form.control}
                    name="hobbies"
                    render={() => (
                      <FormItem>
                        <FormLabel>Hobbies</FormLabel>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowHobbySelect(!showHobbySelect)}
                            className="flex gap-2 items-center"
                          >
                            <Plus className="h-4 w-4" />
                            Add Hobby
                          </Button>
                        </div>
                        
                        {showHobbySelect && (
                          <div className="border rounded-md p-3 mt-2 bg-card">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {HOBBY_OPTIONS
                                .filter(hobby => !hobbies.includes(hobby))
                                .map(hobby => (
                                <Button
                                  key={hobby}
                                  type="button"
                                  variant="ghost"
                                  className="justify-start h-auto py-1.5 text-sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    addHobby(hobby);
                                  }}
                                >
                                  {hobby}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {hobbies.map((hobby, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {hobby}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeHobby(index)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interests"
                    render={() => (
                      <FormItem>
                        <FormLabel>Interests</FormLabel>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowInterestSelect(!showInterestSelect)}
                            className="flex gap-2 items-center"
                          >
                            <Plus className="h-4 w-4" />
                            Add Interest
                          </Button>
                        </div>
                        
                        {showInterestSelect && (
                          <div className="border rounded-md p-3 mt-2 bg-card">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {INTEREST_OPTIONS
                                .filter(interest => !interests.includes(interest))
                                .map(interest => (
                                <Button
                                  key={interest}
                                  type="button"
                                  variant="ghost"
                                  className="justify-start h-auto py-1.5 text-sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    addInterest(interest);
                                  }}
                                >
                                  {interest}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {interests.map((interest, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {interest}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeInterest(index)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Roommate Preferences Section */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-medium">Ideal Roommate</h3>

                  <FormField
                    control={form.control}
                    name="roommateQualities"
                    render={() => (
                      <FormItem>
                        <FormLabel>Desired Roommate Qualities</FormLabel>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowQualitySelect(!showQualitySelect)}
                            className="flex gap-2 items-center"
                          >
                            <Plus className="h-4 w-4" />
                            Add Roommate Quality
                          </Button>
                        </div>
                        
                        {showQualitySelect && (
                          <div className="border rounded-md p-3 mt-2 bg-card">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {ROOMMATE_QUALITY_OPTIONS
                                .filter(quality => !roommateQualities.includes(quality))
                                .map(quality => (
                                <Button
                                  key={quality}
                                  type="button"
                                  variant="ghost"
                                  className="justify-start h-auto py-1.5 text-sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    addQuality(quality);
                                  }}
                                >
                                  {quality}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {roommateQualities.map((quality, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {quality}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeQuality(index)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Information</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Share anything else that potential roommates should know about you"
                            className="h-24"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={saveProfileMutation.isPending}
              >
                {saveProfileMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}