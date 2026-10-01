"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Landmark,
  Pencil,
  Search,
  Send,
} from "lucide-react";

type PropertyItem = {
  id: string;
  title: string;
  price: number;
  type: string;
  listingType?: string;
  address?: string;
  status: string;
  images?: string[];
  verifiedAt?: string;
  postedAt?: string;
  city?: { id: string; name: string } | null;
};

type TabKey = "ready" | "posted";

export default function PostPropertyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("ready");
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [postedFilter, setPostedFilter] = useState<"ALL" | "ACTIVE" | "HIDDEN">(
    "ALL"
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const statusParam =
    activeTab === "ready"
      ? "VERIFIED"
      : postedFilter === "ALL"
        ? "ACTIVE,HIDDEN"
        : postedFilter;

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/properties`, {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm || undefined,
          status: statusParam,
        },
        headers: {
          "x-admin-auth": "true",
        },
      });

      setProperties(response.data.properties || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setPropertiesCount(response.data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties. Please try again later.");
      setProperties([]);
      setTotalPages(1);
      setPropertiesCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusParam]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, postedFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProperties();
  };

  const handlePostProperty = (propertyId: string) => {
    router.push(`/admin/post-property/${propertyId}`);
  };

  const handleEditProperty = (propertyId: string) => {
    router.push(`/admin/post-property/${propertyId}`);
  };

  const handleToggleVisibility = async (property: PropertyItem) => {
    const nextStatus = property.status === "HIDDEN" ? "ACTIVE" : "HIDDEN";
    const actionLabel = nextStatus === "HIDDEN" ? "hide" : "unhide";

    try {
      setTogglingId(property.id);
      await axios.patch(
        `/api/admin/properties/${property.id}`,
        { status: nextStatus },
        {
          headers: {
            "x-admin-auth": "true",
            "Content-Type": "application/json",
          },
        }
      );
      toast.success(
        nextStatus === "HIDDEN"
          ? "Property hidden from listings"
          : "Property is now visible in listings"
      );
      fetchProperties();
    } catch (error: any) {
      console.error(`Error trying to ${actionLabel} property:`, error);
      toast.error(
        error.response?.data?.error || `Failed to ${actionLabel} property`
      );
    } finally {
      setTogglingId(null);
    }
  };

  const formatAddress = (property: PropertyItem) => {
    const parts: string[] = [];
    if (property.address) parts.push(property.address);
    if (property.city?.name) parts.push(property.city.name);
    return parts.join(", ") || "No address";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Crore`;
    }
    if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} Lac`;
    }
    return `₨ ${price.toLocaleString()}`;
  };

  const statusBadge = (status: string) => {
    if (status === "VERIFIED") {
      return "bg-yellow-100 text-yellow-800";
    }
    if (status === "ACTIVE") {
      return "bg-green-100 text-green-800";
    }
    if (status === "HIDDEN") {
      return "bg-gray-200 text-gray-700";
    }
    return "bg-blue-100 text-blue-800";
  };

  const statusLabel = (status: string) => {
    if (status === "ACTIVE") return "Live";
    if (status === "HIDDEN") return "Hidden";
    if (status === "VERIFIED") return "Ready";
    return status;
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post Properties</h1>
        <p className="mt-1 text-sm text-gray-500">
          Post verified listings, track posted ads, and edit or hide them anytime
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("ready")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "ready"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Ready to Post
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("posted")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "posted"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Posted Listings
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by title or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>

        {activeTab === "posted" && (
          <select
            value={postedFilter}
            onChange={(e) =>
              setPostedFilter(e.target.value as "ALL" | "ACTIVE" | "HIDDEN")
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="ALL">All posted</option>
            <option value="ACTIVE">Live only</option>
            <option value="HIDDEN">Hidden only</option>
          </select>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === "ready" ? "Verified" : "Posted"}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                    </div>
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    {activeTab === "ready"
                      ? "No verified properties waiting to be posted"
                      : "No posted properties found"}
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative h-10 w-10 flex-shrink-0 mr-3 rounded overflow-hidden bg-gray-100">
                          {property.images?.[0] ? (
                            <Image
                              src={property.images[0]}
                              alt={property.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Landmark className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 max-w-[240px] truncate">
                            {property.title}
                          </div>
                          <div className="text-xs text-gray-500 max-w-[240px] truncate">
                            {formatAddress(property)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatPrice(property.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {property.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(
                          property.status
                        )}`}
                      >
                        {statusLabel(property.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {activeTab === "ready"
                        ? formatDate(property.verifiedAt)
                        : formatDate(property.postedAt || property.verifiedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {activeTab === "ready" ? (
                          <button
                            type="button"
                            onClick={() => handlePostProperty(property.id)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Post Property
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditProperty(property.id)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(property)}
                              disabled={togglingId === property.id}
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border disabled:opacity-50 ${
                                property.status === "HIDDEN"
                                  ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                              }`}
                            >
                              {property.status === "HIDDEN" ? (
                                <>
                                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                                  Unhide
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                                  Hide
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{properties.length}</span> of{" "}
              <span className="font-medium">{propertiesCount}</span> properties
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage >= totalPages || totalPages === 0}
                className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  currentPage >= totalPages || totalPages === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
