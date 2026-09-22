"use client";

import { useState, useEffect } from "react";
import { 
  Search, Filter, Download, LineChart, DollarSign, 
  ChevronLeft, ChevronRight, Calendar, MapPin, Home, User
} from "lucide-react";
import { toast } from "sonner";

// Types
interface Sale {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyType: string;
  area: string;
  city: string;
  price: number;
  commission: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  agentId: string | null;
  agentName: string | null;
  saleDate: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
}

interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userArea, setUserArea] = useState<string | null>(null);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  // Stats
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  
  // Get user info
  useEffect(() => {
    // In a real app, you would fetch this from your auth context or API
    const adminUser = localStorage.getItem("adminUser");
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        setUserRole(user.role || "SUPER_ADMIN");
        setUserArea(user.area || null);
      } catch (e) {
        console.error("Failed to parse admin user", e);
      }
    }
  }, []);

  // Fetch sales data with filters
  const fetchSales = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/admin/sales?page=${page}&limit=10`;
      
      if (selectedArea) {
        url += `&area=${encodeURIComponent(selectedArea)}`;
      }
      
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (dateRange.from) {
        url += `&from=${dateRange.from}`;
      }
      
      if (dateRange.to) {
        url += `&to=${dateRange.to}`;
      }
      
      // If user is Area Manager, restrict to their area
      if (userRole === "AREA_MANAGER" && userArea) {
        url += `&restricted_area=${encodeURIComponent(userArea)}`;
      }
      
      // Fetch data from API
      const response = await fetch(url, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch sales data");
      }
      
      const data = await response.json();
      
      // Set the fetched data
      setSales(data.sales || []);
      setPaginationInfo({
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 1,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10
      });
      setCurrentPage(data.pagination?.page || 1);
      
      // Set stats from API
      if (data.stats) {
        setTotalSales(data.stats.totalSales || 0);
        setTotalRevenue(data.stats.totalRevenue || 0);
        setTotalCommission(data.stats.totalCommission || 0);
        setMonthlySales(data.stats.monthlySales || 0);
      }
      
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError("Failed to load sales data. Please try again later.");
      toast.error("Failed to fetch sales data");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (userRole) {
      fetchSales();
    }
  }, [userRole]);

  // Handle search
  const handleSearch = () => {
    fetchSales(1);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    fetchSales(page);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading && sales.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-800">Sales Management</h1>
          <p className="text-slate-500">
            {userRole === "AREA_MANAGER" 
              ? `View and manage sales for ${userArea || 'your area'}`
              : "View and manage all property sales"}
          </p>
        </div>
        <button
          onClick={() => {}}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-full flex items-center shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <Download className="h-5 w-5 mr-2" /> Export Sales
        </button>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-indigo-100 p-3 mr-4">
            <Home className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Total Sales</div>
            <div className="text-2xl font-bold text-slate-800">{totalSales}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Total Revenue</div>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Total Commission</div>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(totalCommission)}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border border-slate-100 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <LineChart className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Monthly Sales</div>
            <div className="text-2xl font-bold text-slate-800">
              {monthlySales}
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white p-5 rounded-xl shadow-md mb-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Filter Sales</h2>
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
                placeholder="Search by property, buyer, seller..."
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
          
          {/* Only show area filter for Super Admin */}
          {userRole === "SUPER_ADMIN" && (
            <div>
              <select
                className="border border-slate-200 rounded-lg px-4 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                value={selectedArea || ""}
                onChange={(e) => setSelectedArea(e.target.value || null)}
              >
                <option value="">All Areas</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Faisalabad">Faisalabad</option>
              </select>
            </div>
          )}
          
          <div>
            <select
              className="border border-slate-200 rounded-lg px-4 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              value={selectedStatus || ""}
              onChange={(e) => setSelectedStatus(e.target.value || null)}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <button
            onClick={() => fetchSales(1)}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
        
        {isFilterExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
              <input
                type="date"
                className="border border-slate-200 rounded-lg px-4 py-2 w-full"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
              <input
                type="date"
                className="border border-slate-200 rounded-lg px-4 py-2 w-full"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              />
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
      
      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Buyer/Seller
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800">{sale.propertyName}</div>
                    <div className="text-xs text-slate-500">{sale.propertyType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800">{formatCurrency(sale.price)}</div>
                    <div className="text-xs text-slate-500">Commission: {formatCurrency(sale.commission)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                      {sale.area}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600">
                      <User className="h-4 w-4 mr-2 text-slate-400" />
                      <div>
                        <div className="font-medium">{sale.buyerName}</div>
                        <div className="text-xs text-slate-500">Seller: {sale.sellerName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(sale.status)}`}>
                      {sale.status === "COMPLETED" ? "Completed" : 
                       sale.status === "PENDING" ? "Pending" : "Cancelled"}
                    </span>
                  </td>
                </tr>
              ))}
              
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-slate-100 p-3 mb-2">
                        <Search className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-800">No sales found</h3>
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
              Showing <span className="font-medium text-slate-700">{(paginationInfo.page - 1) * paginationInfo.limit + 1}</span> to <span className="font-medium text-slate-700">{Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}</span> of <span className="font-medium text-slate-700">{paginationInfo.total}</span> sales
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