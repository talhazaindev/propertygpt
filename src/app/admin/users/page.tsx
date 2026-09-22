"use client";

import { useState, useEffect } from "react";
import { 
  Search, Edit, Trash2, UserPlus, ChevronLeft, ChevronRight, 
  Filter, Shield, UserCheck, Mail, Phone, Calendar, MoreHorizontal 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Define User type
interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "BUYER" | "SELLER" | "AGENT" | "COMPANY_ADMIN";
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  image?: string;
}

interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  
  // Fetch users from API
  const fetchUsers = async (page = 1, role: string | null = null, query = "") => {
    setIsLoading(true);
    try {
      let url = `/api/admin/users?page=${page}&limit=10`;
      
      if (role) {
        url += `&role=${role}`;
      }
      
      if (query) {
        url += `&query=${encodeURIComponent(query)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      const data = await response.json();
      setUsers(data.users);
      setPaginationInfo(data.pagination);
      setCurrentPage(data.pagination.page);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Handle role filter change
  const handleRoleFilterChange = (role: string | null) => {
    setSelectedRole(role);
    fetchUsers(1, role, searchTerm);
  };
  
  // Handle search
  const handleSearch = () => {
    fetchUsers(1, selectedRole, searchTerm);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    fetchUsers(page, selectedRole, searchTerm);
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
        });
        
        if (!response.ok) {
          throw new Error("Failed to delete user");
        }
        
        toast.success("User deleted successfully");
        fetchUsers(currentPage, selectedRole, searchTerm);
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user");
      }
    }
  };
  
  // Handle user role update
  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user role");
      }
      
      toast.success("User role updated successfully");
      
      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  // Get role badge color
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "COMPANY_ADMIN":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "BUYER":
        return "bg-green-100 text-green-800 border-green-200";
      case "SELLER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "AGENT":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center p-16 h-64">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500">Manage and monitor all registered users</p>
        </div>
        <Link 
          href="/admin/users/create" 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-full flex items-center shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          <span>Add New User</span>
        </Link>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-indigo-100 p-3 mr-4">
            <UserCheck className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Total Users</div>
            <div className="text-2xl font-bold text-slate-800">{paginationInfo.total || 0}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Admins</div>
            <div className="text-2xl font-bold text-slate-800">
              {users.filter(u => u.role === 'ADMIN' || u.role === 'COMPANY_ADMIN').length}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <UserCheck className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Buyers</div>
            <div className="text-2xl font-bold text-slate-800">
              {users.filter(u => u.role === 'BUYER').length}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <UserCheck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Sellers</div>
            <div className="text-2xl font-bold text-slate-800">
              {users.filter(u => u.role === 'SELLER').length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white p-5 rounded-xl shadow-md mb-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Find Users</h2>
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="flex items-center text-slate-600 hover:text-indigo-600 text-sm transition-colors"
          >
            <Filter className="h-4 w-4 mr-1" />
            {isFilterExpanded ? "Less filters" : "More filters"}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-slate-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch} 
                className="absolute left-3 top-3 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div>
            <select
              className="border border-slate-200 rounded-lg px-4 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              value={selectedRole || ""}
              onChange={(e) => handleRoleFilterChange(e.target.value || null)}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="COMPANY_ADMIN">Company Admin</option>
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
              <option value="AGENT">Agent</option>
            </select>
          </div>
        </div>
        
        {isFilterExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Joined Date</label>
              <input 
                type="date" 
                className="border border-slate-200 rounded-lg px-4 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select className="border border-slate-200 rounded-lg px-4 py-2 w-full">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort By</label>
              <select className="border border-slate-200 rounded-lg px-4 py-2 w-full">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="nameAsc">Name (A-Z)</option>
                <option value="nameDesc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium mr-3">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="text-sm font-medium text-slate-800">{user.name || "N/A"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="h-4 w-4 mr-2 text-slate-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                        className={`text-sm border rounded-full px-3 py-1 ${getRoleBadgeClass(user.role)}`}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="COMPANY_ADMIN">Company Admin</option>
                        <option value="BUYER">Buyer</option>
                        <option value="SELLER">Seller</option>
                        <option value="AGENT">Agent</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone className="h-4 w-4 mr-2 text-slate-400" />
                      {user.phoneNumber || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="p-1.5 rounded-full text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 rounded-full text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button className="p-1.5 rounded-full text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-slate-100 p-3 mb-2">
                        <Search className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-800">No users found</h3>
                      <p className="text-slate-500 mt-1">Try adjusting your search or filter to find what you're looking for.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {paginationInfo.pages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-700">{(paginationInfo.page - 1) * paginationInfo.limit + 1}</span> to <span className="font-medium text-slate-700">{Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}</span> of <span className="font-medium text-slate-700">{paginationInfo.total}</span> users
            </div>
            <div className="flex items-center">
              <button
                onClick={() => handlePageChange(paginationInfo.page - 1)}
                disabled={paginationInfo.page === 1}
                className="mr-2 p-2 rounded-md border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: Math.min(5, paginationInfo.pages) }, (_, i) => {
                // Show pages around current page
                let pageNum = i + 1;
                if (paginationInfo.pages > 5) {
                  if (paginationInfo.page > 3) {
                    pageNum = paginationInfo.page - 3 + i;
                  }
                  if (pageNum > paginationInfo.pages) {
                    pageNum = paginationInfo.pages - (5 - i - 1);
                  }
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`mx-1 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      paginationInfo.page === pageNum 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    } transition-colors`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(paginationInfo.page + 1)}
                disabled={paginationInfo.page === paginationInfo.pages}
                className="ml-2 p-2 rounded-md border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 