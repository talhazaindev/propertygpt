"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ClipboardEdit, 
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  PhoneCall,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const statusOptions = [
  { value: "PENDING", label: "Pending", icon: Clock },
  { value: "REVIEWED", label: "Reviewed", icon: Eye },
  { value: "CONTACTED", label: "Contacted", icon: PhoneCall },
  { value: "COMPLETED", label: "Completed", icon: CheckCircle },
  { value: "CANCELED", label: "Canceled", icon: XCircle },
];

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

export function PropertyRequestsTable() {
  const router = useRouter();
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch property requests
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          sortBy,
          sortOrder,
        });

        if (statusFilter) {
          params.append("status", statusFilter);
        }

        const response = await fetch(`/api/requests?${params}`, {
          headers: {
            'x-admin-auth': 'true'
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }

        const data = await response.json();
        setRequests(data.requests);
        setTotalPages(data.pagination.pages);
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast.error("Failed to load property requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [page, statusFilter, sortBy, sortOrder]);

  // Handle status change
  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'x-admin-auth': 'true'
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update request status");
      }

      // Update the request in the state
      setRequests((prev) =>
        prev.map((req) =>
          req._id === requestId ? { ...req, status: newStatus as any } : req
        )
      );

      toast.success("Request status updated");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update request status");
    }
  };

  // Handle request deletion
  const handleDelete = async (requestId: string) => {
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

        // Remove the request from the state
        setRequests((prev) => prev.filter((req) => req._id !== requestId));
        toast.success("Property request deleted");
      } catch (error) {
        console.error("Error deleting request:", error);
        toast.error("Failed to delete property request");
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

  // Get status icon
  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find((option) => option.value === status);
    if (!statusOption) return null;
    
    const Icon = statusOption.icon;
    return <Icon className="mr-1 h-4 w-4" />;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-500 bg-yellow-50";
      case "REVIEWED":
        return "text-blue-500 bg-blue-50";
      case "CONTACTED":
        return "text-purple-500 bg-purple-50";
      case "COMPLETED":
        return "text-green-500 bg-green-50";
      case "CANCELED":
        return "text-red-500 bg-red-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <p className="text-sm text-gray-500">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (!loading && requests.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="text-lg font-medium text-gray-900">No property requests found</p>
        <p className="text-sm text-gray-500">
          {statusFilter
            ? `No ${statusFilter.toLowerCase()} requests at the moment.`
            : "There are no property requests at the moment."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        {/* Status filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Status:
          </label>
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          >
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
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

        {/* Sort controls */}
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
            Sort by:
          </label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort-by" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="city">City</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Property Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request._id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-gray-500">{request.email}</p>
                    <p className="text-sm text-gray-500">{request.phone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{formatCurrency(request.budget)}</p>
                    <p className="text-sm text-gray-500">
                      {request.propertyType} in {request.city}
                    </p>
                    <p className="text-sm text-gray-500">
                      {request.bedrooms ? `${request.bedrooms} bed${request.bedrooms > 1 ? 's' : ''}` : ''} 
                      {request.bathrooms ? `, ${request.bathrooms} bath${request.bathrooms > 1 ? 's' : ''}` : ''} 
                      {request.area ? `, ${request.area} sq ft` : ''}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span>{statusOptions.find(s => s.value === request.status)?.label || request.status}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-gray-900">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Select
                      value={request.status}
                      onValueChange={(value) => handleStatusChange(request._id, value)}
                    >
                      <SelectTrigger className="h-8 w-[130px]">
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
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/admin/requests/${request._id}`)}
                    >
                      <ClipboardEdit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(request._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing page {page} of {totalPages}
        </p>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 