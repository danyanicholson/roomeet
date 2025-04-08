import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@shared/schema";
import { Loader2, UserRound, MapPin, Banknote, Heart, Filter } from "lucide-react";
import { Link } from "wouter";
import { MatchDetailsDialog } from "@/components/match-details-dialog";
import { MatchGauge } from "@/components/match-gauge";
import { useState } from "react";

// Define Match type with calculated percentage
interface MatchWithPercentage extends UserProfile {
  calculatedMatchPercentage: number;
}

// Helper to calculate match percentage based on common interests, hobbies, etc.
function calculateMatchPercentage(userProfile: UserProfile | null, otherProfile: UserProfile): number {
  if (!userProfile) return 0;

  let points = 0;
  let maxPoints = 0;

  // Match on lifestyle
  if (userProfile.lifestyle && otherProfile.lifestyle) {
    maxPoints += 20;
    if (userProfile.lifestyle === otherProfile.lifestyle) {
      points += 20;
    }
  }

  // Match on cleanliness
  if (userProfile.cleanliness && otherProfile.cleanliness) {
    maxPoints += 15;
    if (userProfile.cleanliness === otherProfile.cleanliness) {
      points += 15;
    }
  }

  // Match on smoking preference
  if (userProfile.smokingPreference && otherProfile.smokingPreference) {
    maxPoints += 15;
    if (userProfile.smokingPreference === otherProfile.smokingPreference) {
      points += 15;
    }
  }

  // Match on pet preference
  if (userProfile.petPreference && otherProfile.petPreference) {
    maxPoints += 10;
    if (userProfile.petPreference === otherProfile.petPreference) {
      points += 10;
    }
  }

  // Match on common hobbies
  if (userProfile.hobbies && otherProfile.hobbies) {
    const userHobbies = userProfile.hobbies;
    const otherHobbies = otherProfile.hobbies;
    
    maxPoints += 20;
    
    // Calculate intersection
    const commonHobbies = userHobbies.filter(hobby => 
      otherHobbies.some(otherHobby => 
        otherHobby.toLowerCase() === hobby.toLowerCase()
      )
    );
    
    // Award points based on percentage of common hobbies
    const hobbyMatchPercentage = commonHobbies.length / Math.max(userHobbies.length, 1);
    points += hobbyMatchPercentage * 20;
  }

  // Match on common interests
  if (userProfile.interests && otherProfile.interests) {
    const userInterests = userProfile.interests;
    const otherInterests = otherProfile.interests;
    
    maxPoints += 20;
    
    // Calculate intersection
    const commonInterests = userInterests.filter(interest => 
      otherInterests.some(otherInterest => 
        otherInterest.toLowerCase() === interest.toLowerCase()
      )
    );
    
    // Award points based on percentage of common interests
    const interestMatchPercentage = commonInterests.length / Math.max(userInterests.length, 1);
    points += interestMatchPercentage * 20;
  }

  // Ensure maxPoints is at least 1 to avoid division by zero
  maxPoints = Math.max(maxPoints, 1);
  
  // Calculate and return match percentage
  return Math.round((points / maxPoints) * 100);
}

