"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Home, Users, UserCog, Building2, Settings, LogOut, 
  Menu, X, Bell, Search, ChevronDown, BarChart2, Layers, 
  FileText, MessageSquare, Calendar, Shield, UserCircle, Landmark, Upload, CircleDollarSign, BookOpen, ConstructionIcon, HardHat
} from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in as admin via localStorage
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const storedUser = localStorage.getItem("adminUser");
    
    if (storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse admin user", e);
      }
    }
    
    // If on login page, allow access
    if (pathname === "/admin/login") {
      setIsLoading(false);
      return;
    }
    
    if (!isAdmin) {
      // Redirect to admin login
      router.push("/admin/login");
    } else {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [pathname, router]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-white">Loading dashboard...</h2>
        </div>
      </div>
    );
  }
  
  // If on login page, render children directly
  if (pathname === "/admin/login") {
    return <div className="bg-slate-900">{children}</div>;
  }
  
  // If not authenticated, don't render anything (redirect handled by useEffect)
  if (!isAuthenticated) {
    return null;
  }
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminUser");
    router.push("/admin/login");
  };
  
  // Admin has logged in, show admin layout
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-5 left-5 z-50 p-2 rounded-full bg-indigo-600 shadow-lg text-white hover:bg-indigo-700 transition-all duration-200"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Admin Sidebar */}
      <div 
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out
        bg-gradient-to-br from-slate-900 to-indigo-900 shadow-xl overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-slate-800`}
      >
        <div className="py-8 px-4">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/" className="inline-flex items-center">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg">
                PG
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                PropertyGPT
              </span>
            </Link>
          </div>

          {/* Admin Panel Label */}
          <div className="mb-6 px-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                Admin Panel
              </h3>
              <span className="px-2 py-1 text-xs rounded-md bg-indigo-800 text-indigo-200">v1.2</span>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="px-4 mb-8">
            <div className="text-xs uppercase font-semibold text-indigo-400 tracking-wider mb-3">
              Main
            </div>
            
            <nav className="space-y-1.5">
              <Link
                href="/admin"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname === "/admin"
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <Home size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Dashboard</span>
              </Link>
              
              <Link
                href="/admin/users"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/admin/users")
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <Users size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Users</span>
              </Link>
              
              <Link
                href="/admin/team"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/admin/team")
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <UserCog size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Team</span>
              </Link>

              <Link
                href="/admin/properties"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/admin/properties")
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <Building2 size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Properties</span>
              </Link>

              <Link
                href="/admin/requests"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/admin/requests")
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <FileText size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Requests</span>
              </Link>

              <Link
                href="/admin/construction"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/admin/construction")
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <HardHat size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Construction</span>
              </Link>

              <Link
                href="/admin/post-property"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/admin/post-property")
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <Upload size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Post Property</span>
              </Link>

              <Link
                href="/admin/blogs"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/admin/blogs")
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <BookOpen size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Blogs</span>
              </Link>
            </nav>
          </div>

          {/* Analytics Section */}
          <div className="px-4 mb-8">
            <div className="text-xs uppercase font-semibold text-indigo-400 tracking-wider mb-3">
              Analytics
            </div>
            
            <nav className="space-y-1.5">
              <Link
                href="/admin/analytics/sales"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/admin/analytics/sales")
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <CircleDollarSign size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Sales</span>
              </Link>
              
              <Link
                href="/admin/analytics/traffic"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/admin/analytics/traffic")
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <Layers size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Traffic</span>
              </Link>
            </nav>
          </div>

          {/* Settings Section */}
          <div className="px-4">
            <div className="text-xs uppercase font-semibold text-indigo-400 tracking-wider mb-3">
              Settings
            </div>
            
            <nav className="space-y-1.5">
              <Link
                href="/admin/settings"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/admin/settings")
                    ? "bg-indigo-700/50 text-white shadow-md"
                    : "text-slate-300 hover:bg-indigo-800/30 hover:text-white"
                }`}
              >
                <Settings size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Settings</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full py-3 px-4 rounded-lg transition-all duration-200 text-red-300 hover:bg-red-900/30 hover:text-red-200"
              >
                <LogOut size={18} className="mr-3" strokeWidth={2.5} />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>

          {/* Pro Upgrade Banner */}
          <div className="mt-8 mx-4 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
            <h4 className="text-white font-semibold mb-1">Upgrade to Pro</h4>
            <p className="text-purple-200 text-sm mb-3">Get access to advanced analytics and features</p>
            <button className="w-full py-2 bg-white text-indigo-700 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-md border-b border-slate-200 py-3 px-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Search with enhanced styling */}
              <div className="relative w-64 lg:w-80">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-slate-50"
                />
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <Search size={18} className="transition-transform group-hover:scale-110" />
                </div>
              </div>
              
              {/* Quick Navigation Tabs */}
              <div className="hidden lg:flex items-center space-x-1">
                <button className="px-3 py-2 text-sm font-medium rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">Dashboard</button>
                <button className="px-3 py-2 text-sm font-medium rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">Properties</button>
                <button className="px-3 py-2 text-sm font-medium rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">Reports</button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick Actions Button */}
              <div className="hidden md:block">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
                  + Add New
                </button>
              </div>
              
              {/* Stats Button with indicator */}
              <div className="hidden sm:block">
                <button className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors group">
                  <BarChart2 size={20} className="transition-transform group-hover:scale-110" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </button>
              </div>
            
              {/* Notifications Dropdown */}
              <div className="relative">
                <button 
                  className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors group"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell size={20} className="transition-transform group-hover:scale-110" />
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white font-bold">3</span>
                  </span>
                </button>
                
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-2 border border-slate-200 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-semibold text-slate-800">Notifications</h3>
                      <div className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">3 new</div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-slate-50 border-l-4 border-indigo-500 transition-colors">
                        <div className="flex gap-3">
                          <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <Home size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">New property listing</p>
                            <p className="text-xs text-slate-500 mt-1">Villa in DHA Phase 5 was just listed</p>
                            <p className="text-xs text-slate-400 mt-1">2 minutes ago</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex gap-3">
                          <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                            <UserCircle size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">Team meeting</p>
                            <p className="text-xs text-slate-500 mt-1">Weekly review at 2:00 PM</p>
                            <p className="text-xs text-slate-400 mt-1">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex gap-3">
                          <div className="h-9 w-9 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                            <Settings size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">System update</p>
                            <p className="text-xs text-slate-500 mt-1">Version 1.2 is now live</p>
                            <p className="text-xs text-slate-400 mt-1">5 hours ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-slate-100 text-center">
                      <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Divider */}
              <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
              
              {/* User Profile Dropdown - Enhanced with animation */}
              <div className="relative">
                <button 
                  className="flex items-center space-x-2 focus:outline-none group"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-md ring-2 ring-white transition-transform group-hover:scale-105">
                    {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="hidden md:block text-sm">
                    <div className="font-medium text-slate-700">{adminUser?.name || 'Admin User'}</div>
                    <div className="text-slate-500">{adminUser?.role || 'Admin'}</div>
                  </div>
                  <ChevronDown size={16} className="hidden md:block text-slate-400 transition-transform group-hover:rotate-180" />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 border border-slate-200 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-800">{adminUser?.name || 'Admin User'}</p>
                      <p className="text-xs text-slate-500 mt-1">{adminUser?.email || 'Not signed in'}</p>
                    </div>
                    <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 transition-colors">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Your Profile
                      </div>
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 transition-colors">
                      <div className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </div>
                    </a>
                    <div className="border-t border-slate-100 my-1"></div>
                    <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors" onClick={handleLogout}>
                      <div className="flex items-center">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Secondary Navigation (optional) */}
          <div className="lg:hidden mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex space-x-1">
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-600 bg-indigo-50">Dashboard</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100">Properties</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100">Reports</button>
            </div>
            <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100 flex items-center">
              <BarChart2 size={14} className="mr-1" />
              Stats
            </button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-sm text-slate-500">
          <div className="flex justify-between items-center">
            <div>
              &copy; {new Date().getFullYear()} PropertyGPT. All rights reserved.
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">Privacy</a>
              <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">Terms</a>
              <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">Help</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 