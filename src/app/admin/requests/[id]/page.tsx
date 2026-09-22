"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, ArrowLeft, FileText, User, Mail, Phone, MapPin, Home, Check, X, Clock, ClipboardEdit, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyRequest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  budget: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  additionalDetails?: string;
  status: "PENDING" | "REVIEWED" | "CONTACTED" | "COMPLETED" | "CANCELED";
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  assignedToId?: string;
}

const statusOptions = [
  { value: "PENDING", label: "Pending", icon: Clock, color: "text-yellow-500 bg-yellow-50" },
  { value: "REVIEWED", label: "Reviewed", icon: ClipboardEdit, color: "text-blue-500 bg-blue-50" },
  { value: "CONTACTED", label: "Contacted", icon: Phone, color: "text-purple-500 bg-purple-50" },
  { value: "COMPLETED", label: "Completed", icon: Check, color: "text-green-500 bg-green-50" },
  { value: "CANCELED", label: "Canceled", icon: X, color: "text-red-500 bg-red-50" },
];

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  
  const [request, setRequest] = useState<PropertyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/requests/${requestId}`, {
          headers: {
            'x-admin-auth': 'true'
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch request details");
        }
        
        const data = await response.json();
        setRequest(data.request);
        setStatus(data.request.status);
        setAdminNotes(data.request.adminNotes || "");
      } catch (error) {
        console.error("Error fetching request:", error);
        toast.error("Failed to load request details");
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'x-admin-auth': 'true'
        },
        body: JSON.stringify({
          status,
          adminNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update request");
      }

      toast.success("Request updated successfully");
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/requests/${requestId}`, {
          method: "DELETE",
          headers: {
            'x-admin-auth': 'true'
          }
        });

        if (!response.ok) {
          throw new Error("Failed to delete request");
        }

        toast.success("Request deleted successfully");
        router.push("/admin/requests");
      } catch (error) {
        console.error("Error deleting request:", error);
        toast.error("Failed to delete request");
      }
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-2 text-sm text-gray-500">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <FileText className="h-16 w-16 text-gray-400" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Request not found</h1>
        <p className="mt-2 text-gray-500">
          The request you're looking for doesn't exist or has been deleted.
        </p>
        <Button
          className="mt-6"
          onClick={() => router.push("/admin/requests")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
      </div>
    );
  }

  const getStatusDetails = (statusValue: string) => {
    return statusOptions.find((option) => option.value === statusValue) || statusOptions[0];
  };

  const statusInfo = getStatusDetails(request.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/requests")}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Property Request Details</h1>
            <p className="text-sm text-gray-500">
              Submitted {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleDelete}
          >
            Delete Request
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Information</CardTitle>
            <CardDescription>Contact details of the requester</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <User className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{request.name}</p>
                <p className="text-sm text-gray-500">Full Name</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{request.email}</p>
                <p className="text-sm text-gray-500">Email Address</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{request.phone}</p>
                <p className="text-sm text-gray-500">Phone Number</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{request.city}</p>
                <p className="text-sm text-gray-500">City</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Property Requirements</CardTitle>
            <CardDescription>Requested property details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Home className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{request.propertyType}</p>
                <p className="text-sm text-gray-500">Property Type</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <DollarSign className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{formatCurrency(request.budget)}</p>
                <p className="text-sm text-gray-500">Budget</p>
              </div>
            </div>
            {request.bedrooms !== undefined && (
              <div className="grid grid-cols-3 gap-4 rounded-md bg-gray-50 p-3">
                <div>
                  <p className="font-medium text-gray-900">{request.bedrooms}</p>
                  <p className="text-xs text-gray-500">Bedrooms</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{request.bathrooms ?? "N/A"}</p>
                  <p className="text-xs text-gray-500">Bathrooms</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{request.area ? `${request.area} sq ft` : "N/A"}</p>
                  <p className="text-xs text-gray-500">Area</p>
                </div>
              </div>
            )}
            {request.additionalDetails && (
              <div className="mt-4">
                <p className="mb-1 text-sm font-medium text-gray-700">Additional Requirements:</p>
                <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">{request.additionalDetails}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Status and Admin Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Management</CardTitle>
            <CardDescription>Update status and add notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Current Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <option.icon className="mr-2 h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Admin Notes
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this request..."
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-xs text-gray-500">
              Last updated: {formatDistanceToNow(new Date(request.updatedAt), { addSuffix: true })}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 