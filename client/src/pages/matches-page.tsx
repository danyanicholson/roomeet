import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@shared/schema";
import { Loader2, UserRound, MapPin, Banknote, Heart } from "lucide-react";
import { Link } from "wouter";

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

  // Sort matches by match percentage in descending order
  const sortedMatches = [...(matches || [])].sort((a, b) => {
    const matchA = calculateMatchPercentage(userProfile, a);
    const matchB = calculateMatchPercentage(userProfile, b);
    return matchB - matchA;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Your Roommate Matches</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Based on your profile information, we've found these potential roommates that might be compatible with you
        </p>
      </div>

      {sortedMatches.length === 0 ? (
        <div className="text-center py-12">
          <UserRound className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Matches Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            We couldn't find any potential roommates yet. Check back later as more people join the platform.
          </p>
          <Link href="/profile">
            <Button variant="outline">Update Your Profile</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMatches.map((match) => {
            const matchPercentage = calculateMatchPercentage(userProfile, match);
            
            return (
              <Card key={match.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{match.fullName}</CardTitle>
                      {match.occupation && (
                        <CardDescription>{match.occupation}</CardDescription>
                      )}
                    </div>
                    <Badge 
                      variant={matchPercentage >= 75 ? "default" : "secondary"}
                      className="text-sm"
                    >
                      {matchPercentage}% Match
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    {/* Basic Info */}
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

                    {/* Preferences */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {match.lifestyle && (
                        <div>
                          <span className="text-muted-foreground">Lifestyle:</span>{" "}
                          {match.lifestyle === "early-bird" ? "Early Bird" : 
                           match.lifestyle === "night-owl" ? "Night Owl" : 
                           match.lifestyle === "social" ? "Social" : "Quiet"}
                        </div>
                      )}
                      
                      {match.cleanliness && (
                        <div>
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
                    {match.hobbies && match.hobbies.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">Hobbies</div>
                        <div className="flex flex-wrap gap-1">
                          {match.hobbies.slice(0, 5).map((hobby: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {hobby}
                            </Badge>
                          ))}
                          {match.hobbies.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.hobbies.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {match.interests && match.interests.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">Interests</div>
                        <div className="flex flex-wrap gap-1">
                          {match.interests.slice(0, 5).map((interest: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {match.interests.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.interests.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    {match.additionalInfo && (
                      <div>
                        <div className="text-sm font-medium mb-1">About</div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {match.additionalInfo}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button className="flex-1" variant="outline">
                    View Profile
                  </Button>
                  <Button className="flex-1">
                    <Heart className="h-4 w-4 mr-2" /> Connect
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}