"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Image as ImageIcon, Tag, X, FileText, Upload as UploadIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const blogStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
type BlogStatus = typeof blogStatuses[number];

interface BlogFormData {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  status: BlogStatus;
  coverImage: string;
  images: string[];
}

export default function NewBlogPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    content: "",
    summary: "",
    tags: [],
    status: "DRAFT",
    coverImage: "",
    images: [],
  });

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Add a tag
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    
    // Don't add duplicate tags
    if (formData.tags.includes(newTag.trim())) {
      setNewTag("");
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()],
    }));
    setNewTag("");
    
    // Clear error when user adds a tag
    if (errors.tags) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.tags;
        return newErrors;
      });
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle cover image upload
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        coverImage: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle multiple image upload
  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, reader.result as string],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove an image
  const handleRemoveImage = (imageToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((image) => image !== imageToRemove),
    }));
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.trim().length < 100) {
      newErrors.content = "Content must be at least 100 characters";
    }
    
    if (!formData.summary.trim()) {
      newErrors.summary = "Summary is required";
    } else if (formData.summary.trim().length < 20 || formData.summary.trim().length > 300) {
      newErrors.summary = "Summary must be between 20 and 300 characters";
    }
    
    if (formData.tags.length === 0) {
      newErrors.tags = "At least one tag is required";
    }
    
    if (!formData.coverImage) {
      newErrors.coverImage = "Cover image is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          throw new Error("Failed to create blog");
        }
      } else {
        // Redirect to blogs page on success
        router.push("/admin/blogs");
      }
    } catch (error) {
      console.error("Error creating blog:", error);
      setErrors({
        form: "Failed to create blog. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/blogs"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to blogs
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Blog Post</h1>
        <p className="text-gray-500 mt-1">Fill in the details to create a new blog post</p>
      </div>
      
      {errors.form && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{errors.form}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter blog title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>
          
          {/* Summary */}
          <div className="mb-6">
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
              Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              rows={2}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.summary ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter a brief summary of your blog post"
            />
            {errors.summary && <p className="mt-1 text-sm text-red-500">{errors.summary}</p>}
            <p className="mt-1 text-xs text-gray-500">20-300 characters, displayed at the top of your blog</p>
          </div>
          
          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  <Tag size={14} className="mr-1" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 p-1 rounded-full hover:bg-indigo-200"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                id="newTag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Add a tag (e.g. Real Estate, Investment)"
                onKeyDown={(e) => e.key === "Enter" && handleAddTag(e)}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            {errors.tags && <p className="mt-1 text-sm text-red-500">{errors.tags}</p>}
          </div>
          
          {/* Cover Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image <span className="text-red-500">*</span>
            </label>
            {formData.coverImage ? (
              <div className="mb-2 relative">
                <Image
                  src={formData.coverImage}
                  alt="Cover"
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, coverImage: "" }))}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-red-500 hover:bg-red-100"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => coverImageInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <ImageIcon size={32} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload cover image</p>
              </div>
            )}
            <input
              type="file"
              ref={coverImageInputRef}
              onChange={handleCoverImageUpload}
              accept="image/*"
              className="hidden"
            />
            {errors.coverImage && <p className="mt-1 text-sm text-red-500">{errors.coverImage}</p>}
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={10}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Write your blog content here..."
            />
            {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
            <p className="mt-1 text-xs text-gray-500">You can use HTML tags for formatting</p>
          </div>
          
          {/* Additional Images */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Images
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <Image
                    src={image}
                    alt={`Image ${index + 1}`}
                    width={200}
                    height={150}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image)}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-red-500 hover:bg-red-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <UploadIcon size={24} className="text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">Add more images</p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImagesUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>
          
          {/* Status */}
          <div className="mb-6">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {formData.status === "PUBLISHED"
                ? "Blog will be visible to everyone immediately"
                : formData.status === "DRAFT"
                ? "Blog will be saved as a draft and can be published later"
                : "Blog will be archived and not visible to anyone"}
            </p>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <Link
            href="/admin/blogs"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Blog Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 