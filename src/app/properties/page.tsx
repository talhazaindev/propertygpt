"use client";

import { useState, useEffect } from 'react';
import PropertyCard from '@/components/PropertyCard';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { PageHeader } from '@/components/ui/page-header';
import { EnhancedSection } from '@/components/ui/enhanced-section';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Search, Filter, SlidersHorizontal, Grid, List, ChevronLeft, ChevronRight, MapPin, Home, DollarSign, Bed, Bath, Square } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  images: string[];
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  status: string;
  type: string;
  city?: { id: string; name: string } | null;
}

interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for properties and filters
  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, pages: 0, page: 1, limit: 9 });
  const [isLoading, setIsLoading] = useState(true);
  const [cities, setCities] = useState<{id: string, name: string}[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [cityId, setCityId] = useState(searchParams.get('cityId') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  // Fetch properties based on filters
  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      // Only show verified or active properties
      params.append('status', 'VERIFIED,ACTIVE');
      
      // Add filters if they exist
      if (cityId) params.append('cityId', cityId);
      if (type) params.append('type', type);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (bedrooms) params.append('bedrooms', bedrooms);
      if (searchTerm) params.append('search', searchTerm);
      
      // Add sorting
      if (sortBy === 'price_low') {
        params.append('sortField', 'price');
        params.append('sortOrder', 'asc');
      } else if (sortBy === 'price_high') {
        params.append('sortField', 'price');
        params.append('sortOrder', 'desc');
      } else {
        // Default to newest
        params.append('sortField', 'createdAt');
        params.append('sortOrder', 'desc');
      }
      
      const baseUrl = window.location.origin;
      const response = await axios.get(`${baseUrl}/api/properties?${params.toString()}`);
      
      setProperties(response.data.properties);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch cities for filter dropdown
  const fetchCities = async () => {
    try {
      const baseUrl = window.location.origin;
      const response = await axios.get(`${baseUrl}/api/cities`);
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    // Reset to page 1 when applying new filters
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Update URL with filter parameters
    const params = new URLSearchParams();
    if (cityId) params.append('cityId', cityId);
    if (type) params.append('type', type);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (bedrooms) params.append('bedrooms', bedrooms);
    if (sortBy) params.append('sortBy', sortBy);
    if (searchTerm) params.append('search', searchTerm);
    
    // Update URL without refreshing the page
    const newUrl = `/properties${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl, { scroll: false });
    
    // Fetch properties with new filters
    fetchProperties();
  };

  // Clear filters
  const clearFilters = () => {
    setCityId('');
    setType('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setSortBy('newest');
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
    router.push('/properties', { scroll: false });
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchCities();
    fetchProperties();
  }, [pagination.page]);

  // Auto-apply filters when they change
  useEffect(() => {
    if (cities.length > 0) {
      const timeoutId = setTimeout(() => {
        applyFilters();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [cityId, type, minPrice, maxPrice, bedrooms, sortBy, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Enhanced Page Header */}
      <PageHeader
        title="Explore Properties"
        subtitle="Find your perfect property from our extensive collection of verified listings across Pakistan"
        breadcrumbs={[
          { label: 'Properties' }
        ]}
        background="gradient"
        actions={
          <div className="flex gap-3">
            <EnhancedButton
              variant="glass"
              icon={viewMode === 'grid' ? List : Grid}
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </EnhancedButton>
            <EnhancedButton
              variant="glass"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </EnhancedButton>
          </div>
        }
      />

      <EnhancedSection padding="lg" background="gray">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Filters Sidebar */}
          <div className={`lg:w-80 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <EnhancedCard variant="luxury" className="sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <SlidersHorizontal className="w-5 h-5 mr-2 text-primary" />
                  Filters
                </h2>
                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All
                </EnhancedButton>
              </div>
              
              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Properties
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search by title, location..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Location
                  </label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                  >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Home className="w-4 h-4 mr-1" />
                    Property Type
                  </label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="HOUSE">House</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="PLOT">Plot</option>
                    <option value="FARM_HOUSE">Farm House</option>
                    <option value="VILLA">Villa</option>
                  </select>
                </div>
                
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Price Range (PKR)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="number" 
                      placeholder="Min Price" 
                      className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Max Price" 
                      className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    Bedrooms
                  </label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </EnhancedCard>
          </div>
          
          {/* Properties Grid/List */}
          <div className="flex-1">
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-gray-600">
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Searching properties...
                  </div>
                ) : (
                  <span>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} properties
                  </span>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </div>
            </div>

            {/* Properties */}
            {isLoading ? (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <EnhancedCard variant="bordered" className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
                  <p>Try adjusting your search filters to find more properties.</p>
                </div>
                <EnhancedButton onClick={clearFilters} variant="outline">
                  Clear Filters
                </EnhancedButton>
              </EnhancedCard>
            ) : (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-6 reveal-stagger`}>
                {properties.map((property) => (
                  <div key={property.id} className="reveal">
                    <PropertyCard property={property} />
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex items-center justify-center space-x-2">
                <EnhancedButton
                  variant="outline"
                  icon={ChevronLeft}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </EnhancedButton>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }).map((_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <EnhancedButton
                        key={pageNum}
                        variant={pagination.page === pageNum ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </EnhancedButton>
                    );
                  })}
                </div>
                
                <EnhancedButton
                  variant="outline"
                  icon={ChevronRight}
                  iconPosition="right"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </EnhancedButton>
              </div>
            )}
          </div>
        </div>
      </EnhancedSection>
    </div>
  );
} 