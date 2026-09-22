"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  Trash2,
  CheckCircle,
  Phone,
  Building,
  XCircle,
  Plus,
  X,
  Camera,
} from "lucide-react";
import Link from "next/link";

export default function PostPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      
      const propertyData = response.data;
      setProperty(propertyData);
      setSelectedImages(propertyData.images || []);
      
      // If the property already has a contact number, pre-fill it
      if (propertyData.contactPhone) {
        setPhoneNumber(propertyData.contactPhone);
      }
    } catch (error: any) {
      console.error("Error fetching property:", error);
      toast.error("Failed to load property details. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    setNewImages((prev) => [...prev, ...files]);
    
    // Create preview URLs for the new images
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...newPreviewUrls]);
  };
  
  const handleRemoveExistingImage = (index: number) => {
    setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };
  
  const handleRemoveNewImage = (index: number) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(previewImages[index]);
    
    setNewImages(prevImages => prevImages.filter((_, i) => i !== index));
    setPreviewImages(prevUrls => prevUrls.filter((_, i) => i !== index));
  };
  
  const handlePostProperty = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please add a contact phone number");
      return;
    }
    
    if (selectedImages.length === 0 && newImages.length === 0) {
      toast.error("Please select at least one image for the property");
      return;
    }
    
    try {
      setIsUploading(true);
      const baseUrl = window.location.origin;
      
      // Create FormData object to handle file uploads
      const formData = new FormData();
      formData.append("id", propertyId);
      formData.append("status", "ACTIVE");
      formData.append("contactPhone", phoneNumber);
      
      // Append existing images that are still selected
      selectedImages.forEach((url, index) => {
        formData.append(`existingImages[${index}]`, url);
      });
      
      // Append new images
      newImages.forEach((file, index) => {
        formData.append(`newImages`, file);
      });
      
      // Update the property with new status, contact number and images
      await axios.post(`${baseUrl}/api/admin/properties/post`, formData, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success("Property posted successfully!");
      router.push("/admin/post-property");
    } catch (error: any) {
      console.error("Error posting property:", error);
      if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else {
        toast.error("Failed to post property. Please try again later.");
      }
    } finally {
      setIsUploading(false);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Property Not Found</h1>
        <p className="text-gray-600 mb-4">The property you are looking for does not exist or has been removed.</p>
        <Link href="/admin/post-property" className="flex items-center text-primary hover:text-primary-dark">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/admin/post-property"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Post Property</h2>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                property.status === "VERIFIED" 
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100" 
                  : "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
              }`}>
                {property.status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Property details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Property Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-gray-900 dark:text-white">
                    {property.title}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-gray-900 dark:text-white">
                    {formatPrice(property.price)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property Type</label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-gray-900 dark:text-white">
                    {property.type}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bedrooms</label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-gray-900 dark:text-white">
                    {property.bedrooms || "N/A"}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bathrooms</label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-gray-900 dark:text-white">
                    {property.bathrooms || "N/A"}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area</label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-gray-900 dark:text-white">
                    {property.area} sq ft
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-gray-900 dark:text-white">
                    {property.address}
                    {property.city && `, ${property.city.name}`}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-gray-900 dark:text-white h-32 overflow-y-auto">
                    {property.description}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone Number</label>
                  <div className="flex">
                    <div className="relative flex-grow">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter contact phone number"
                        className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This number will be displayed to users on the property listing</p>
                </div>
              </div>
            </div>
            
            {/* Right column - Images */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Property Images</h3>
              
              {/* Existing Images */}
              {selectedImages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedImages.map((image, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                          <Image
                            src={image}
                            alt={`Property image ${index + 1}`}
                            width={200}
                            height={150}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* New Images */}
              {previewImages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewImages.map((preview, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                          <Image
                            src={preview}
                            alt={`New property image ${index + 1}`}
                            width={200}
                            height={150}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upload new images */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center"
                >
                  <Camera className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Images</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Click to browse</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end">
          <div className="flex space-x-3">
            <Link
              href="/admin/post-property"
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handlePostProperty}
              disabled={isUploading}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 inline-block" />
                  Post Property
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 