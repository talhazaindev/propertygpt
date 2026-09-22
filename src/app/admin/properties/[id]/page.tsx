"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
axios.defaults.withCredentials = true;
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, AlertCircle, UserCheck, Star, Camera, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

// Default placeholder for property images
const DEFAULT_PROPERTY_IMAGE = '/images/property-placeholder.jpg';

// PropertyDetail component
export default function PropertyDetail() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showTeamMemberAlert, setShowTeamMemberAlert] = useState(false);
  
  const propertyId = params.id as string;
  
  // Fetch property details
  const fetchProperty = async () => {
    try {
      setIsLoading(true);
      const baseUrl = window.location.origin;
      const response = await axios.get(`${baseUrl}/api/admin/properties/${propertyId}`, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      setProperty(response.data);
    } catch (error: any) {
      console.error("Error fetching property:", error);
      
      if (error.response?.status === 500) {
        toast.error("Server error: The property could not be loaded. Please try again later.");
      } else if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else if (error.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error("Failed to load property details");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProperty();
  }, [propertyId]);
  
  // Handle property status changes
  const verifyProperty = async () => {
    try {
      const baseUrl = window.location.origin;
      console.log("Verifying property with ID:", propertyId);
      
      // Use the dynamic route directly
      await axios.patch(`${baseUrl}/api/admin/properties/${propertyId}`, {
        status: "VERIFIED",
        // Include current date to ensure it's properly recorded
        verifiedAt: new Date().toISOString()
      }, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      toast.success("Property verified successfully");
      fetchProperty();
    } catch (error: any) {
      console.error("Error verifying property:", error);
      const baseUrl = window.location.origin; // Define baseUrl in this scope too
      
      if (error.response?.status === 404 && error.response.data?.error === "Team member not found") {
        setShowTeamMemberAlert(true);
      } else if (error.response?.status === 404) {
        // Fallback attempt if 404 error - try with regular API
        try {
          await axios.patch(`${baseUrl}/api/admin/properties`, {
            id: propertyId,
            status: "VERIFIED",
            verifiedAt: new Date().toISOString()
          }, {
            headers: {
              'x-admin-auth': 'true',
              'Content-Type': 'application/json'
            }
          });
          toast.success("Property verified successfully");
          fetchProperty();
        } catch (fallbackError: any) {
          console.error("Fallback attempt failed:", fallbackError);
          toast.error("API endpoint not found. Please check the URL path.");
        }
      } else if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else {
        toast.error("Failed to verify property");
      }
    }
  };
  
  const activateProperty = async () => {
    try {
      const baseUrl = window.location.origin;
      await axios.patch(`${baseUrl}/api/admin/properties`, {
        id: propertyId,
        status: "ACTIVE"
      }, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      toast.success("Property activated successfully");
      fetchProperty();
    } catch (error: any) {
      console.error("Error activating property:", error);
      if (error.response?.status === 404) {
        toast.error("API endpoint not found. Please check the URL path.");
      } else if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else {
        toast.error("Failed to activate property");
      }
    }
  };
  
  const openRejectDialog = () => {
    setRejectionDialogOpen(true);
  };
  
  const closeRejectDialog = () => {
    setRejectionDialogOpen(false);
    setRejectionReason("");
  };
  
  const handleRejectProperty = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    
    try {
      const baseUrl = window.location.origin;
      await axios.patch(`${baseUrl}/api/admin/properties`, {
        id: propertyId,
        status: "REJECTED",
        rejectionReason,
      }, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      toast.success("Property rejection recorded");
      closeRejectDialog();
      fetchProperty();
    } catch (error: any) {
      console.error("Error rejecting property:", error);
      if (error.response?.status === 404) {
        toast.error("API endpoint not found. Please check the URL path.");
      } else if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else {
        toast.error("Failed to reject property");
      }
    }
  };
  
  const handleToggleFeatured = async () => {
    if (!property) return;
    
    try {
      const baseUrl = window.location.origin;
      await axios.put(`${baseUrl}/api/admin/properties`, {
        id: propertyId,
        featured: !property.featured,
      }, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      toast.success(property.featured ? "Property removed from featured" : "Property marked as featured");
      fetchProperty();
    } catch (error: any) {
      console.error("Error updating featured status:", error);
      if (error.response?.status === 404) {
        toast.error("API endpoint not found. Please check the URL path.");
      } else if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else {
        toast.error("Failed to update featured status");
      }
    }
  };
  
  const handleDeleteProperty = async () => {
    if (!window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }
    
    try {
      const baseUrl = window.location.origin;
      
      // Use query parameter instead of path parameter
      await axios.delete(`${baseUrl}/api/admin/properties?id=${propertyId}`, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      toast.success("Property deleted successfully");
      router.push("/admin/properties");
    } catch (error: any) {
      console.error("Error deleting property:", error);
      if (error.response?.status === 404) {
        toast.error("Property not found or already deleted");
      } else if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else {
        toast.error("Failed to delete property");
      }
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
        <p className="mb-6">The property you're looking for doesn't exist or has been removed.</p>
        <Link href="/admin/properties" className="text-primary hover:underline">
          Back to Properties
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/admin/properties"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </div>
      
      {showTeamMemberAlert && (
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Team Member Required</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>You need to be registered as a team member to verify properties.</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    href="/admin/team"
                    className="rounded-md bg-amber-50 px-2 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
                  >
                    Manage Team
                  </Link>
                  <button
                    type="button"
                    className="ml-3 rounded-md bg-amber-50 px-2 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
                    onClick={() => setShowTeamMemberAlert(false)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {property && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header with status and actions */}
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                {property.featured && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Featured</span>
                )}
                {property.listingType === "RENTAL" && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Rental Property</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  property.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                  property.status === "VERIFIED" ? "bg-blue-100 text-blue-800" :
                  property.status === "REJECTED" ? "bg-red-100 text-red-800" :
                  property.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                  property.status === "SOLD" ? "bg-purple-100 text-purple-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {property.status.charAt(0) + property.status.slice(1).toLowerCase()}
                </span>
                <span className="text-sm text-gray-500">
                  Added {new Date(property.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Status-specific actions */}
              {property.status === "PENDING" && (
                <>
                  <button 
                    onClick={verifyProperty}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Verify</span>
                  </button>
                  <button 
                    onClick={openRejectDialog}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center gap-1"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </>
              )}
              
              {property.status === "VERIFIED" && (
                <button 
                  onClick={activateProperty}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  <span>Activate</span>
                </button>
              )}
              
              {/* Always available actions */}
              <button 
                onClick={handleToggleFeatured}
                className={`px-3 py-1.5 ${property.featured ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'} text-white text-sm rounded-md transition-colors flex items-center gap-1`}
              >
                <Star className="h-4 w-4" fill={property.featured ? "currentColor" : "none"} />
                <span>{property.featured ? "Unfeature" : "Feature"}</span>
              </button>
              
              <button 
                onClick={handleDeleteProperty}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
          
          {/* Property details and images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Images */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Property Images</h2>
              {property.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {property.images.map((image, index) => (
                    <div key={index} className="relative aspect-video rounded-md overflow-hidden">
                      <Image 
                        src={image} 
                        alt={`Property image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No images available</p>
                </div>
              )}
            </div>
            
            {/* Property information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Property Details</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{formatPrice(property.price)}</dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Listing Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {property.listingType === "SALE" ? "For Sale" : "For Rent"}
                  </dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {property.type.charAt(0) + property.type.slice(1).toLowerCase()}
                  </dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Area</dt>
                  <dd className="mt-1 text-sm text-gray-900">{property.area} sq. ft.</dd>
                </div>
                
                {property.bedrooms && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Bedrooms</dt>
                    <dd className="mt-1 text-sm text-gray-900">{property.bedrooms}</dd>
                  </div>
                )}
                
                {property.bathrooms && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Bathrooms</dt>
                    <dd className="mt-1 text-sm text-gray-900">{property.bathrooms}</dd>
                  </div>
                )}
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{property.address}</dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">City</dt>
                  <dd className="mt-1 text-sm text-gray-900">{property.city?.name || 'Not specified'}</dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Owner</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {property.owner ? (
                      <div className="flex items-center">
                        <span>{property.owner.name} ({property.owner.email})</span>
                      </div>
                    ) : (
                      'Owner information not available'
                    )}
                  </dd>
                </div>

                {property.verifiedBy && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Verified By</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {property.verifiedBy.name} 
                      {property.verifiedAt && ` on ${new Date(property.verifiedAt).toLocaleDateString()}`}
                    </dd>
                  </div>
                )}
                
                {property.rejectionReason && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Rejection Reason</dt>
                    <dd className="mt-1 text-sm text-gray-900 p-3 bg-red-50 rounded-md">
                      {property.rejectionReason}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          {/* Description */}
          <div className="p-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
          </div>
        </div>
      )}

      {/* Rejection dialog */}
      {rejectionDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeRejectDialog}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Reject Property</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Please provide a reason for rejecting this property. This will be visible to the property owner.
                      </p>
                      <textarea
                        rows={4}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 mt-3 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                        placeholder="Rejection reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleRejectProperty}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeRejectDialog}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 