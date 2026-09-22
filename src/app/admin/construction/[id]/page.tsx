"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { Loader2, ArrowLeft, Clock, CheckCircle, XCircle, PhoneCall, HardHat, Eye } from "lucide-react";
import { toast } from "sonner";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Status options and their colors
const statusOptions = [
  { value: "PENDING", label: "Pending", icon: <Clock className="h-4 w-4 mr-2" />, color: "bg-yellow-100 text-yellow-800" },
  { value: "REVIEWED", label: "Reviewed", icon: <Eye className="h-4 w-4 mr-2" />, color: "bg-blue-100 text-blue-800" },
  { value: "CONTACTED", label: "Contacted", icon: <PhoneCall className="h-4 w-4 mr-2" />, color: "bg-indigo-100 text-indigo-800" },
  { value: "IN_PROGRESS", label: "In Progress", icon: <HardHat className="h-4 w-4 mr-2" />, color: "bg-purple-100 text-purple-800" },
  { value: "COMPLETED", label: "Completed", icon: <CheckCircle className="h-4 w-4 mr-2" />, color: "bg-green-100 text-green-800" },
  { value: "CANCELED", label: "Canceled", icon: <XCircle className="h-4 w-4 mr-2" />, color: "bg-red-100 text-red-800" },
];

// Format currency (PKR)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  return format(new Date(dateString), "PPP");
};

// Get status details by value
const getStatusDetails = (value: string) => {
  return statusOptions.find(option => option.value === value) || statusOptions[0];
};

// This is a client component, so we'll use the useParams hook
export default function ConstructionRequestDetail() {
  // Use useParams hook to get the ID parameter
  const params = useParams();
  const requestId = params.id as string;
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();

  // Fetch request details
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/construction/${requestId}`, {
          headers: {
            'x-admin-auth': 'true'
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch construction request");
        }

        const data = await response.json();
        setRequest(data.request);
        setStatus(data.request.status);
      } catch (error) {
        console.error("Error fetching request:", error);
        toast.error("Error loading construction request");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  // Update request status
  const handleStatusUpdate = async () => {
    if (status === request.status) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/construction/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'x-admin-auth': 'true'
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setRequest({ ...request, status });
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
      // Revert status selection on error
      setStatus(request.status);
    } finally {
      setUpdating(false);
    }
  };

  // Go back to construction requests list
  const handleBack = () => {
    router.push("/admin/construction");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
        <p className="text-gray-600 mb-4">The construction request you're looking for doesn't exist.</p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
      </div>
    );
  }

  const statusDetails = getStatusDetails(request.status);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
        
        <h1 className="text-2xl font-semibold text-gray-900">Construction Request Details</h1>
        <p className="text-gray-500">Request ID: {requestId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Contact details of the client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Name</h3>
              <p className="font-semibold">{request.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p>{request.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p>{request.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">City</h3>
              <p>{request.city}</p>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Specifications for the construction project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Project Type</h3>
              <p className="font-semibold">{request.projectType.replace(/_/g, " ")}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Land Area</h3>
              <p>{request.landArea} sq ft</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Floors</h3>
                <p>{request.floors || 1}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bedrooms</h3>
                <p>{request.bedrooms || "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bathrooms</h3>
                <p>{request.bathrooms || "N/A"}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Blueprint</h3>
              <p>{request.hasBlueprint ? "Yes" : "No"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
              <p>{request.timeline?.replace(/_/g, " ") || "Not specified"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Budget & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Budget & Status</CardTitle>
            <CardDescription>Financial and status information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Budget</h3>
              <p className="text-lg font-bold">{formatCurrency(request.budget)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Current Status</h3>
              <div className="mt-1">
                <Badge className={`${statusDetails.color} font-medium flex items-center w-fit`}>
                  {statusDetails.icon}
                  {statusDetails.label}
                </Badge>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Submitted On</h3>
              <p>{formatDate(request.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p>{formatDate(request.updatedAt)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Update Status</h3>
            <div className="flex w-full gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleStatusUpdate} disabled={updating || status === request.status}>
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Additional Details */}
      {request.additionalDetails && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Extra information provided by the client</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{request.additionalDetails}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 