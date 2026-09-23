"use client";

import { useState, useEffect } from "react";
import { 
  Search, Eye, Trash2, CheckCircle, XCircle, PlusCircle, 
  ChevronLeft, ChevronRight, Edit, Filter, SlidersHorizontal,
  Building2, ArrowDownUp, MoreVertical, Plus, UserCheck, AlertCircle, X
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { propertyTypes } from "@/schemas/property";

// Define Property type
interface Property {
  id: string;
  title: string;
  type: "APARTMENT" | "HOUSE" | "VILLA" | "LAND" | "COMMERCIAL";
  listingType: "SALE" | "RENTAL";
  price: number;
  address: string;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "ACTIVE" | "SOLD";
  featured: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  city?: {
    id: string;
    name: string;
  };
  images: string[];
  verifiedAt?: string;
  verifiedBy?: {
    id: string;
    name: string;
  };
  rejectionReason?: string;
  description: string;
}

// Default external placeholder for property images
const DEFAULT_PROPERTY_IMAGE = '/images/property-placeholder.jpg';

// Dialog for rejection reason
const RejectionDialog = ({ 
  isOpen, 
  onClose, 
  onReject, 
  propertyId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onReject: (id: string, reason: string) => void; 
  propertyId: string; 
}) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Rejection Reason</h3>
        <textarea
          className="w-full border rounded-md p-2 h-32 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter reason for rejection..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button 
            className="px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            onClick={() => {
              if (!reason.trim()) {
                toast.error("Please provide a rejection reason");
                return;
              }
              onReject(propertyId, reason);
              onClose();
            }}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

// Dialog for sale details
const SaleDialog = ({ 
  isOpen, 
  onClose, 
  onSale, 
  property 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSale: (id: string, price: number, commission: number) => void; 
  property: Property | null; 
}) => {
  const [price, setPrice] = useState(property?.price || 0);
  const [commission, setCommission] = useState((property?.price || 0) * 0.03); // Default 3%

  useEffect(() => {
    if (property) {
      setPrice(property.price);
      setCommission(property.price * 0.03);
    }
  }, [property]);

  // Update commission when price changes
  useEffect(() => {
    setCommission(price * 0.03);
  }, [price]);

  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Mark Property as Sold</h3>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Final Selling Price (PKR)
          </label>
          <input
            type="number"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Commission (PKR)
          </label>
          <input
            type="number"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={commission}
            onChange={(e) => setCommission(Number(e.target.value))}
          />
          <p className="text-sm text-gray-500 mt-1">
            Default commission is 3% of sale price.
          </p>
        </div>
        <div className="flex justify-end space-x-2">
          <button 
            className="px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            onClick={() => {
              if (price <= 0) {
                toast.error("Please enter a valid selling price");
                return;
              }
              if (commission < 0) {
                toast.error("Commission cannot be negative");
                return;
              }
              onSale(property.id, price, commission);
              onClose();
            }}
          >
            Mark as Sold
          </button>
        </div>
      </div>
    </div>
  );
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "VERIFIED":
        return "bg-blue-100 text-blue-700";
      case "SOLD":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeStyle()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
};

