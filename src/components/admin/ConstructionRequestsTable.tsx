"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Loader2, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  PhoneCall,
  XCircle,
  Clock,
  HardHat
} from "lucide-react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

// Status badges with appropriate colors
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    PENDING: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3.5 w-3.5 mr-1" /> },
    REVIEWED: { color: "bg-blue-100 text-blue-800", icon: <Eye className="h-3.5 w-3.5 mr-1" /> },
    CONTACTED: { color: "bg-indigo-100 text-indigo-800", icon: <PhoneCall className="h-3.5 w-3.5 mr-1" /> },
    IN_PROGRESS: { color: "bg-purple-100 text-purple-800", icon: <HardHat className="h-3.5 w-3.5 mr-1" /> },
    COMPLETED: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3.5 w-3.5 mr-1" /> },
    CANCELED: { color: "bg-red-100 text-red-800", icon: <XCircle className="h-3.5 w-3.5 mr-1" /> },
  }[status] || { color: "bg-gray-100 text-gray-800", icon: <AlertCircle className="h-3.5 w-3.5 mr-1" /> };

  return (
    <Badge className={`${statusConfig.color} font-medium flex items-center`}>
      {statusConfig.icon}
      {status.replace(/_/g, " ")}
    </Badge>
  );
};

// Format currency (PKR)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Interface for request data
interface ConstructionRequest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  budget: number;
  projectType: string;
  landArea: number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  hasBlueprint: boolean;
  timeline?: string;
  additionalDetails?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function ConstructionRequestsTable() {
  const [requests, setRequests] = useState<ConstructionRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  // Fetch requests from API
  const fetchRequests = async (page = 1, status: string | null = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (status) {
        params.append("status", status);
      }

      const response = await fetch(`/api/construction?${params.toString()}`, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch construction requests");
      }

      const data = await response.json();
      setRequests(data.requests);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching construction requests:", error);
      toast.error("Error loading construction requests");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRequests(1, status);
  }, [status]);

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatus(value === "ALL" ? null : value);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchRequests(page, status);
  };

  // View request details
  const handleViewRequest = (id: string) => {
    router.push(`/admin/construction/${id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="w-full sm:w-48">
          <Select onValueChange={handleStatusChange} defaultValue="ALL">
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="CONTACTED">Contacted</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELED">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[180px]">Client</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Project Details</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Loading requests...</p>
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <p className="text-gray-500">No construction requests found</p>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell className="font-medium">
                    <div className="font-semibold">{request.name}</div>
                    <div className="text-sm text-gray-500">{request.email}</div>
                    <div className="text-sm text-gray-500">{request.phone}</div>
                  </TableCell>
                  <TableCell>{request.city}</TableCell>
                  <TableCell>
                    <div className="font-medium">{request.projectType.replace(/_/g, " ")}</div>
                    <div className="text-sm text-gray-500">
                      {request.landArea} sq ft, {request.floors || 1} floor(s)
                    </div>
                    {request.bedrooms && request.bathrooms && (
                      <div className="text-sm text-gray-500">
                        {request.bedrooms} bed, {request.bathrooms} bath
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(request.budget)}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewRequest(request._id)}
                      className="flex items-center"
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
} 