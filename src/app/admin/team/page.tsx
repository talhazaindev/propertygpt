"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MoreHorizontal, Plus, Edit, Trash2, Search, Filter, 
  UserCheck, Shield, Mail, Phone, MapPin, Building, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

// Type definition for team members
interface TeamMember {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  image?: string;
  city?: { id: string; name: string } | null;
  cityId?: string | null;
}

interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "AREA_MANAGER":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "PROPERTY_VERIFIER":
      return "bg-green-100 text-green-800 border-green-200";
    case "CONTENT_CREATOR":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "CUSTOMER_SUPPORT":
      return "bg-pink-100 text-pink-800 border-pink-200";
    case "INVENTORY_MANAGER":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatRoleDisplay = (role: string) => {
  return role.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

export default function TeamManagementPage() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  // Fetch team members from API
  const fetchTeamMembers = async (page = 1, role: string | null = null, query = "") => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/admin/team?page=${page}&limit=10`;
      
      if (role) {
        url += `&role=${role}`;
      }
      
      if (query) {
        url += `&query=${encodeURIComponent(query)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      
      const data = await response.json();
      setTeamMembers(data.teamMembers);
      setPaginationInfo(data.pagination);
      setCurrentPage(data.pagination.page);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members. Please try again later.');
      toast.error("Failed to fetch team members");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Handle role filter change
  const handleRoleFilterChange = (role: string | null) => {
    setSelectedRole(role);
    fetchTeamMembers(1, role, searchTerm);
  };
  
  // Handle search
  const handleSearch = () => {
    fetchTeamMembers(1, selectedRole, searchTerm);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    fetchTeamMembers(page, selectedRole, searchTerm);
  };

  const handleAddMember = () => {
    router.push("/admin/team/add");
  };

  const handleEditMember = (id: string) => {
    router.push(`/admin/team/edit/${id}`);
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm("Are you sure you want to delete this team member?")) {
      try {
        const response = await fetch(`/api/admin/team/${id}`, {
          method: "DELETE",
          headers: {
            'x-admin-auth': 'true'
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to delete team member");
        }
        
        toast.success("Team member deleted successfully");
        fetchTeamMembers(currentPage, selectedRole, searchTerm);
      } catch (error) {
        console.error("Error deleting team member:", error);
        toast.error("Failed to delete team member");
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/team/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'x-admin-auth': 'true'
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update team member status");
      }
      
      toast.success(`Team member ${!currentStatus ? "activated" : "deactivated"} successfully`);
      
      // Update the local state
      setTeamMembers(teamMembers.map(member => 
        member.id === id ? { ...member, isActive: !currentStatus } : member
      ));
    } catch (error) {
      console.error("Error updating team member status:", error);
      toast.error("Failed to update team member status");
    }
  };

  // Count members by role
  const getRoleCount = (role: string) => {
    return teamMembers.filter(member => member.role === role).length;
  };

  if (loading && teamMembers.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-800">Team Management</h1>
          <p className="text-slate-500">Manage and monitor your company team members</p>
        </div>
        <button
          onClick={handleAddMember}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-full flex items-center shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="h-5 w-5 mr-2" /> Add Team Member
        </button>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-indigo-100 p-3 mr-4">
            <UserCheck className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Total Members</div>
            <div className="text-2xl font-bold text-slate-800">{paginationInfo.total || 0}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Admin Level</div>
            <div className="text-2xl font-bold text-slate-800">
              {getRoleCount('SUPER_ADMIN') + getRoleCount('AREA_MANAGER')}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Building className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Property Team</div>
            <div className="text-2xl font-bold text-slate-800">
              {getRoleCount('PROPERTY_VERIFIER') + getRoleCount('INVENTORY_MANAGER')}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Support Team</div>
            <div className="text-2xl font-bold text-slate-800">
              {getRoleCount('CUSTOMER_SUPPORT') + getRoleCount('CONTENT_CREATOR')}
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white p-5 rounded-xl shadow-md mb-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Find Team Members</h2>
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
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="AREA_MANAGER">Area Manager</option>
              <option value="PROPERTY_VERIFIER">Property Verifier</option>
              <option value="CONTENT_CREATOR">Content Creator</option>
              <option value="CUSTOMER_SUPPORT">Customer Support</option>
              <option value="INVENTORY_MANAGER">Inventory Manager</option>
            </select>
          </div>
        </div>
        
        {isFilterExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select className="border border-slate-200 rounded-lg px-4 py-2 w-full">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <select className="border border-slate-200 rounded-lg px-4 py-2 w-full">
                <option value="all">All Cities</option>
                <option value="lahore">Lahore</option>
                <option value="karachi">Karachi</option>
                <option value="islamabad">Islamabad</option>
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

      {error && (
        <div className="bg-red-50 p-4 mb-6 rounded-xl border border-red-200 text-red-600 flex items-center">
          <div className="rounded-full bg-red-100 p-2 mr-3">
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span>{error}</span>
        </div>
      )}

      {teamMembers.length === 0 ? (
        <div className="bg-white p-16 rounded-xl shadow-md text-center flex flex-col items-center">
          <div className="rounded-full bg-slate-100 p-3 mb-3">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800">No team members found</h3>
          <p className="text-slate-500 mt-1 mb-6">Try adjusting your search or filter to find what you're looking for.</p>
          <button
            onClick={handleAddMember}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg flex items-center hover:bg-indigo-200 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Your First Team Member
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium mr-3">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="text-sm font-medium text-slate-800">{member.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClass(member.role)}`}>
                        {formatRoleDisplay(member.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        <Mail className="h-4 w-4 mr-2 text-slate-400" />
                        {member.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        <Phone className="h-4 w-4 mr-2 text-slate-400" />
                        {member.phoneNumber || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                        {member.city?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(member.id, member.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          member.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditMember(member.id)}
                          className="p-1.5 rounded-full text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
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
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {paginationInfo.pages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200">
              <div className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-700">{(paginationInfo.page - 1) * paginationInfo.limit + 1}</span> to <span className="font-medium text-slate-700">{Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}</span> of <span className="font-medium text-slate-700">{paginationInfo.total}</span> team members
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
      )}
    </div>
  );
}