import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { MatchCompatibility } from "./match-compatibility";
import { Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface MatchDetailsDialogProps {
  userProfile: UserProfile;
  matchProfile: UserProfile;
  matchPercentage: number;
}

export function MatchDetailsDialog({ userProfile, matchProfile, matchPercentage }: MatchDetailsDialogProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      console.log("Starting conversation with user ID:", otherUserId);
      const res = await apiRequest("POST", "/api/conversations", { otherUserId });
      console.log("Conversation response:", await res.clone().text());
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Conversation started successfully:", data);
      toast({
        title: "Conversation started",
        description: `You can now message ${matchProfile.fullName}`,
      });
      setLocation("/messaging");
    },
    onError: (error: Error) => {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Function to handle starting a conversation
  const startConversation = (otherUserId: number) => {
    startConversationMutation.mutate(otherUserId);
  };
  
  const formatValue = (key: string, value: string): string => {
    switch (key) {
      case "lifestyle":
        return value === "early-bird" ? "Early Bird" 
          : value === "night-owl" ? "Night Owl" 
          : value === "social" ? "Social" : "Quiet";
      case "cleanliness":
        return value === "very-clean" ? "Very Clean" 
          : value === "clean" ? "Clean" 
          : value === "casual" ? "Casual" : "Messy";
      case "smokingPreference":
        return value === "non-smoker" ? "Non-Smoker" 
          : value === "outside-only" ? "Outside Only" : "Smoker";
      case "petPreference":
        return value === "no-pets" ? "No Pets" 
          : value === "has-pets" ? "Has Pets" : "Pet Friendly";
      default:
        return value;
    }
  };

  // Find common hobbies
  const commonHobbies = userProfile.hobbies?.filter(hobby => 
    matchProfile.hobbies?.some(matchHobby => 
      matchHobby.toLowerCase() === hobby.toLowerCase()
    )
  ) || [];

  // Find common interests
  const commonInterests = userProfile.interests?.filter(interest => 
    matchProfile.interests?.some(matchInterest => 
      matchInterest.toLowerCase() === interest.toLowerCase()
    )
  ) || [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1">
          <Eye className="h-4 w-4 mr-2" /> View Compatibility
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Match with {matchProfile.fullName}
            <Badge 
              variant={matchPercentage >= 75 ? "default" : "secondary"}
              className="ml-2"
            >
              {matchPercentage}% Match
            </Badge>
          </DialogTitle>
          <DialogDescription>
            See a detailed breakdown of your compatibility
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* About User Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">About {matchProfile.fullName}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Age:</span> {matchProfile.age || 'Not specified'}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Occupation:</span> {matchProfile.occupation || 'Not specified'}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Budget:</span> ${matchProfile.budget || 'Not specified'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Current Location:</span> {matchProfile.location || 'Not specified'}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Ideal Location:</span> {matchProfile.idealLocation || 'Not specified'}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lifestyle:</span> {matchProfile.lifestyle ? formatValue("lifestyle", matchProfile.lifestyle) : 'Not specified'}
                </div>
              </div>
            </div>
            {matchProfile.additionalInfo && (
              <div className="mt-2">
                <span className="font-medium text-sm">Additional Info:</span>
                <p className="text-sm mt-1">{matchProfile.additionalInfo}</p>
              </div>
            )}
          </div>

          {/* Match Compatibility Visualization */}
          <div className="bg-muted/50 rounded-lg p-4">
            <MatchCompatibility userProfile={userProfile} otherProfile={matchProfile} />
          </div>

          {/* What You Have in Common */}
          <div>
            <h3 className="text-lg font-medium mb-3">What You Have in Common</h3>
            
            {/* Common Preferences */}
            <div className="space-y-3">
              {userProfile.lifestyle && matchProfile.lifestyle && userProfile.lifestyle === matchProfile.lifestyle && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Lifestyle</Badge>
                  <span>Both {formatValue("lifestyle", userProfile.lifestyle)}</span>
                </div>
              )}
              
              {userProfile.cleanliness && matchProfile.cleanliness && userProfile.cleanliness === matchProfile.cleanliness && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Cleanliness</Badge>
                  <span>Both {formatValue("cleanliness", userProfile.cleanliness)}</span>
                </div>
              )}
              
              {userProfile.smokingPreference && matchProfile.smokingPreference && userProfile.smokingPreference === matchProfile.smokingPreference && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Smoking</Badge>
                  <span>Both {formatValue("smokingPreference", userProfile.smokingPreference)}</span>
                </div>
              )}
              
              {userProfile.petPreference && matchProfile.petPreference && userProfile.petPreference === matchProfile.petPreference && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Pets</Badge>
                  <span>Both {formatValue("petPreference", userProfile.petPreference)}</span>
                </div>
              )}

              {/* Location Matching */}
              {userProfile.location && matchProfile.location && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Location</Badge>
                  <span>
                    {userProfile.location.toLowerCase() === matchProfile.location.toLowerCase()
                      ? "You both currently live in the same area"
                      : userProfile.idealLocation && userProfile.idealLocation.toLowerCase() === matchProfile.location.toLowerCase()
                        ? `${matchProfile.fullName} lives in your ideal location`
                        : matchProfile.idealLocation && matchProfile.idealLocation.toLowerCase() === userProfile.location.toLowerCase()
                          ? `You live in ${matchProfile.fullName}'s ideal location`
                          : "Different locations"}
                  </span>
                </div>
              )}
              
              {/* Budget Similarity */}
              {userProfile.budget && matchProfile.budget && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Budget</Badge>
                  <span>
                    {Math.abs(userProfile.budget - matchProfile.budget) < 200
                      ? "Very similar budget range"
                      : Math.abs(userProfile.budget - matchProfile.budget) < 500
                        ? "Somewhat similar budget range"
                        : "Different budget preferences"}
                  </span>
                </div>
              )}
            </div>

            {/* Common Hobbies & Interests */}
            {commonHobbies.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Shared Hobbies ({commonHobbies.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {commonHobbies.map((hobby, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {commonInterests.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Shared Interests ({commonInterests.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {commonInterests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {commonHobbies.length === 0 && commonInterests.length === 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                You don't have any common hobbies or interests yet. This doesn't mean you won't get along, 
                you might discover shared passions as you get to know each other!
              </div>
            )}
          </div>

          {/* Potential Compatibility Challenges */}
          <div>
            <h3 className="text-lg font-medium mb-3">Potential Differences</h3>
            <div className="space-y-3">
              {userProfile.lifestyle && matchProfile.lifestyle && userProfile.lifestyle !== matchProfile.lifestyle && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-100">Lifestyle</Badge>
                  <span>You're a {formatValue("lifestyle", userProfile.lifestyle)}, they're a {formatValue("lifestyle", matchProfile.lifestyle)}</span>
                </div>
              )}
              
              {userProfile.cleanliness && matchProfile.cleanliness && userProfile.cleanliness !== matchProfile.cleanliness && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-100">Cleanliness</Badge>
                  <span>You prefer {formatValue("cleanliness", userProfile.cleanliness)}, they prefer {formatValue("cleanliness", matchProfile.cleanliness)}</span>
                </div>
              )}
              
              {userProfile.smokingPreference && matchProfile.smokingPreference && userProfile.smokingPreference !== matchProfile.smokingPreference && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-100">Smoking</Badge>
                  <span>You're a {formatValue("smokingPreference", userProfile.smokingPreference)}, they're a {formatValue("smokingPreference", matchProfile.smokingPreference)}</span>
                </div>
              )}
              
              {userProfile.petPreference && matchProfile.petPreference && userProfile.petPreference !== matchProfile.petPreference && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-100">Pets</Badge>
                  <span>You prefer {formatValue("petPreference", userProfile.petPreference)}, they prefer {formatValue("petPreference", matchProfile.petPreference)}</span>
                </div>
              )}
              
              {userProfile.location && matchProfile.location && userProfile.location.toLowerCase() !== matchProfile.location.toLowerCase() && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-100">Location</Badge>
                  <span>You live in {userProfile.location}, they live in {matchProfile.location}</span>
                </div>
              )}

              {/* If no differences were found */}
              {((!userProfile.lifestyle || !matchProfile.lifestyle || userProfile.lifestyle === matchProfile.lifestyle) &&
                (!userProfile.cleanliness || !matchProfile.cleanliness || userProfile.cleanliness === matchProfile.cleanliness) &&
                (!userProfile.smokingPreference || !matchProfile.smokingPreference || userProfile.smokingPreference === matchProfile.smokingPreference) &&
                (!userProfile.petPreference || !matchProfile.petPreference || userProfile.petPreference === matchProfile.petPreference) &&
                (!userProfile.location || !matchProfile.location || userProfile.location.toLowerCase() === matchProfile.location.toLowerCase())) && (
                <div className="text-sm text-muted-foreground">
                  Based on available information, you don't have any major lifestyle differences!
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-3">Next Steps</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Interested in connecting with {matchProfile.fullName}? Send them a message to start a conversation.
            </p>
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => {
                  if (matchProfile && matchProfile.userId) {
                    startConversation(matchProfile.userId);
                  }
                }}
              >
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}