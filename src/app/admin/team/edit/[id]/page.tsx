"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Switch } from "@/components/ui/switch";

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
  }).optional(),
  cityId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function EditTeamMemberPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [teamMember, setTeamMember] = useState<any>(null);

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      role: "",
      isActive: true,
      password: "",
      cityId: "",
    },
  });

  // Fetch team member data and cities
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch team member data
        const memberResponse = await fetch(`/api/admin/team/${params.id}`, {
          headers: {
            'x-admin-auth': 'true'
          }
        });
        if (!memberResponse.ok) {
          throw new Error("Failed to fetch team member data");
        }
        const memberData = await memberResponse.json();
        setTeamMember(memberData);

        // Set form values
        form.reset({
          name: memberData.name,
          email: memberData.email,
          phoneNumber: memberData.phoneNumber || "",
          role: memberData.role,
          isActive: memberData.isActive,
          cityId: memberData.cityId || "",
          password: "", // Don't populate password field
        });

        // Fetch cities
        const citiesResponse = await fetch("/api/cities");
        if (citiesResponse.ok) {
          const citiesData = await citiesResponse.json();
          console.log("Cities fetched:", citiesData.length);
          setCities(citiesData);
        } else {
          console.error("Failed to fetch cities:", citiesResponse.statusText);
          toast.error("Could not load cities list");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load team member data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Remove empty password if not provided
      const submitData = { ...values };
      if (!submitData.password) {
        delete submitData.password;
      }

      const response = await fetch(`/api/admin/team/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'x-admin-auth': 'true'
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update team member");
      }

      toast.success("Team member updated successfully");
      router.push("/admin/team");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!teamMember && !isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Team Member Not Found</h1>
        <p className="mt-4">
          The team member you are looking for does not exist or you do not have
          permission to view it.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/admin/team")}
        >
          Back to Team Management
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Team Member</h1>
        <Button variant="outline" onClick={() => router.push("/admin/team")}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Member Information</CardTitle>
          <CardDescription>
            Update the information for this team member.
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
                        <Input 
                          type="password" 
                          placeholder="Leave blank to keep current password"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank to keep current password.
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
                      <FormLabel>City</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <FormDescription>
                          Disable to prevent this user from accessing the system.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 