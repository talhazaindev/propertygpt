"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  propertyClientSchema,
  PropertyFormValues,
  propertyTypes,
  propertyListingTypes,
  verificationDocumentTypes,
  verificationDocumentTypeLabels,
  validateImageFiles,
  validateVerificationDocument,
  type VerificationDocumentType,
} from "@/schemas/property";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, Camera, Home, Building, ChevronsRight, FileText } from "lucide-react";
import { City, getCities } from "@/lib/city-service";
import Image from "next/image";

interface PendingVerificationDocument {
  id: string;
  type: VerificationDocumentType;
  file: File;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verificationDocs, setVerificationDocs] = useState<PendingVerificationDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<VerificationDocumentType | "">("");
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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

  // Build image previews from local File[] state
  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  const handleImagesSelected = (files: FileList | null) => {
    setImageError(null);
    if (!files || files.length === 0) return;

    const nextFiles = [...imageFiles, ...Array.from(files)];
    const validationError = validateImageFiles(nextFiles);
    if (validationError) {
      setImageError(validationError);
      return;
    }

    setImageFiles(nextFiles);
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setImageError(validateImageFiles(next));
      return next;
    });
  };

  const clearPendingDocumentSelection = () => {
    setSelectedDocType("");
    setSelectedDocFile(null);
    const input = document.getElementById("verification-document-file") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const buildPendingDocument = (
    type: VerificationDocumentType,
    file: File
  ): PendingVerificationDocument => ({
    id: `${Date.now()}-${file.name}`,
    type,
    file,
  });

  const handleAddVerificationDocument = () => {
    setDocError(null);

    const validationError = validateVerificationDocument(selectedDocType, selectedDocFile);
    if (validationError || !selectedDocType || !selectedDocFile) {
      setDocError(validationError || "Please select a document type and file.");
      return;
    }

    setVerificationDocs((prev) => [
      ...prev,
      buildPendingDocument(selectedDocType, selectedDocFile),
    ]);
    clearPendingDocumentSelection();
  };

  // Handle form submission
  const onSubmit = async (data: PropertyFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      setDocError(null);
      setImageError(null);

      const imageValidationError = validateImageFiles(imageFiles);
      if (imageValidationError) {
        setImageError(imageValidationError);
        setError(imageValidationError);
        setIsSubmitting(false);
        return;
      }

      // Include any type+file still sitting in the picker (user may skip "Add Document")
      let docsToUpload = [...verificationDocs];
      if (selectedDocType || selectedDocFile) {
        const pendingError = validateVerificationDocument(selectedDocType, selectedDocFile);
        if (pendingError) {
          setDocError(pendingError);
          setError(pendingError);
          setIsSubmitting(false);
          return;
        }
        if (selectedDocType && selectedDocFile) {
          docsToUpload = [
            ...docsToUpload,
            buildPendingDocument(selectedDocType, selectedDocFile),
          ];
        }
      }

      if (docsToUpload.length === 0) {
        setDocError("At least one verification document is required.");
        setError("Please upload at least one verification document.");
        setIsSubmitting(false);
        return;
      }
      
      const formData = new FormData();
      
      // Add text and numeric fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Add image files from local state (avoids FileList/RHF issues)
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      // Add verification documents
      formData.append(
        "verificationDocumentTypes",
        JSON.stringify(docsToUpload.map((doc) => doc.type))
      );
      docsToUpload.forEach((doc) => {
        formData.append("verificationDocuments", doc.file);
      });
      
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
      
      console.log(`Submitting form to ${url} via ${method}`, {
        images: imageFiles.length,
        verificationDocuments: docsToUpload.length,
      });
      
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
              errorMessage = errorData.error.map((err: { message?: string }) => 
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
          setImageFiles([]);
          setPreviewUrls([]);
          setImageError(null);
          setVerificationDocs([]);
          clearPendingDocumentSelection();
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
              <span>Manzil By AlWahabCo</span>
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
              Property Images*
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              At least one image is required.
            </p>
            <div className="mt-2">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  imageError ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                } transition-colors`}
              >
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    handleImagesSelected(e.target.files);
                    // Allow selecting the same file again later
                    e.target.value = "";
                  }}
                  disabled={isSubmitting}
                />
                <label htmlFor="images" className={`block ${isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload images of your property
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, or WEBP (max 5MB per image)
                  </p>
                </label>
              </div>
              
              {imageError && (
                <p className="mt-1 text-sm text-red-600">{imageError}</p>
              )}
              
              {/* Image previews */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {previewUrls.length} {previewUrls.length === 1 ? 'image' : 'images'} selected:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative rounded-lg overflow-hidden h-36 bg-gray-100">
                        <Image
                          src={url}
                          alt={`Property image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
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

          {/* Verification Documents Section */}
          <div>
            <h2 className="text-xl font-semibold pb-2 border-b border-gray-200 mb-4">
              Verification Documents*
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Select a document type and file, then click Add Document (or submit directly). PDF or JPEG, max 25MB.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <label htmlFor="verification-document-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type*
                </label>
                <select
                  id="verification-document-type"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as VerificationDocumentType | "")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                  disabled={isSubmitting}
                >
                  <option value="">Select document type</option>
                  {verificationDocumentTypes.map((type) => (
                    <option key={type} value={type}>
                      {verificationDocumentTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="verification-document-file" className="block text-sm font-medium text-gray-700 mb-1">
                  Document File*
                </label>
                <input
                  id="verification-document-file"
                  type="file"
                  accept="application/pdf,image/jpeg,.pdf,.jpg,.jpeg"
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white hover:file:opacity-90"
                  onChange={(e) => {
                    setDocError(null);
                    setSelectedDocFile(e.target.files?.[0] ?? null);
                  }}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">PDF or JPEG only (max 25MB)</p>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddVerificationDocument}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <Upload className="h-4 w-4" />
                  Add Document
                </button>
              </div>
            </div>

            {docError && (
              <p className="mt-2 text-sm text-red-600">{docError}</p>
            )}

            {verificationDocs.length > 0 && (
              <ul className="mt-4 space-y-2">
                {verificationDocs.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {verificationDocumentTypeLabels[doc.type]}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{doc.file.name}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setVerificationDocs((prev) => prev.filter((item) => item.id !== doc.id))
                      }
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={isSubmitting}
                      aria-label="Remove document"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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