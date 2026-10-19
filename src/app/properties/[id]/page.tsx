"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { BadgeCheck, Bed, Bath, Square, MapPin, Calendar, Phone, Mail, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import placeholderImage from '../../../../public/images/placeholder.js';

// Simple gray box data URI as final fallback
const FALLBACK_IMAGE = placeholderImage;

export default function PropertyDetailPage() {
  const routeParams = useParams();
  const id = routeParams.id as string;
  
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const baseUrl = window.location.origin;
        const response = await axios.get(`${baseUrl}/api/properties/${id}`);
        setProperty(response.data);
      } catch (error) {
        console.error("Error fetching property:", error);
        toast.error("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  // Format price
  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Crore PKR`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} Lac PKR`;
    } else {
      return `PKR ${price.toLocaleString()}`;
    }
  };

  // Handle image error by trying fallbacks
  const handleImageError = () => {
    if (!imgSrc || imgSrc !== '/images/property-placeholder.jpg') {
      // Try the local placeholder image
      setImgSrc('/images/property-placeholder.jpg');
    } else {
      // If that fails too, use the data URI
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-32 flex justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-32 flex justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">The property you are looking for does not exist or has been removed.</p>
          <Link href="/properties" className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors">
            Browse Other Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Property Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">{property.title}</h1>
          {property.status === "VERIFIED" || property.status === "ACTIVE" && (
            <BadgeCheck className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="h-5 w-5 mr-1" />
          <span>{property.address} {property.city && `, ${property.city.name}`}</span>
        </div>
        <div className="text-3xl font-bold text-primary">
          {formatPrice(property.price)}
        </div>
      </div>

      {/* Property Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="relative h-80 rounded-lg overflow-hidden">
          <Image
            src={imgSrc || property.images?.[activeImage] || '/images/property-placeholder.jpg'}
            alt={property.title}
            fill
            unoptimized
            className="object-cover"
            priority
            onError={handleImageError}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {property.images?.slice(0, 4).map((image: string, index: number) => (
            index !== activeImage && (
              <div 
                key={index} 
                className="relative h-[180px] rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setActiveImage(index)}
              >
                <Image
                  src={image}
                  alt={`${property.title} - image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            )
          ))}
        </div>
      </div>

      {/* Property Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Main Details */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Description</h2>
            <p className="text-gray-700 mb-6">{property.description}</p>
            
            <h2 className="text-xl font-bold mb-4">Property Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <Bed className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm text-gray-500">Bedrooms</span>
                <span className="font-bold">{property.bedrooms || 'N/A'}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <Bath className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm text-gray-500">Bathrooms</span>
                <span className="font-bold">{property.bathrooms || 'N/A'}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <Square className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm text-gray-500">Area</span>
                <span className="font-bold">
                  {property.area} sq ft
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm text-gray-500">Listed</span>
                <span className="font-bold">
                  {new Date(property.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              Contact for more details about this property.
            </p>
            
            {(() => {
              const contactNumber =
                property.contactPhone ||
                property.owner?.phoneNumber ||
                property.owner?.phone ||
                null;

              return contactNumber ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="bg-primary-light p-2 rounded-full mr-3">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium">{contactNumber}</div>
                    </div>
                  </div>
                  <a
                    href={`tel:${contactNumber}`}
                    className="block w-full bg-primary text-white text-center py-3 px-4 rounded-md hover:bg-primary-dark transition-colors"
                  >
                    Call Now
                  </a>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-700 text-sm">
                    Contact information will be available soon. Please check back later.
                  </p>
                </div>
              );
            })()}
            
            {property.owner && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold mb-2">Listed by</h3>
                <div className="flex items-center">
                  {property.owner.image ? (
                    <Image 
                      src={property.owner.image} 
                      alt={property.owner.name || 'Owner'} 
                      width={40} 
                      height={40} 
                      className="rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-gray-500">
                      {property.owner.name ? property.owner.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{property.owner.name || 'Anonymous'}</div>
                    <div className="text-sm text-gray-500">{property.owner.email}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 