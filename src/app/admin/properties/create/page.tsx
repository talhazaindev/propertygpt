"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Property Form Schema
const propertySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  type: z.enum(["Apartment", "House", "Villa", "Land", "Commercial"]),
  price: z.number().min(1, "Price must be greater than 0"),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  area: z.number().min(1, "Area must be greater than 0"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  location: z.string().min(2, "Location area must be at least 2 characters"),
  features: z.array(z.string()).default([]),
  status: z.enum(["active", "pending", "rejected", "sold"]),
  featured: z.boolean().default(false),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function CreateProperty() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema) as any,
    defaultValues: {
      type: "Apartment",
      status: "pending",
      featured: false,
      bedrooms: 0,
      bathrooms: 0,
      features: [],
    },
  });

  const propertyType = watch("type");
  const isResidential = propertyType === "Apartment" || propertyType === "House" || propertyType === "Villa";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files);
      const newPreviews: string[] = [];
      
      newImages.forEach(image => {
        const previewUrl = URL.createObjectURL(image);
        newPreviews.push(previewUrl);
      });
      
      setImages(prev => [...prev, ...newImages]);
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...previewUrls];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImages(newImages);
    setPreviewUrls(newPreviews);
  };

  const addFeature = () => {
    if (featureInput.trim() !== "" && !features.includes(featureInput.trim())) {
      const newFeatures = [...features, featureInput.trim()];
      setFeatures(newFeatures);
      setValue("features", newFeatures);
      setFeatureInput("");
    }
  };

  const removeFeature = (feature: string) => {
    const newFeatures = features.filter(f => f !== feature);
    setFeatures(newFeatures);
    setValue("features", newFeatures);
  };

  const onSubmit: SubmitHandler<PropertyFormData> = (data) => {
    setIsSubmitting(true);
    
    try {
      // In a real app, this would be an API call to save the property
      // You would also upload the images
      console.log("Submitting property data:", data);
      console.log("Images to upload:", images);
      
      // Simulate API delay
      setTimeout(() => {
        // Success redirect
        router.push("/admin/properties");
      }, 1500);
    } catch (error) {
      console.error("Error submitting property:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/admin/properties" className="mr-4">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold">Add New Property</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Title*
              </label>
              <input
                type="text"
                {...register("title")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. Modern Apartment in DHA Phase 5"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description*
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Describe the property in detail..."
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type*
              </label>
              <select
                {...register("type")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="Land">Land</option>
                <option value="Commercial">Commercial</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (PKR)*
              </label>
              <input
                type="number"
                {...register("price", { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. 10000000"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>
            
            {isResidential && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    {...register("bedrooms", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                  />
                  {errors.bedrooms && (
                    <p className="mt-1 text-sm text-red-600">{errors.bedrooms.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    {...register("bathrooms", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                  />
                  {errors.bathrooms && (
                    <p className="mt-1 text-sm text-red-600">{errors.bathrooms.message}</p>
                  )}
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area (sq ft)*
              </label>
              <input
                type="number"
                {...register("area", { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. 1200"
                min="1"
              />
              {errors.area && (
                <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Location */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address*
              </label>
              <input
                type="text"
                {...register("address")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. House #123, Street #45"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City*
              </label>
              <input
                type="text"
                {...register("city")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. Lahore"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Area*
              </label>
              <input
                type="text"
                {...register("location")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. DHA Phase 5"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Features */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Features & Amenities</h2>
          <div className="mb-4">
            <div className="flex">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-l-md"
                placeholder="e.g. Swimming Pool, Garden, etc."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <button 
                type="button"
                onClick={addFeature}
                className="px-4 py-2 bg-primary text-white rounded-r-md"
              >
                Add
              </button>
            </div>
          </div>
          
          {features.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center text-sm"
                >
                  <span>{feature}</span>
                  <button 
                    type="button"
                    className="ml-2 text-gray-500 hover:text-red-500" 
                    onClick={() => removeFeature(feature)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Images */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Property Images</h2>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Upload multiple images
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB each)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>
          
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`} 
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Listing Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                {...register("featured")}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                Mark as Featured Property
              </label>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Link 
            href="/admin/properties" 
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-primary text-white rounded-md flex items-center ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-primary-dark"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                <span>Save Property</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 