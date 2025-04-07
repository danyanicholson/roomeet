import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type InsertProperty } from "@shared/schema";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
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
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function CreateListing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [amenityInput, setAmenityInput] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      location: "",
      roomType: "private",
      amenities: [],
      imageUrls: [],
      available: true,
    },
  });

  const amenities = form.watch("amenities") || [];
  const imageUrls = form.watch("imageUrls") || [];

  const addAmenity = () => {
    if (amenityInput.trim() === "") return;
    const currentAmenities = [...amenities];
    currentAmenities.push(amenityInput.trim());
    form.setValue("amenities", currentAmenities);
    setAmenityInput("");
  };

  const removeAmenity = (index: number) => {
    const currentAmenities = [...amenities];
    currentAmenities.splice(index, 1);
    form.setValue("amenities", currentAmenities);
  };

  const addImageUrl = () => {
    if (imageUrlInput.trim() === "") return;
    const currentUrls = [...imageUrls];
    currentUrls.push(imageUrlInput.trim());
    form.setValue("imageUrls", currentUrls);
    setImageUrlInput("");
  };

  const removeImageUrl = (index: number) => {
    const currentUrls = [...imageUrls];
    currentUrls.splice(index, 1);
    form.setValue("imageUrls", currentUrls);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertProperty) => {
      const res = await apiRequest("POST", "/api/properties", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Success",
        description: "Property listing created successfully",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per month</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">Private Room</SelectItem>
                        <SelectItem value="shared">Shared Room</SelectItem>
                        <SelectItem value="entire">Entire Place</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amenities Field */}
              <FormField
                control={form.control}
                name="amenities"
                render={() => (
                  <FormItem>
                    <FormLabel>Amenities</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={amenityInput}
                        onChange={(e) => setAmenityInput(e.target.value)}
                        placeholder="Add amenity (e.g. WiFi, Parking)"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addAmenity}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {amenity}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeAmenity(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image URLs Field */}
              <FormField
                control={form.control}
                name="imageUrls"
                render={() => (
                  <FormItem>
                    <FormLabel>Image URLs</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="Add image URL"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addImageUrl}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {imageUrls.map((url, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {url.substring(0, 25)}...
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeImageUrl(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Listing
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}