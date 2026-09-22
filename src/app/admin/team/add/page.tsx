"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phoneNumber: z.string().optional(),
  role: z.string({
    required_error: "Please select a role.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  cityId: z
    .string()
    .optional()
    .refine(val => !val || val === "none" || /^[0-9a-fA-F]{24}$/.test(val), {
      message: "Invalid city ID format. Please select a valid city or none."
    }),
});

// MongoDB Replica Set Error Dialog Component
const NoReplicaSetDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">MongoDB Configuration Issue</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Your MongoDB instance is not configured as a replica set, which is required for certain operations in Prisma.
          </p>
          
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
            <p className="text-sm text-amber-700">
              <strong>Technical Details:</strong> MongoDB requires a replica set configuration to support transactions, which are used by Prisma for certain operations.
            </p>
          </div>
          
          <h4 className="font-semibold mt-4 mb-2">Options to Resolve:</h4>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>Configure your MongoDB instance as a replica set (recommended for production)</li>
            <li>Use a MongoDB Atlas cloud instance which comes pre-configured with replica sets</li>
            <li>Modify your application code to avoid transactions (for development only)</li>
          </ol>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Close
          </Button>
          <Button onClick={() => window.open("https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/", "_blank")}>
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function AddTeamMemberPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [showReplicaSetError, setShowReplicaSetError] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      role: "",
      password: "",
      cityId: "none",
    },
  });

  // Fetch cities for the dropdown
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/api/cities");
        if (response.ok) {
          const data = await response.json();
          console.log("Cities fetched:", data.length);
          setCities(data);
        } else {
          console.error("Failed to fetch cities:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Process the cityId to ensure it's either a valid ObjectId or null
      const dataToSubmit = {
        ...values,
        cityId: values.cityId && values.cityId !== "none" ? values.cityId : null
      };

      const response = await fetch("/api/admin/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": "true"
        },
        body: JSON.stringify(dataToSubmit),
      });

      const data = await response.json();
      
      if (!response.ok) {
        let errorMessage = data.error || "Failed to create team member";
        
        // Check for MongoDB replica set errors
        if (errorMessage.includes("replica set")) {
          setShowReplicaSetError(true);
          throw new Error("MongoDB replica set configuration required");
        }
        
        throw new Error(errorMessage);
      }

      toast.success("Team member added successfully");
      router.push("/admin/team");
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* MongoDB Replica Set Error Dialog */}
      <NoReplicaSetDialog 
        isOpen={showReplicaSetError} 
        onClose={() => setShowReplicaSetError(false)} 
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add Team Member</h1>
        <Button variant="outline" onClick={() => router.push("/admin/team")}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Member Information</CardTitle>
          <CardDescription>
            Fill out the form below to add a new team member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          <SelectItem value="AREA_MANAGER">Area Manager</SelectItem>
                          <SelectItem value="PROPERTY_VERIFIER">
                            Property Verifier
                          </SelectItem>
                          <SelectItem value="CONTENT_CREATOR">
                            Content Creator
                          </SelectItem>
                          <SelectItem value="CUSTOMER_SUPPORT">
                            Customer Support
                          </SelectItem>
                          <SelectItem value="INVENTORY_MANAGER">
                            Inventory Manager
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a city (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Assign a city to this team member if they're responsible for a specific area.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Team Member"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 