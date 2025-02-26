import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function CreateListing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const form = useForm({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      location: "",
      roomType: "private",
      amenities: [],
      imageUrls: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
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
          <Form
            form={form}
            onSubmit={(data) => createMutation.mutate(data)}
          >
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input {...form.register("title")} />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea {...form.register("description")} />
              </div>
              
              <div>
                <Label>Price per month</Label>
                <Input
                  type="number"
                  {...form.register("price", { valueAsNumber: true })}
                />
              </div>
              
              <div>
                <Label>Location</Label>
                <Input {...form.register("location")} />
              </div>
              
              <div>
                <Label>Room Type</Label>
                <select
                  {...form.register("roomType")}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="private">Private Room</option>
                  <option value="shared">Shared Room</option>
                  <option value="entire">Entire Place</option>
                </select>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                Create Listing
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
