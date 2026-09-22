"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BookOpen, PlusCircle, Search, Filter, ArrowUpDown,
  Edit, Trash2, Eye, Calendar, Tag, User, ChevronLeft, ChevronRight
} from "lucide-react";
import Image from "next/image";

interface Blog {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage: string;
  tags: string[];
  status: string;
  createdAt: string;
  publishedAt: string | null;
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
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch blogs
  const fetchBlogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/admin/blogs?page=${pagination.page}&limit=${pagination.limit}`;
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      if (statusFilter !== "all") {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      
      url += `&sortBy=${sortField}&sortOrder=${sortOrder}`;
      
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
  }, [pagination.page, statusFilter, sortField, sortOrder]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pagination.page = 1; // Reset to first page on new search
    fetchBlogs();
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      setIsDeleting(id);
      try {
        const response = await fetch(`/api/admin/blogs/${id}`, {
          method: "DELETE",
        });
        
        if (!response.ok) {
          throw new Error("Failed to delete blog");
        }
        
        // Refresh the list
        fetchBlogs();
      } catch (err) {
        console.error("Error deleting blog:", err);
        setError("Failed to delete blog. Please try again.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Published</span>;
      case "DRAFT":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Draft</span>;
      case "ARCHIVED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Archived</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-500 mt-1">Manage your blog posts</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          <span>New Blog Post</span>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search size={18} />
            </div>
            <button type="submit" className="hidden">Search</button>
          </form>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center">
              <label htmlFor="status-filter" className="mr-2 text-sm text-gray-500">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Blogs table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-gray-700"
                    onClick={() => handleSort("title")}
                  >
                    Title
                    {sortField === "title" && (
                      <ArrowUpDown size={14} className={sortOrder === "asc" ? "transform rotate-180" : ""} />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-gray-700"
                    onClick={() => handleSort("publishedAt")}
                  >
                    Published
                    {sortField === "publishedAt" && (
                      <ArrowUpDown size={14} className={sortOrder === "asc" ? "transform rotate-180" : ""} />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      <span>Loading blogs...</span>
                    </div>
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-500">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 font-medium">No blogs found</p>
                    <p className="mt-1">Create your first blog post to get started.</p>
                    <Link
                      href="/admin/blogs/new"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Create Blog Post
                    </Link>
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {blog.coverImage ? (
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <Image
                              src={blog.coverImage}
                              alt={blog.title}
                              className="w-10 h-10 rounded-md object-cover"
                              width={40}
                              height={40}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                            <BookOpen size={16} className="text-gray-500" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{blog.summary}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(blog.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {blog.publishedAt ? formatDate(blog.publishedAt) : "Not published"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {blog.author?.image ? (
                          <div className="flex-shrink-0 h-8 w-8 relative">
                            <Image
                              src={blog.author.image}
                              alt={blog.author.name}
                              className="w-8 h-8 rounded-full"
                              width={32}
                              height={32}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={14} className="text-gray-500" />
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{blog.author?.name || "Unknown"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/blogs/${blog.slug}`}
                          className="text-gray-500 hover:text-indigo-600 p-1 rounded-full hover:bg-gray-100"
                          title="View"
                          target="_blank"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/admin/blogs/${blog.id}/edit`}
                          className="text-gray-500 hover:text-indigo-600 p-1 rounded-full hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          disabled={isDeleting === blog.id}
                          className={`text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-gray-100 ${
                            isDeleting === blog.id ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          title="Delete"
                        >
                          {isDeleting === blog.id ? (
                            <div className="animate-spin h-4 w-4 border-b-2 border-red-600 rounded-full"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && blogs.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.page === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.page === pagination.pages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {/* Page buttons */}
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
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNumber === pagination.page
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
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
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.pages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 