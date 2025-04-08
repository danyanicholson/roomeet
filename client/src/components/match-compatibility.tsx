import { UserProfile } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { ArrowBigDown, ArrowBigUp, ChevronsUpDown, Flame } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MatchCategoryScore {
  category: string;
  score: number;
  maxScore: number;
  tooltip: string;
}

interface MatchCompatibilityProps {
  userProfile: UserProfile;
  otherProfile: UserProfile;
}

export function MatchCompatibility({ userProfile, otherProfile }: MatchCompatibilityProps) {
  // Calculate lifestyle match
  const calculateLifestyleMatch = (): MatchCategoryScore => {
    const score = userProfile.lifestyle && otherProfile.lifestyle && 
                userProfile.lifestyle === otherProfile.lifestyle ? 20 : 0;
    const maxScore = (userProfile.lifestyle && otherProfile.lifestyle) ? 20 : 0;
    
    return {
      category: "Lifestyle Compatibility",
      score,
      maxScore,
      tooltip: userProfile.lifestyle === otherProfile.lifestyle 
        ? "You both have similar lifestyle preferences!" 
        : "Your lifestyles may require some adjustment"
    };
  };

  // Calculate cleanliness match
  const calculateCleanlinessMatch = (): MatchCategoryScore => {
    const score = userProfile.cleanliness && otherProfile.cleanliness && 
                userProfile.cleanliness === otherProfile.cleanliness ? 15 : 0;
    const maxScore = (userProfile.cleanliness && otherProfile.cleanliness) ? 15 : 0;
    
    return {
      category: "Cleanliness Standards",
      score,
      maxScore,
      tooltip: userProfile.cleanliness === otherProfile.cleanliness 
        ? "You share similar cleanliness preferences" 
        : "You may have different cleaning expectations"
    };
  };

  // Calculate smoking preference match
  const calculateSmokingMatch = (): MatchCategoryScore => {
    const score = userProfile.smokingPreference && otherProfile.smokingPreference && 
                userProfile.smokingPreference === otherProfile.smokingPreference ? 15 : 0;
    const maxScore = (userProfile.smokingPreference && otherProfile.smokingPreference) ? 15 : 0;
    
    return {
      category: "Smoking Compatibility",
      score,
      maxScore,
      tooltip: userProfile.smokingPreference === otherProfile.smokingPreference 
        ? "You have compatible smoking preferences" 
        : "You have different smoking preferences"
    };
  };

  // Calculate pet preference match
  const calculatePetMatch = (): MatchCategoryScore => {
    const score = userProfile.petPreference && otherProfile.petPreference && 
                userProfile.petPreference === otherProfile.petPreference ? 10 : 0;
    const maxScore = (userProfile.petPreference && otherProfile.petPreference) ? 10 : 0;
    
    return {
      category: "Pet Compatibility",
      score,
      maxScore,
      tooltip: userProfile.petPreference === otherProfile.petPreference 
        ? "You both have compatible pet preferences" 
        : "You have different views on pets"
    };
  };

  // Calculate hobby match
  const calculateHobbyMatch = (): MatchCategoryScore => {
    if (!userProfile.hobbies || !otherProfile.hobbies || 
        userProfile.hobbies.length === 0 || otherProfile.hobbies.length === 0) {
      return {
        category: "Shared Hobbies",
        score: 0,
        maxScore: 0,
        tooltip: "Not enough data to calculate hobby compatibility"
      };
    }
    
    const userHobbies = userProfile.hobbies;
    const otherHobbies = otherProfile.hobbies;
    
    // Calculate intersection
    const commonHobbies = userHobbies.filter(hobby => 
      otherHobbies.some(otherHobby => 
        otherHobby.toLowerCase() === hobby.toLowerCase()
      )
    );
    
    // Calculate score based on percentage of common hobbies
    const hobbyMatchPercentage = commonHobbies.length / Math.max(userHobbies.length, 1);
    const score = hobbyMatchPercentage * 20;
    
    return {
      category: "Shared Hobbies",
      score,
      maxScore: 20,
      tooltip: commonHobbies.length > 0
        ? `You share ${commonHobbies.length} hobbies including: ${commonHobbies.slice(0, 3).join(", ")}${commonHobbies.length > 3 ? "..." : ""}`
        : "You don't share any hobbies in common"
    };
  };

  // Calculate interest match
  const calculateInterestMatch = (): MatchCategoryScore => {
    if (!userProfile.interests || !otherProfile.interests || 
        userProfile.interests.length === 0 || otherProfile.interests.length === 0) {
      return {
        category: "Shared Interests",
        score: 0,
        maxScore: 0,
        tooltip: "Not enough data to calculate interest compatibility"
      };
    }
    
    const userInterests = userProfile.interests;
    const otherInterests = otherProfile.interests;
    
    // Calculate intersection
    const commonInterests = userInterests.filter(interest => 
      otherInterests.some(otherInterest => 
        otherInterest.toLowerCase() === interest.toLowerCase()
      )
    );
    
    // Calculate score based on percentage of common interests
    const interestMatchPercentage = commonInterests.length / Math.max(userInterests.length, 1);
    const score = interestMatchPercentage * 20;
    
    return {
      category: "Shared Interests",
      score,
      maxScore: 20,
      tooltip: commonInterests.length > 0
        ? `You share ${commonInterests.length} interests including: ${commonInterests.slice(0, 3).join(", ")}${commonInterests.length > 3 ? "..." : ""}`
        : "You don't share any interests in common"
    };
  };

  // Calculate roommate quality match - if this person has qualities you're looking for
  const calculateRoommateQualityMatch = (): MatchCategoryScore => {
    if (!userProfile.roommateQualities || userProfile.roommateQualities.length === 0) {
      return {
        category: "Desired Qualities",
        score: 0,
        maxScore: 0,
        tooltip: "You haven't specified roommate qualities you're looking for"
      };
    }
    
    const desiredQualities = userProfile.roommateQualities;
    
    // For now, let's just check if any of the qualities are mentioned in their additional info
    // In a real app, we'd have a more sophisticated matching mechanism
    const additionalInfo = otherProfile.additionalInfo?.toLowerCase() || "";
    
    // Count matches in additionalInfo
    let matchedQualities = 0;
    desiredQualities.forEach(quality => {
      if (additionalInfo.includes(quality.toLowerCase())) {
        matchedQualities++;
      }
    });
    
    // Calculate score (max 10 points)
    const score = Math.min(10, (matchedQualities / desiredQualities.length) * 10);
    
    return {
      category: "Desired Qualities",
      score,
      maxScore: 10,
      tooltip: matchedQualities > 0
        ? `This person may have ${matchedQualities} qualities you're looking for`
        : "We couldn't determine if this person has qualities you're looking for"
    };
  };

  // Calculate location match
  const calculateLocationMatch = (): MatchCategoryScore => {
    // If either profile lacks location info, we can't calculate a match
    if (!userProfile.location || !otherProfile.location) {
      return {
        category: "Location",
        score: 0,
        maxScore: 0,
        tooltip: "Location information is missing"
      };
    }

    // Check if user's current location matches other's current location
    const currentLocationMatch = userProfile.location.toLowerCase() === otherProfile.location.toLowerCase();
    
    // Check if user's ideal location matches other's current location
    const idealLocationMatch = userProfile.idealLocation && 
      userProfile.idealLocation.toLowerCase() === otherProfile.location.toLowerCase();
      
    // Check if user's current location matches other's ideal location
    const reverseIdealLocationMatch = otherProfile.idealLocation && 
      userProfile.location.toLowerCase() === otherProfile.idealLocation.toLowerCase();
    
    let score = 0;
    let tooltip = "";
    
    // Assign score based on different match types
    if (currentLocationMatch) {
      score = 15;
      tooltip = "You are both currently in the same location!";
    } else if (idealLocationMatch) {
      score = 10;
      tooltip = `${otherProfile.fullName} is already in your ideal location.`;
    } else if (reverseIdealLocationMatch) {
      score = 10;
      tooltip = `You're in ${otherProfile.fullName}'s ideal location.`;
    } else {
      tooltip = "Your locations don't match";
    }
    
    return {
      category: "Location",
      score,
      maxScore: 15,
      tooltip
    };
  };

  // Calculate all matches
  const categories: MatchCategoryScore[] = [
    calculateLifestyleMatch(),
    calculateCleanlinessMatch(),
    calculateSmokingMatch(),
    calculatePetMatch(),
    calculateHobbyMatch(),
    calculateInterestMatch(),
    calculateRoommateQualityMatch(),
    calculateLocationMatch()
  ].filter(category => category.maxScore > 0); // Only include categories with data

  // Calculate overall match percentage
  const totalScore = categories.reduce((sum, category) => sum + category.score, 0);
  const totalMaxScore = categories.reduce((sum, category) => sum + category.maxScore, 0);
  const overallPercentage = totalMaxScore > 0 
    ? Math.round((totalScore / totalMaxScore) * 100) 
    : 0;

  const getMatchIcon = (score: number, maxScore: number) => {
    const percentage = maxScore > 0 ? (score / maxScore) : 0;
    
    if (percentage >= 0.85) return <ArrowBigUp className="h-4 w-4 text-green-500" />;
    if (percentage >= 0.5) return <ChevronsUpDown className="h-4 w-4 text-amber-500" />;
    return <ArrowBigDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Overall Match: {overallPercentage}%</h3>
      </div>
      
      <Progress value={overallPercentage} className="h-2" />
      
      <div className="space-y-3 mt-4">
        {categories.map((category, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      {getMatchIcon(category.score, category.maxScore)}
                      <span>{category.category}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((category.score / category.maxScore) * 100)}%
                    </span>
                  </div>
                  <Progress value={(category.score / category.maxScore) * 100} className="h-1" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{category.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}