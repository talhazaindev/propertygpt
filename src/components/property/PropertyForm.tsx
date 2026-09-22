"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertyClientSchema, PropertyFormValues, propertyTypes, propertyListingTypes } from "@/schemas/property";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, Camera, Home, Building, ChevronsRight } from "lucide-react";
import { City, getCities } from "@/lib/city-service";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface PropertyFormProps {
  editMode?: boolean;
  propertyId?: string;
  initialData?: Partial<PropertyFormValues>;
}

export default function PropertyForm({ 
  editMode = false, 
  propertyId,
  initialData 
}: PropertyFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageLoadingProgress, setImageLoadingProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyClientSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      price: undefined,
      type: undefined,
      listingType: "SALE",
      bedrooms: undefined,
      bathrooms: undefined,
      area: undefined,
      address: "",
      cityId: "",
    }
  });

  // Fetch cities for dropdown
  useEffect(() => {
    async function loadCities() {
      try {
        const cityData = await getCities();
        setCities(cityData);
      } catch (err) {
        console.error("Failed to load cities:", err);
        setError("Failed to load city data. Please try again.");
      }
    }
    
    loadCities();
  }, []);

  // Watch selected files for preview
  const watchedImages = watch("images");
  
  useEffect(() => {
    if (watchedImages && watchedImages.length > 0) {
      setIsImageLoading(true);
      setImageLoadingProgress(10);
      const newPreviewUrls: string[] = [];
      
      try {
        console.log("Images selected:", watchedImages.length);
        
        // Simulate loading progress - in a real app this would be tied to actual upload progress
        const progressInterval = setInterval(() => {
          setImageLoadingProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 100);
        
        // Log all files in the FileList for debugging
        for (let i = 0; i < watchedImages.length; i++) {
          const file = watchedImages[i];
          console.log(`Image ${i + 1} details:`, {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
          });
        }
        
        Array.from(watchedImages).forEach((file, index) => {
          console.log(`Processing image ${index + 1}:`, file.name, file.type, file.size);
          const url = URL.createObjectURL(file);
          newPreviewUrls.push(url);
        });
        
        setPreviewUrls(newPreviewUrls);
        console.log(`Generated ${newPreviewUrls.length} preview URLs:`, newPreviewUrls);
        
        // Complete the loading
        setTimeout(() => {
          clearInterval(progressInterval);
          setImageLoadingProgress(100);
          setIsImageLoading(false);
        }, 500);
        
        // Clean up URLs when component unmounts
        return () => {
          clearInterval(progressInterval);
          newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
        };
      } catch (error) {
        console.error("Error processing selected images:", error);
        setError(`There was a problem processing your images: ${error instanceof Error ? error.message : String(error)}`);
        setIsImageLoading(false);
      }
    }
  }, [watchedImages]);

  // Handle form submission
  const onSubmit = async (data: PropertyFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      console.log("Form submission started with data:", { 
        ...data, 
        images: data.images ? `${data.images.length} files` : "no images" 
      });
      
      const formData = new FormData();
      
      // Add text and numeric fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "images" && value !== undefined) {
          formData.append(key, String(value));
          console.log(`Added field ${key}:`, value);
        }
      });
      
      // Add image files
      if (data.images && data.images.length > 0) {
        console.log(`Processing ${data.images.length} images for upload`);
        try {
          // Log the FileList object itself
          console.log("FileList object:", data.images);
          
          // Directly append each file from the FileList
          for (let i = 0; i < data.images.length; i++) {
            const file = data.images[i];
            formData.append("images", file);
            console.log(`Added image ${i + 1} to FormData:`, file.name, file.size, file.type);
          }
          
          // Verify formData contents
          console.log("FormData entries:");
          for (const pair of formData.entries()) {
            console.log(pair[0], pair[1] instanceof File ? `File: ${(pair[1] as File).name}` : pair[1]);
          }
        } catch (error) {
          console.error("Error processing images for FormData:", error);
          setError(`Failed to process images: ${error instanceof Error ? error.message : String(error)}`);
          setIsSubmitting(false);
          return;
        }
      } else {
        console.warn("No images provided for upload");
      }
      
      // Set up progress tracking (simulated for now)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 200);
      
      // Submit property data
      const url = editMode && propertyId 
        ? `/api/properties/${propertyId}` 
        : "/api/properties";
      
      const method = editMode ? "PATCH" : "POST";
      
      console.log(`Submitting form to ${url} via ${method}`);
      
      try {
        const response = await fetch(url, {
          method,
          body: formData,
        });
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        console.log("Server response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Server returned error:", errorData);
          
          // Enhanced error handling
          let errorMessage = "Failed to submit property";
          if (errorData && errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (Array.isArray(errorData.error)) {
              // Handle array of errors
              errorMessage = errorData.error.map((err: any) => 
                err.message || JSON.stringify(err)
              ).join(", ");
            } else if (typeof errorData.error === 'object') {
              // Handle object error
              errorMessage = Object.values(errorData.error)
                .map(val => String(val))
                .join(", ");
            }
          }
          
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log("Submission successful:", result);
        
        setSuccess(editMode 
          ? "Property updated successfully!" 
          : "Property submitted successfully! It will be reviewed soon."
        );
        
        // Reset form if not editing
        if (!editMode) {
          reset();
          setPreviewUrls([]);
        }
        
        // Redirect after successful submission
        setTimeout(() => {
          router.push(editMode 
            ? `/sell/properties/${propertyId}` 
            : "/sell/dashboard"
          );
        }, 2000);
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Network error during submission");
      }
    } catch (err) {
      console.error("Property submission error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-xl p-6 md:p-8 border border-gray-100">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {editMode ? "Update Your Property" : "List Your Property"}
          </h1>
          <p className="text-gray-600">
            {editMode 
              ? "Update the details of your property listing" 
              : "Fill in the details to get started with your property listing"
            }
          </p>
          
          {/* Breadcrumb */}
          <div className="flex items-center mt-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Home className="h-4 w-4 mr-1" />
              <span>PropertyGPT</span>
            </span>
            <ChevronsRight className="h-4 w-4 mx-1" />
            <span className="flex items-center">
              <Building className="h-4 w-4 mr-1" />
              <span>Sell</span>
            </span>
            <ChevronsRight className="h-4 w-4 mx-1" />
            <span className="text-primary font-medium">
              {editMode ? "Edit Property" : "New Listing"}
            </span>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p>{success}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <h2 className="text-xl font-semibold pb-2 border-b border-gray-200 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title*
                </label>
                <input
                  id="title"
                  {...register("title")}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Modern 3 Bedroom Apartment in Gulberg"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description*
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  rows={4}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Describe your property in detail..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (PKR)*
                </label>
                <input
                  id="price"
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary ${
                    errors.price ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., 25000000"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type*
                </label>
                <select
                  id="type"
                  {...register("type")}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary ${
                    errors.type ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select property type</option>
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="listingType" className="block text-sm font-medium text-gray-700 mb-1">
                  Listing Type*
                </label>
                <select
                  id="listingType"
                  {...register("listingType")}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary ${
                    errors.listingType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {propertyListingTypes.map((listingType) => (
                    <option key={listingType} value={listingType}>
                      {listingType === "SALE" ? "For Sale" : "For Rent"}
                    </option>
                  ))}
                </select>
                {errors.listingType && (
                  <p className="mt-1 text-sm text-red-600">{errors.listingType.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Property Details Section */}
          <div>
            <h2 className="text-xl font-semibold pb-2 border-b border-gray-200 mb-4">
              Property Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrooms
                </label>
                <input
                  id="bedrooms"
                  type="number"
                  {...register("bedrooms", { valueAsNumber: true })}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary ${
                    errors.bedrooms ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., 3"
                />
                {errors.bedrooms && (
                  <p className="mt-1 text-sm text-red-600">{errors.bedrooms.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Bathrooms
                </label>
                <input
                  id="bathrooms"
                  type="number"
                  {...register("bathrooms", { valueAsNumber: true })}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary ${
                    errors.bathrooms ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., 2"
                />
                {errors.bathrooms && (
                  <p className="mt-1 text-sm text-red-600">{errors.bathrooms.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                  Area (sq ft)*
                </label>
                <input
                  id="area"
                  type="number"
                  {...register("area", { valueAsNumber: true })}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary ${
                    errors.area ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., 1200"
                />
                {errors.area && (
                  <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Location Section */}
          <div>
            <h2 className="text-xl font-semibold pb-2 border-b border-gray-200 mb-4">
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cityId" className="block text-sm font-medium text-gray-700 mb-1">
                  City*
                </label>
                <select
                  id="cityId"
                  {...register("cityId")}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary ${
                    errors.cityId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}, {city.province}
                    </option>
                  ))}
                </select>
                {errors.cityId && (
                  <p className="mt-1 text-sm text-red-600">{errors.cityId.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address*
                </label>
                <input
                  id="address"
                  {...register("address")}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., 23 Gulberg III, Lahore"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Images Section */}
          <div>
            <h2 className="text-xl font-semibold pb-2 border-b border-gray-200 mb-4">
              Property Images
              <span className="text-gray-500 text-sm font-normal ml-2">(Optional)</span>
            </h2>
            <div className="mt-2">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  errors.images ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                } transition-colors`}
              >
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  {...register("images")}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      try {
                        setValue("images", e.target.files as any);
                      } catch (error) {
                        console.error("Error setting image files:", error);
                        setError("Failed to process the selected images. Please try again with different images.");
                      }
                    }
                  }}
                  disabled={isImageLoading}
                />
                <label htmlFor="images" className={`block ${isImageLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isImageLoading ? "Processing images..." : "Click to upload images of your property"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, or WEBP (max 5MB per image)
                  </p>
                </label>
              </div>
              
              {/* Image loading progress */}
              {isImageLoading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${imageLoadingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    Processing images: {imageLoadingProgress}%
                  </p>
                </div>
              )}
              
              {errors.images && (
                <p className="mt-1 text-sm text-red-600">{errors.images.message as string}</p>
              )}
              
              {/* Image previews */}
              {previewUrls.length > 0 && !isImageLoading && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {previewUrls.length} {previewUrls.length === 1 ? 'image' : 'images'} selected:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden h-36 bg-gray-100">
                        <Image
                          src={url}
                          alt={`Property image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              // Remove this image from preview
                              const newPreviewUrls = [...previewUrls];
                              newPreviewUrls.splice(index, 1);
                              setPreviewUrls(newPreviewUrls);
                              
                              // Also remove from the form data
                              if (watchedImages) {
                                const dt = new DataTransfer();
                                Array.from(watchedImages)
                                  .filter((_, i) => i !== index)
                                  .forEach(file => dt.items.add(file));
                                setValue("images", dt.files as any);
                              }
                            } catch (error) {
                              console.error("Error removing image:", error);
                              setError("There was a problem removing the image.");
                            }
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Submission Section */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 mr-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>{editMode ? "Updating..." : "Submitting..."}</span>
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>{editMode ? "Update Property" : "Submit Property"}</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Upload progress bar (shown when submitting) */}
            {isSubmitting && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 