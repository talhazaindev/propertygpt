"use client";

import { useEffect, useState } from "react";
import { 
  UserCircle, Home, CheckCircle, AlertCircle, Users, Settings, 
  TrendingUp, Briefcase, DollarSign, Building, BarChart2, Activity,
  Calendar, Clock, Eye, UserPlus, Plus
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";

interface AdminUser {
  name: string;
  email: string;
  role?: string;
}

interface Metrics {
  totalUsers: number;
  totalProperties: number;
  pendingProperties: number;
  totalSales: number;
  activeListings: number;
  teamMembers: number;
  monthlyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'property_listed' | 'property_sold' | 'property_approved' | 'property_rejected';
  title: string;
  subtitle: string;
  timestamp: string;
  timeAgo: string;
}

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    totalProperties: 0,
    pendingProperties: 0,
    totalSales: 0,
    activeListings: 0,
    teamMembers: 0,
    monthlyGrowth: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  
  const [stats, setStats] = useState({
    properties: 0,
    users: 0,
    pendingVerifications: 0,
    recentListings: 0
  });
  
  const [ownerIssues, setOwnerIssues] = useState({ 
    hasIssues: false,
    count: 0
  });
  
  // Get admin user info from localStorage and fetch dashboard data
  useEffect(() => {
    const adminUserJSON = localStorage.getItem("adminUser");
    if (adminUserJSON) {
      try {
        const userData = JSON.parse(adminUserJSON);
        setAdminUser(userData);
      } catch (error) {
        console.error("Error parsing admin user data:", error);
      }
    }
    
    // Fetch dashboard metrics
    const fetchDashboardData = async () => {
      try {
        let dashboardData: any = {
          totalProperties: 0,
          totalUsers: 0,
          pendingVerifications: 0,
          recentListings: 0,
          activeListings: 0,
          soldProperties: 0,
          teamMembers: 0,
          recentActivities: [],
        };

        try {
          const response = await axios.get('/api/admin/dashboard', {
            headers: {
              'x-admin-auth': 'true'
            },
            timeout: 10000
          });
          dashboardData = response.data;
          
          setStats({
            properties: dashboardData.totalProperties || 0,
            users: dashboardData.totalUsers || 0,
            pendingVerifications: dashboardData.pendingVerifications || 0,
            recentListings: dashboardData.recentListings || 0
          });

          if (dashboardData.propertiesWithOwnerIssues !== undefined) {
            setOwnerIssues({
              hasIssues: dashboardData.propertiesWithOwnerIssues > 0,
              count: dashboardData.propertiesWithOwnerIssues
            });
          }
        } catch (error) {
          console.error("Error fetching main dashboard data:", error);
          toast.error("Error loading dashboard stats");
        }
        
        setMetrics({
          totalUsers: dashboardData.totalUsers || 0,
          totalProperties: dashboardData.totalProperties || 0,
          pendingProperties: dashboardData.pendingVerifications || 0,
          totalSales: dashboardData.soldProperties || 0,
          activeListings: dashboardData.activeListings || 0,
          teamMembers: dashboardData.teamMembers || 0,
          monthlyGrowth: 0
        });

        setRecentActivities(dashboardData.recentActivities || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in dashboard data fetching:", error);
        toast.error("Failed to fetch dashboard data");
        setRecentActivities([]);
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Icon mapping for recent activities
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <UserCircle className="h-10 w-10 text-blue-500" />;
      case 'property_listed':
        return <Home className="h-10 w-10 text-emerald-500" />;
      case 'property_approved':
        return <CheckCircle className="h-10 w-10 text-green-500" />;
      case 'property_rejected':
        return <AlertCircle className="h-10 w-10 text-red-500" />;
      case 'property_sold':
        return <DollarSign className="h-10 w-10 text-purple-500" />;
      default:
        return <Activity className="h-10 w-10 text-gray-500" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-purple-600 border-gray-200"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading dashboard data...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome to your PropertyGPT admin dashboard</p>
        </div>
      </div>
      
      {/* Owner relationship issues alert */}
      {ownerIssues.hasIssues && (
        <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md shadow-sm">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-amber-800 font-medium text-lg">Database Integrity Issue Detected</h3>
              <p className="text-amber-700 mt-1">
                {ownerIssues.count} {ownerIssues.count === 1 ? 'property has' : 'properties have'} missing or invalid owner references.
                This may cause errors when viewing property details.
              </p>
              <div className="mt-3">
                <p className="text-sm text-amber-700 mb-2">To fix this issue, run the following command in your terminal:</p>
                <div className="bg-amber-100 rounded p-2 font-mono text-amber-800 text-sm">
                  npm run fix-owners
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 transition-all hover:shadow-md overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.totalUsers}</h3>
              <p className="text-xs text-green-600 mt-2 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+{metrics.monthlyGrowth}% this month</span>
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 transition-all hover:shadow-md overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Team Members</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.teamMembers}</h3>
              <p className="text-xs text-slate-500 mt-2">
                <span>Active contributors</span>
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Briefcase className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 transition-all hover:shadow-md overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Properties</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.totalProperties}</h3>
              <p className="text-xs text-emerald-600 mt-2 flex items-center">
                <span>{metrics.activeListings} active listings</span>
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <Building className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 transition-all hover:shadow-md overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-600/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Properties Sold</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.totalSales}</h3>
              <p className="text-xs text-orange-600 mt-2 flex items-center">
                <span>{metrics.pendingProperties} pending approval</span>
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Recent Activity</h2>
              <Link href="/admin/activity" className="text-sm text-indigo-600 hover:text-indigo-800">View all</Link>
            </div>
            
            <div className="divide-y divide-slate-100">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="px-6 py-5 flex">
                    <div className="mr-4">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-slate-800">{activity.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{activity.subtitle}</p>
                      <span className="text-xs text-slate-400 mt-2 block">{activity.timeAgo}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-slate-500">No recent activities to display</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Quick Actions and Team Members */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Quick Actions</h2>
            </div>
            
            <div className="px-6 py-4 divide-y divide-slate-100">
              <Link 
                href="/admin/properties/new"
                className="py-3 px-4 rounded-lg flex items-center hover:bg-slate-50 transition-colors mb-2"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                  <Home className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-slate-800">Add Property</span>
              </Link>
              
              <Link 
                href="/admin/users"
                className="py-3 px-4 rounded-lg flex items-center hover:bg-slate-50 transition-colors mb-2 mt-2"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-800">Manage Users</span>
              </Link>
              
              <Link 
                href="/admin/team/add"
                className="py-3 px-4 rounded-lg flex items-center hover:bg-slate-50 transition-colors mt-2"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-800">Add Team Member</span>
              </Link>
            </div>
          </div>
          
          {/* Team Members */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Team Members</h2>
              <Link href="/admin/team" className="text-sm text-indigo-600 hover:text-indigo-800">View all</Link>
            </div>
            
            <div className="divide-y divide-slate-100">
              {metrics.teamMembers > 0 ? (
                <TeamMembersList />
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-slate-500 mb-4">No team members added yet</p>
                  <Link 
                    href="/admin/team/add" 
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Team Member
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Inventory snapshot (live DB counts — no fake charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Inventory Snapshot</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500 mb-1">Total Properties</p>
              <p className="text-2xl font-semibold text-slate-800">{metrics.totalProperties}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500 mb-1">Active Listings</p>
              <p className="text-2xl font-semibold text-slate-800">{metrics.activeListings}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500 mb-1">Pending Review</p>
              <p className="text-2xl font-semibold text-slate-800">{metrics.pendingProperties}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500 mb-1">Sold</p>
              <p className="text-2xl font-semibold text-slate-800">{metrics.totalSales}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Operations Snapshot</h3>
          </div>
          
          <div className="space-y-5">
            {(() => {
              const reviewed =
                metrics.activeListings + metrics.totalSales + metrics.pendingProperties;
              const approvalRate =
                reviewed > 0
                  ? Math.round((metrics.activeListings / reviewed) * 100)
                  : 0;
              const soldRate =
                metrics.totalProperties > 0
                  ? Math.round((metrics.totalSales / metrics.totalProperties) * 100)
                  : 0;

              return (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">Active share of pipeline</span>
                      <span className="text-slate-600">{approvalRate}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                        style={{ width: `${approvalRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">Sold share of inventory</span>
                      <span className="text-slate-600">{soldRate}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
                        style={{ width: `${soldRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">Team members</span>
                      <span className="text-slate-600">{metrics.teamMembers}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">Registered users</span>
                      <span className="text-slate-600">{metrics.totalUsers}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

// TeamMembersList component
function TeamMembersList() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/admin/team?limit=5', {
          headers: {
            'x-admin-auth': 'true'
          }
        });
        
        if (response.data && response.data.teamMembers) {
          setTeamMembers(response.data.teamMembers);
        }
      } catch (error: any) {
        console.error('Error fetching team members:', error);
        setError(error.response?.data?.error || 'Failed to load team members.');
        
        // Show toast message only if there's a significant error, not just empty results
        if (error.response?.status >= 400) {
          toast.error("There was a problem loading team members. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamMembers();
  }, []);
  
  if (loading) {
    return (
      <div className="px-6 py-4 text-center">
        <div className="animate-pulse flex justify-center">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="px-6 py-4 text-center">
        <p className="text-red-500 mb-2">Error loading team members</p>
        <Link 
          href="/admin/team" 
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          View team management
        </Link>
      </div>
    );
  }
  
  if (teamMembers.length === 0) {
    return (
      <div className="px-6 py-4 text-center">
        <p className="text-slate-500">No team members found</p>
        <Link 
          href="/admin/team/add" 
          className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-800"
        >
          Add team member
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {teamMembers.map((member) => (
        <div key={member.id} className="px-6 py-4 flex items-center">
          <div className="mr-3">
            {member.image ? (
              <Image 
                src={member.image} 
                alt={member.name} 
                width={40} 
                height={40} 
                className="rounded-full" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-indigo-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-slate-800">{member.name}</h3>
            <p className="text-xs text-slate-500">{formatRoleDisplay(member.role)}</p>
          </div>
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {member.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
      <div className="px-6 py-3 bg-slate-50">
        <Link 
          href="/admin/team" 
          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center justify-center"
        >
          View all team members
        </Link>
      </div>
    </div>
  );
}

// Helper function for displaying roles
function formatRoleDisplay(role: string) {
  if (!role) return '';
  return role.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
} 