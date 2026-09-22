"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  BookOpen, Search, Tag, Clock, User, ChevronLeft, ChevronRight 
} from "lucide-react";

interface Blog {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage: string;
  tags: string[];
  publishedAt: string;
  author: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

interface Pagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 9,
  });

  // Fetch blogs
  const fetchBlogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/blogs?page=${pagination.page}&limit=${pagination.limit}`;
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      if (selectedTag) {
        url += `&tag=${encodeURIComponent(selectedTag)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }
      
      const data = await response.json();
      setBlogs(data.blogs);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Failed to load blogs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBlogs();
  }, [pagination.page, selectedTag]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({...pagination, page: 1}); // Reset to first page on new search
    fetchBlogs();
  };

  // Handle tag click
  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? "" : tag);
    setPagination({...pagination, page: 1}); // Reset to first page on new tag filter
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-16 px-4 md:py-24">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Our Blog</h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90">
            Insights, guides, and news from our real estate experts
          </p>
          
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-10 max-w-xl mx-auto relative group">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-white/30 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white focus:shadow-lg transition-all duration-300"
            />
            <div className="absolute left-4 top-3.5 text-white/70">
              <Search size={20} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <button 
              type="submit" 
              className="absolute right-3 top-2 bg-white text-secondary hover:text-primary px-4 py-1.5 rounded-full hover:shadow-md transition-all duration-300 font-medium"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Blog Content */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {/* Active Filter Tag */}
        {selectedTag && (
          <div className="mb-8 flex items-center">
            <span className="text-gray-600 mr-2">Filtered by tag:</span>
            <span 
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-secondary-light text-secondary cursor-pointer hover:bg-opacity-80 transition-colors"
              onClick={() => setSelectedTag("")}
            >
              {selectedTag} <span className="ml-1">×</span>
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  <div className="mt-6 flex items-center">
                    <div className="h-10 w-10 rounded-full bg-slate-200 mr-3"></div>
                    <div>
                      <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-slate-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && blogs.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-16 w-16 text-secondary/30" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No blog posts found</h3>
            <p className="mt-1 text-gray-500">
              {selectedTag ? `No blogs with the tag "${selectedTag}"` : searchQuery ? `No results for "${searchQuery}"` : "Check back soon for new content!"}
            </p>
            {(selectedTag || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTag("");
                  setSearchQuery("");
                  fetchBlogs();
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary-dark transition-colors shadow-sm hover:shadow-md"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Blog grid */}
        {!isLoading && blogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Link 
                key={blog.id} 
                href={`/blogs/${blog.slug}`}
                className="group bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-4px]"
              >
                <div className="relative h-52 overflow-hidden">
                  {blog.coverImage ? (
                    <Image
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      width={400}
                      height={225}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary-light/20 to-secondary-light/20 flex items-center justify-center">
                      <BookOpen size={40} className="text-secondary/50" />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {blog.tags.slice(0, 3).map((tag) => (
                      <span 
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-light/50 text-secondary hover:bg-secondary-light transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          handleTagClick(tag);
                        }}
                      >
                        <Tag size={12} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-secondary transition-colors">
                    {blog.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {blog.summary}
                  </p>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center">
                      {blog.author?.image ? (
                        <div className="flex-shrink-0 h-8 w-8 relative">
                          <Image
                            src={blog.author.image}
                            alt={blog.author.name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
                            width={32}
                            height={32}
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 h-8 w-8 bg-secondary/10 rounded-full flex items-center justify-center">
                          <User size={14} className="text-secondary" />
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{blog.author?.name || "PropertyGPT Team"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-500 text-xs">
                      <Clock size={12} className="mr-1" />
                      {formatDate(blog.publishedAt)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && blogs.length > 0 && pagination.pages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium transition-colors duration-200 ${
                  pagination.page === 1
                    ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-secondary"
                }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              
              {Array.from({ length: pagination.pages }).map((_, index) => {
                const pageNumber = index + 1;
                
                // Display current page and adjacent pages
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.pages ||
                  Math.abs(pageNumber - pagination.page) <= 1
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPagination({ ...pagination, page: pageNumber })}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                        pageNumber === pagination.page
                          ? "z-10 bg-secondary/10 border-secondary text-secondary font-semibold"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-secondary"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                }
                
                // Add ellipsis
                if (
                  (pageNumber === 2 && pagination.page > 3) ||
                  (pageNumber === pagination.pages - 1 && pagination.page < pagination.pages - 2)
                ) {
                  return (
                    <span
                      key={pageNumber}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                      ...
                    </span>
                  );
                }
                
                return null;
              })}
              
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className={`relative inline-flex items-center px-3 py-2 rounded-r-md border text-sm font-medium transition-colors duration-200 ${
                  pagination.page === pagination.pages
                    ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-secondary"
                }`}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        )}
      </section>
    </main>
  );
} 