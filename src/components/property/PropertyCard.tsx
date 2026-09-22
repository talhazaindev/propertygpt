import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { BadgeCheck, Bed, Bath, Square, MapPin } from "lucide-react";
import { useState } from "react";

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    price: number;
    address: string;
    images: string[];
    area: number;
    createdAt: string;
    type?: string;
    propertyType?: string; 
    isVerified?: boolean;
    status?: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    areaUnit?: string;
    company?: { name: string } | null;
    owner?: { name: string; email?: string } | null;
    ownerId?: string;
  };
}

// Simple gray box data URI as final fallback
const FALLBACK_IMAGE = '/images/property-placeholder.svg';

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const [imgSrc, setImgSrc] = useState(property.images[0] || "/images/property-placeholder.jpg");
  
  // Handle image error by trying fallbacks
  const handleImageError = () => {
    if (imgSrc !== '/images/property-placeholder.jpg') {
      // Try the local placeholder image
      setImgSrc('/images/property-placeholder.jpg');
    } else {
      // If that fails too, use the data URI
      setImgSrc(FALLBACK_IMAGE);
    }
  };
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300">
      <div className="relative h-48 w-full">
        <Image
          src={imgSrc}
          alt={property.title}
          fill
          unoptimized
          onError={handleImageError}
          className="object-cover"
        />
        {property.isVerified && (
          <div className="absolute top-2 right-2 bg-white p-1 rounded-full">
            <BadgeCheck className="h-5 w-5 text-blue-600" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-primary text-white px-2 py-1 rounded text-sm">
          {property.propertyType || property.type || "Property"}
        </div>
      </div>
      
      <div className="p-4">
        <Link href={`/properties/${property.id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{property.title}</h3>
        </Link>
        
        <div className="mt-1 flex items-center text-gray-500">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm truncate">{property.address}</span>
        </div>
        
        <p className="mt-2 text-xl font-bold text-primary">
          {formatPrice(property.price)}
        </p>
        
        <div className="mt-3 flex justify-between">
          {property.bedrooms !== null && property.bedrooms !== undefined && (
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1 text-gray-600" />
              <span className="text-sm">{property.bedrooms} bed</span>
            </div>
          )}
          
          {property.bathrooms !== null && property.bathrooms !== undefined && (
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1 text-gray-600" />
              <span className="text-sm">{property.bathrooms} bath</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1 text-gray-600" />
            <span className="text-sm">{property.area} {property.areaUnit || 'sq ft'}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <div>
            {property.company?.name ? 
              `Listed by: ${property.company.name}` : 
              property.owner?.name ? 
                `Owner: ${property.owner.name}` :
                "Listed by: Unknown"
            }
          </div>
          <div>
            {formatDate(property.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard; 