export default function PropertyManagement() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedListingType, setSelectedListingType] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [showTeamMemberAlert, setShowTeamMemberAlert] = useState(false);
  const [hasTeamMembers, setHasTeamMembers] = useState(true);
  
  const itemsPerPage = 8;
  
  const router = useRouter();
  
  // Check if team members exist
  useEffect(() => {
    const checkTeamMembers = async () => {
      try {
        const response = await axios.get('/api/admin/team?limit=1', {
          headers: {
            'x-admin-auth': 'true'
          }
        });
        
        if (response.data && (!response.data.teamMembers || response.data.teamMembers.length === 0)) {
          setHasTeamMembers(false);
          setShowTeamMemberAlert(true);
        } else {
          setHasTeamMembers(true);
        }
      } catch (error) {
        console.error("Error checking team members:", error);
        // If there's an error, we'll assume no team members and show the alert
        setHasTeamMembers(false);
        setShowTeamMemberAlert(true);
      }
    };
    
    checkTeamMembers();
  }, []);
  
  // Fetch properties from API
  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());
      
      if (selectedType) params.append("type", selectedType);
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedListingType) params.append("listingType", selectedListingType);
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await axios.get(`/api/admin/properties?${params.toString()}`, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      console.log('Fetched properties from API:', response.data.properties);
      setProperties(response.data.properties || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalProperties(response.data.pagination?.total || 0);
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      
      // Set empty properties array to prevent UI errors
      setProperties([]);
      setTotalPages(1);
      setTotalProperties(0);
      
      // Show a more specific error message if available
      if (error.response?.status === 500) {
        toast.error("Server error: The properties could not be loaded. Please try again later.");
      } else if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else if (error.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error("Failed to fetch properties. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProperties();
  }, [currentPage, selectedType, selectedStatus, selectedListingType, searchTerm]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Handle property status changes
  const verifyProperty = async (propertyId: string) => {
    try {
      const response = await axios.patch(`/api/admin/properties/${propertyId}`,
        {
          status: "VERIFIED",
          verifiedAt: new Date().toISOString()
        },
        {
          headers: {
            'x-admin-auth': 'true',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        toast.success("Property verified successfully");
        fetchProperties();
      }
    } catch (error: any) {
      console.error("Error verifying property:", error);
      if (error.response?.status === 404 && error.response?.data?.error === "Team member not found") {
        toast.error("You need to be registered as a team member to verify properties");
        setShowTeamMemberAlert(true);
      } else {
        toast.error("Failed to verify property");
      }
    }
  };
  
  const activateProperty = async (propertyId: string) => {
    try {
      await axios.patch(`/api/admin/properties/${propertyId}`, {
        status: "ACTIVE",
      }, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      toast.success("Property activated successfully");
      fetchProperties();
    } catch (error) {
      console.error("Error activating property:", error);
      toast.error("Failed to activate property");
    }
  };
  
  const openRejectDialog = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setRejectionDialogOpen(true);
  };
  
  const openSaleDialog = (property: Property) => {
    setSelectedProperty(property);
    setSaleDialogOpen(true);
  };
  
  const handleRejectProperty = async (propertyId: string, rejectionReason: string) => {
    try {
      await axios.patch("/api/admin/properties", {
        id: propertyId,
        status: "REJECTED",
        rejectionReason,
      }, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      toast.success("Property rejection recorded");
      fetchProperties();
    } catch (error) {
      console.error("Error rejecting property:", error);
      toast.error("Failed to reject property");
    }
  };
  
  const handleToggleFeatured = async (propertyId: string, featured: boolean) => {
    try {
      await axios.put("/api/admin/properties", {
        id: propertyId,
        featured: !featured,
      }, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      toast.success(featured ? "Property removed from featured" : "Property marked as featured");
      fetchProperties();
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast.error("Failed to update featured status");
    }
  };
  
  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/properties?id=${propertyId}`, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      toast.success("Property deleted successfully");
      fetchProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Failed to delete property");
    }
  };
  
  const handleMarkAsSold = async (propertyId: string, price: number, commission: number) => {
    try {
      const response = await axios.post('/api/admin/sales/mark-as-sold', 
        { 
          propertyId,
          price,
          commission
        },
        {
          headers: {
            'x-admin-auth': 'true',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Property marked as sold successfully!");
        fetchProperties();
      } else {
        toast.error("Failed to mark property as sold");
      }
    } catch (error: any) {
      console.error("Error marking property as sold:", error);
      toast.error(error.response?.data?.error || "Failed to mark property as sold");
    }
  };
  
  // Format price
  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Crore PKR`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} Lac PKR`;
    } else {
      return `${price.toLocaleString()} PKR`;
    }
  };
  
  // Property action buttons
  const PropertyActions = ({ property }: { property: Property }) => (
    <div className="flex flex-wrap items-center space-x-2">
      {property.status === "PENDING" && (
        <>
          <button
            onClick={() => verifyProperty(property.id)}
            className="p-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            title="Verify Property"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => openRejectDialog(property.id)}
            className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
            title="Reject Property"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </>
      )}
      
      {property.status === "VERIFIED" && (
        <button
          onClick={() => activateProperty(property.id)}
          className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          title="Activate Property"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      )}
      
      {(property.status === "ACTIVE" || property.status === "VERIFIED") && (
        <button
          onClick={() => openSaleDialog(property)}
          className="p-1.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
          title="Mark as Sold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M2 6h20l-2 12H4z"></path>
            <path d="M6 12v4"></path>
            <path d="M10 12v4"></path>
            <path d="M14 12v4"></path>
            <path d="M18 12v4"></path>
            <path d="M5 10V2"></path>
            <path d="M19 10V2"></path>
          </svg>
        </button>
      )}
      
      <Link
        href={`/admin/properties/${property.id}`}
        className="p-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        title="View Property Details"
      >
        <Eye className="h-4 w-4" />
      </Link>
      
      <button
        onClick={() => handleDeleteProperty(property.id)}
        className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
        title="Delete Property"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => handleToggleFeatured(property.id, !property.featured)}
        className={`p-1.5 ${property.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'} rounded-full hover:bg-yellow-200 transition-colors`}
        title={property.featured ? "Remove from Featured" : "Add to Featured"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={property.featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>
    </div>
  );

  // Property card for grid view
  const PropertyCard = ({ property }: { property: Property }) => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        {property.images.length > 0 ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Building2 className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {property.featured && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Featured
          </div>
        )}
        <div className="absolute top-2 right-2 text-xs bg-black bg-opacity-60 text-white px-2 py-1 rounded-full">
          {property.listingType === "SALE" ? "For Sale" : "For Rent"}
        </div>
      </div>
      
      <div className="p-4">
        <Link href={`/admin/properties/${property.id}`} className="hover:underline">
          <h3 className="text-xl font-semibold line-clamp-1">{property.title}</h3>
        </Link>
        
        <p className="text-lg font-medium text-purple-700 mt-1">{formatPrice(property.price)}</p>
        
        <div className="mt-2 text-gray-600 text-sm">
          <p className="line-clamp-1">{property.address}</p>
          {property.city && <p>{property.city.name}</p>}
        </div>
        
        <div className="flex justify-between items-center mt-2 text-gray-600 text-sm">
          <div className="flex space-x-3">
            {property.bedrooms && (
              <span>{property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}</span>
            )}
            {property.bathrooms && (
              <span>{property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}</span>
            )}
            <span>{property.area} m²</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <div className="text-sm">
            <p className="text-gray-500">Owner:</p>
            <p className="font-medium truncate max-w-[150px]">{property.owner?.name || 'Unknown'}</p>
          </div>
          <PropertyActions property={property} />
        </div>
      </div>
    </div>
  );

  // Property row for list view
  const PropertyRow = ({ property }: { property: Property }) => (
    <tr className="hover:bg-gray-50">
      <td className="p-3 border-b">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100">
            {property.images.length > 0 ? (
              <Image
                src={property.images[0]}
                alt={property.title}
                fill
                className="object-cover"
              />
            ) : (
              <Building2 className="h-6 w-6 text-gray-400 absolute inset-0 m-auto" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 line-clamp-1">
              {property.title}
            </h3>
            <p className="text-xs text-gray-500">
              {new Date(property.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </td>
      <td className="p-3 border-b">
        <div>
          <span className="text-primary font-medium">{formatPrice(property.price)}</span>
          <span className="text-xs text-gray-500 ml-1">
            {property.listingType === "SALE" ? "Sale" : "Rent"}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {property.type.charAt(0) + property.type.slice(1).toLowerCase()}
        </div>
      </td>
      <td className="py-3 px-2 text-sm">{property.owner?.name || 'Unknown'}</td>
      <td className="py-3 px-2">
        <StatusBadge status={property.status} />
      </td>
      <td className="py-3 px-2">
        <PropertyActions property={property} />
      </td>
    </tr>
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-purple-600 border-gray-100"></div>
          <h2 className="mt-4 text-lg font-semibold text-gray-600">Loading properties...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Team Member Alert */}
      {showTeamMemberAlert && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-yellow-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Team member required</h3>
            <p className="text-sm mt-1">
              {!hasTeamMembers ? (
                <>
                  You need to create at least one team member to verify properties. 
                  <Link href="/admin/team/new" className="font-medium text-primary hover:underline ml-1">
                    Create a team member
                  </Link>
                </>
              ) : (
                "You must be a team member to verify properties."
              )}
            </p>
          </div>
          <button 
            onClick={() => setShowTeamMemberAlert(false)}
            className="ml-auto text-yellow-500 hover:text-yellow-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all property listings</p>
        </div>

        {/* Right: Actions */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          {/* Team Management link */}
          <Link
            href="/admin/team"
            className="btn bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 flex items-center transition duration-150 mr-2"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            <span>Team Members</span>
          </Link>
          
          {/* Add property button */}
          <Link
            href="/admin/properties/new"
            className="btn bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 flex items-center transition duration-150"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Add Property</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search properties..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            <Filter className="h-4 w-4" />
            <span>{filtersVisible ? "Hide Filters" : "Show Filters"}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg ${view === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <div className="grid grid-cols-2 gap-1">
                <div className="w-2 h-2 bg-current rounded-sm"></div>
                <div className="w-2 h-2 bg-current rounded-sm"></div>
                <div className="w-2 h-2 bg-current rounded-sm"></div>
                <div className="w-2 h-2 bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg ${view === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <div className="flex flex-col gap-1">
                <div className="w-4 h-1 bg-current rounded-sm"></div>
                <div className="w-4 h-1 bg-current rounded-sm"></div>
                <div className="w-4 h-1 bg-current rounded-sm"></div>
              </div>
            </button>
          </div>
        </div>
        
        {filtersVisible && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                id="type-filter"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={selectedType || ""}
                onChange={(e) => setSelectedType(e.target.value || null)}
              >
                <option value="">All Types</option>
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status-filter"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={selectedStatus || ""}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="ACTIVE">Active</option>
                <option value="SOLD">Sold</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="listing-type-filter" className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
              <select
                id="listing-type-filter"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={selectedListingType || ""}
                onChange={(e) => setSelectedListingType(e.target.value || null)}
              >
                <option value="">All Listings</option>
                <option value="SALE">For Sale</option>
                <option value="RENTAL">For Rent</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Property list */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Debug grid view */}
        <div className="p-4">
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No properties to display
            </div>
          )}
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center w-full sm:w-auto">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search properties..."
                className="w-full border-gray-300 shadow-sm rounded-md pl-10 pr-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <button className="ml-2 p-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Filter className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead className="text-xs font-semibold uppercase text-gray-500 bg-gray-50">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Property</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Type</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <div className="font-semibold text-center">Price</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <div className="font-semibold text-center">Status</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <div className="font-semibold text-center">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-200">
              {properties.map((property) => (
                <PropertyRow key={property.id} property={property} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing 1 to 2 of 2 properties
          </div>
          <div className="flex space-x-1">
            <button className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Dialog */}
      <RejectionDialog
        isOpen={rejectionDialogOpen}
        onClose={() => setRejectionDialogOpen(false)}
        onReject={handleRejectProperty}
        propertyId={selectedPropertyId || ""}
      />
      
      {/* Sale Dialog */}
      <SaleDialog
        isOpen={saleDialogOpen}
        onClose={() => setSaleDialogOpen(false)}
        onSale={handleMarkAsSold}
        property={selectedProperty}
      />
    </div>
  );
} 