export default function MatchesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [minMatchPercentage, setMinMatchPercentage] = useState<number>(0);
  const [filterByLifestyle, setFilterByLifestyle] = useState<string | null>(null);
  const [filterByCleanliness, setFilterByCleanliness] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"match" | "budget">("match");
  
  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      console.log("Starting conversation with user ID:", otherUserId);
      const res = await apiRequest("POST", "/api/conversations", { otherUserId });
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Conversation started successfully:", data);
      toast({
        title: "Conversation started",
        description: `You can now message your new match`,
      });
      // Navigate to messaging page
      setLocation("/messaging");
    },
    onError: (error: Error) => {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error starting conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch current user's profile
  const { data: userProfile, isLoading: isLoadingUserProfile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async ({ signal }) => {
      try {
        const res = await fetch("/api/profile", { signal });
        if (!res.ok) return null;
        return await res.json();
      } catch (error) {
        return null;
      }
    },
  });

  // Fetch potential matches
  const { data: matches, isLoading: isLoadingMatches } = useQuery({
    queryKey: ["/api/profiles"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/profiles", { signal });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!userProfile, // Only fetch matches if user profile exists
  });

  if (isLoadingUserProfile || isLoadingMatches) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              You need to create a profile to see potential roommate matches
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/profile">
              <Button className="w-full">Create Profile</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Filter and sort matches
  const filteredAndSortedMatches = [...(matches || [])]
    // First calculate match percentages for each
    .map(match => ({
      ...match,
      calculatedMatchPercentage: calculateMatchPercentage(userProfile, match)
    }))
    // Apply filters
    .filter(match => match.calculatedMatchPercentage >= minMatchPercentage)
    .filter(match => !filterByLifestyle || match.lifestyle === filterByLifestyle)
    .filter(match => !filterByCleanliness || match.cleanliness === filterByCleanliness)
    // Sort by selected criteria
    .sort((a, b) => {
      if (sortOrder === "match") {
        return b.calculatedMatchPercentage - a.calculatedMatchPercentage;
      } else {
        // Sort by budget (lowest first)
        const budgetA = a.budget || 0;
        const budgetB = b.budget || 0;
        return budgetA - budgetB;
      }
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Your Roommate Matches</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Based on your profile information, we've found these potential roommates that might be compatible with you
        </p>
      </div>
      
      {/* Filter Controls */}
      <div className="bg-muted/30 rounded-lg p-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter Results
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setMinMatchPercentage(0);
              setFilterByLifestyle(null);
              setFilterByCleanliness(null);
              setSortOrder("match");
            }}
          >
            Reset All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Min Match Percentage */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Min Match Percentage</label>
              <span className="text-sm">{minMatchPercentage}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="90" 
              step="10"
              value={minMatchPercentage}
              onChange={e => setMinMatchPercentage(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* Lifestyle Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Lifestyle</label>
            <select 
              value={filterByLifestyle || ""}
              onChange={e => setFilterByLifestyle(e.target.value || null)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Any Lifestyle</option>
              <option value="early-bird">Early Bird</option>
              <option value="night-owl">Night Owl</option>
              <option value="social">Social</option>
              <option value="quiet">Quiet</option>
            </select>
          </div>
          
          {/* Cleanliness Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cleanliness</label>
            <select 
              value={filterByCleanliness || ""}
              onChange={e => setFilterByCleanliness(e.target.value || null)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Any Cleanliness</option>
              <option value="very-clean">Very Clean</option>
              <option value="clean">Clean</option>
              <option value="casual">Casual</option>
              <option value="messy">Messy</option>
            </select>
          </div>
          
          {/* Sort Order */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <select 
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as "match" | "budget")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="match">Match Percentage</option>
              <option value="budget">Budget (Low to High)</option>
            </select>
          </div>
        </div>
        
        {/* Results summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredAndSortedMatches.length} of {matches?.length || 0} potential roommates
        </div>
      </div>

      {filteredAndSortedMatches.length === 0 ? (
        <div className="text-center py-12">
          <UserRound className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Matches Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {matches && matches.length > 0 
              ? "Try adjusting your filter settings to see more potential matches."
              : "We couldn't find any potential roommates yet. Check back later as more people join the platform."}
          </p>
          {matches && matches.length === 0 ? (
            <Link href="/profile">
              <Button variant="outline">Update Your Profile</Button>
            </Link>
          ) : (
            <Button variant="outline" onClick={() => {
              setMinMatchPercentage(0);
              setFilterByLifestyle(null);
              setFilterByCleanliness(null);
            }}>
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedMatches.map((match) => (
            <Card key={match.id} className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <CardTitle className="text-xl">{match.fullName}</CardTitle>
                    {match.occupation && (
                      <CardDescription>{match.occupation}</CardDescription>
                    )}
                  </div>
                  <MatchGauge 
                    percentage={match.calculatedMatchPercentage} 
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-2">
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      {match.age && <div className="text-sm">Age: {match.age}</div>}
                      
                      {match.location && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          {match.location}
                        </div>
                      )}
                      
                      {match.budget && (
                        <div className="flex items-center text-sm">
                          <Banknote className="h-4 w-4 mr-1 text-muted-foreground" />
                          Budget: ${match.budget}/month
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {match.lifestyle && (
                      <div className={filterByLifestyle === match.lifestyle ? "font-medium" : ""}>
                        <span className="text-muted-foreground">Lifestyle:</span>{" "}
                        {match.lifestyle === "early-bird" ? "Early Bird" : 
                         match.lifestyle === "night-owl" ? "Night Owl" : 
                         match.lifestyle === "social" ? "Social" : "Quiet"}
                      </div>
                    )}
                    
                    {match.cleanliness && (
                      <div className={filterByCleanliness === match.cleanliness ? "font-medium" : ""}>
                        <span className="text-muted-foreground">Cleanliness:</span>{" "}
                        {match.cleanliness === "very-clean" ? "Very Clean" : 
                         match.cleanliness === "clean" ? "Clean" : 
                         match.cleanliness === "casual" ? "Casual" : "Messy"}
                      </div>
                    )}
                    
                    {match.smokingPreference && (
                      <div>
                        <span className="text-muted-foreground">Smoking:</span>{" "}
                        {match.smokingPreference === "non-smoker" ? "Non-Smoker" : 
                         match.smokingPreference === "outside-only" ? "Outside Only" : "Smoker"}
                      </div>
                    )}
                    
                    {match.petPreference && (
                      <div>
                        <span className="text-muted-foreground">Pets:</span>{" "}
                        {match.petPreference === "no-pets" ? "No Pets" : 
                         match.petPreference === "has-pets" ? "Has Pets" : "Pet Friendly"}
                      </div>
                    )}
                  </div>

                  {/* Hobbies and Interests */}
                  <div className="grid grid-cols-2 gap-4">
                    {match.hobbies && match.hobbies.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">Hobbies</div>
                        <div className="flex flex-wrap gap-1">
                          {match.hobbies.slice(0, 3).map((hobby: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {hobby}
                            </Badge>
                          ))}
                          {match.hobbies.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.hobbies.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {match.interests && match.interests.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">Interests</div>
                        <div className="flex flex-wrap gap-1">
                          {match.interests.slice(0, 3).map((interest: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {match.interests.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.interests.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Info */}
                  {match.additionalInfo && (
                    <div>
                      <div className="text-sm font-medium mb-1">About</div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {match.additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <MatchDetailsDialog 
                  userProfile={userProfile}
                  matchProfile={match}
                  matchPercentage={match.calculatedMatchPercentage}
                />
                <Button 
                  className="flex-1"
                  onClick={() => {
                    console.log(`Connecting with user ID: ${match.userId}`);
                    startConversationMutation.mutate(match.userId);
                  }}
                  disabled={startConversationMutation.isPending}
                >
                  {startConversationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Heart className="h-4 w-4 mr-2" />
                  )}
                  {startConversationMutation.isPending ? "Connecting..." : "Connect"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}