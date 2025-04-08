import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Conversation, Message, UserProfile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft, Send, User } from "lucide-react";

// Types for enhanced conversation with user data
interface EnhancedConversation extends Conversation {
  otherUser: {
    id: number;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export default function MessagingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedConversation, setSelectedConversation] = useState<EnhancedConversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  
  // Fetch conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery<EnhancedConversation[]>({
    queryKey: ["/api/conversations"],
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000, // Poll for new conversations every 10 seconds
    retry: 3, // Retry 3 times if the query fails
    retryDelay: 1000, // Wait 1 second between retries
  });
  
  // Fetch messages for selected conversation
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation,
    staleTime: 5000, // 5 seconds
    refetchInterval: 5000, // Poll for new messages every 5 seconds
    retry: 3, // Retry 3 times if the query fails
    retryDelay: 1000, // Wait 1 second between retries
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      
      console.log("Sending message to user ID:", selectedConversation.otherUser.id);
      console.log("Message content:", content);
      
      const message = {
        content,
        receiverId: selectedConversation.otherUser.id,
      };
      
      const res = await apiRequest("POST", "/api/messages", message);
      
      try {
        const clone = res.clone();
        const textResponse = await clone.text();
        console.log("Send message response text:", textResponse);
        
        // Try to parse the response as JSON
        const jsonData = JSON.parse(textResponse);
        console.log("Parsed message data:", jsonData);
        return jsonData;
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        // Fall back to the original response
        return await res.json();
      }
    },
    onSuccess: (data) => {
      console.log("Message sent successfully:", data);
      // Clear input and refresh messages
      setMessageInput("");
      
      // Force an immediate refetch of messages
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations"],
        refetchType: 'active', 
      });
      
      // Add a small delay and trigger another refetch to ensure messages update
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
          refetchType: 'all',
        });
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Start new conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      const res = await apiRequest("POST", "/api/conversations", { otherUserId });
      return await res.json();
    },
    onSuccess: (newConversation: EnhancedConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversation(newConversation);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Fetch all user profiles for potential new conversations
  const { data: userProfiles } = useQuery<UserProfile[]>({
    queryKey: ["/api/profiles"],
  });
  
  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    
    sendMessageMutation.mutate(messageInput.trim());
  };
  
  // Get the display name for the conversation
  const getDisplayName = (conversation: EnhancedConversation) => {
    return conversation.otherUser.fullName || conversation.otherUser.username;
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format message timestamp
  const formatMessageTime = (timestamp: Date | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Back to conversation list (mobile)
  const handleBackToList = () => {
    setSelectedConversation(null);
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - Conversation list */}
        {(!isMobile || !selectedConversation) && (
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <CardDescription>Chat with potential roommates</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingConversations ? (
                  <div className="flex justify-center py-4">Loading conversations...</div>
                ) : conversations && conversations.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {conversations.map(conversation => (
                        <div
                          key={conversation.id}
                          className={`p-3 rounded-md cursor-pointer flex items-center space-x-3 hover:bg-accent ${
                            selectedConversation?.id === conversation.id ? "bg-accent" : ""
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <Avatar>
                            <AvatarImage src={conversation.otherUser.avatarUrl || undefined} />
                            <AvatarFallback>
                              {getInitials(getDisplayName(conversation))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{getDisplayName(conversation)}</p>
                            {conversation.unreadCount ? (
                              <div className="flex items-center">
                                <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                                <p className="text-sm text-muted-foreground">
                                  {conversation.unreadCount} new {conversation.unreadCount === 1 ? "message" : "messages"}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground truncate">
                                {formatMessageTime(conversation.lastMessageAt as unknown as Date)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">No conversations yet</p>
                    <p className="text-sm mb-4">Start a conversation with a potential roommate from your matches!</p>
                  </div>
                )}
                
                {/* New conversation section */}
                {userProfiles && userProfiles.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium mb-3">Start a new conversation</h3>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {userProfiles.map(profile => {
                          // Check if we already have a conversation with this user
                          const hasConversation = conversations?.some(
                            c => c.user1Id === profile.userId || c.user2Id === profile.userId
                          );
                          
                          if (hasConversation) return null;
                          
                          return (
                            <div
                              key={profile.userId}
                              className="p-3 rounded-md flex items-center space-x-3 hover:bg-accent cursor-pointer"
                              onClick={() => startConversationMutation.mutate(profile.userId)}
                            >
                              <Avatar>
                                <AvatarFallback>
                                  {getInitials(profile.fullName || 'User')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{profile.fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {profile.location || "No location"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Right side - Messages */}
        {(!isMobile || selectedConversation) && (
          <div className="md:col-span-2">
            <Card className="h-full flex flex-col">
              {selectedConversation ? (
                <>
                  <CardHeader className="flex-none border-b">
                    <div className="flex items-center">
                      {isMobile && (
                        <Button variant="ghost" size="icon" onClick={handleBackToList} className="mr-2">
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                      )}
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={selectedConversation.otherUser.avatarUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(getDisplayName(selectedConversation))}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{getDisplayName(selectedConversation)}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 p-0 flex flex-col h-[500px]">
                    {/* Messages area */}
                    <ScrollArea className="flex-1 p-4">
                      {isLoadingMessages ? (
                        <div className="flex justify-center py-4">Loading messages...</div>
                      ) : messages && messages.length > 0 ? (
                        <div className="space-y-4">
                          {messages.map(message => {
                            const isCurrentUser = message.senderId === user?.id;
                            
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                    isCurrentUser 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-muted"
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p className="text-xs mt-1 opacity-70">
                                    {formatMessageTime(message.createdAt as unknown as Date)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <User className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No messages yet</p>
                            <p className="text-sm mt-1">Start the conversation!</p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                    
                    {/* Message input */}
                    <div className="p-4 border-t">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={messageInput}
                          onChange={e => setMessageInput(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          type="submit" 
                          disabled={!messageInput.trim() || sendMessageMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-[500px]">
                  <div className="text-center">
                    <User className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
                    <p className="text-muted-foreground">
                      Select a conversation from the list or start a new one
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}