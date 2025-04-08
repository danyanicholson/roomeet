import { Link, useLocation } from "wouter";
import { Button } from "./button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "./dropdown-menu";
import { UserRound, Users, MessageSquare } from "lucide-react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="link" className="text-xl font-bold p-0 mr-6">RoommateFinder</Button>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/matches">
              <Button 
                variant={location === "/matches" || location === "/" ? "default" : "ghost"}
                size="sm"
                className="flex gap-1 items-center"
              >
                <Users className="h-4 w-4" />
                <span>Matches</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button 
                variant={location === "/profile" ? "default" : "ghost"}
                size="sm"
                className="flex gap-1 items-center"
              >
                <UserRound className="h-4 w-4" />
                <span>Profile</span>
              </Button>
            </Link>
            <Link href="/messaging">
              <Button 
                variant={location === "/messaging" ? "default" : "ghost"}
                size="sm"
                className="flex gap-1 items-center"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Messages</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-medium">
                {user.username}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <div className="flex items-center cursor-pointer w-full">
                    <UserRound className="w-4 h-4 mr-2" />
                    Profile
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/matches">
                  <div className="flex items-center cursor-pointer w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Matches
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/messaging">
                  <div className="flex items-center cursor-pointer w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Messages
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
