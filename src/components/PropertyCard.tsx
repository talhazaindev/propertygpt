import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, Bed, Bath, Square, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    price: number;
    address: string;
    images: string[];
    bedrooms?: number | null;
    bathrooms?: number | null;
    area?: number | null;
    isVerified?: boolean;
    status?: string;
    contactPhone?: string;
  };
}

// Simple gray box data URI as final fallback
const FALLBACK_IMAGE = '/images/property-placeholder.svg';

export default function PropertyCard({ property }: PropertyCardProps) {
  // Format price to PKR with commas
  const formattedPrice = `PKR ${property.price.toLocaleString()}`;
  const [imgSrc, setImgSrc] = useState(property.images?.[0] || '/images/property-placeholder.jpg');
  
  const handlePhoneClick = (e: React.MouseEvent<HTMLButtonElement>, phone: string) => {
    e.preventDefault(); // Prevent link navigation
    window.open(`tel:${phone}`, '_self');
  };
  
  // Handle image error by trying fallbacks
  const handleImageError = () => {
    if (imgSrc !== '/images/property-placeholder.jpg') {
      // Try the local placeholder image
      setImgSrc('/images/property-placeholder.jpg');
    } else {
      // If that fails too, use the SVG
      setImgSrc(FALLBACK_IMAGE);
    }
  };
  
  return (
    <Link href={`/properties/${property.id}`} className="block">
      <div className="property-card hover-3d reveal">
        {/* Property Image */}
        <div className="relative h-56 w-full overflow-hidden">
          <Image 
            src={imgSrc}
            alt={property.title}
            fill
            unoptimized
            onError={handleImageError}
            className="object-cover transition-transform duration-700"
          />
          
          {/* Status badge */}
          {property.status && (
            <div className="absolute top-4 left-4 z-10">
              <span className="badge badge-secondary animate-pulse-glow">
                {property.status}
              </span>
            </div>
          )}
          
          {/* Verified badge */}
          {property.isVerified && (
            <div className="absolute top-4 right-4 z-10 bg-white rounded-full p-1.5 shadow-lg">
              <BadgeCheck className="h-5 w-5 text-secondary" />
            </div>
          )}
          
          {/* Property details overlay */}
          <div className="property-card-content">
            <h3 className="text-xl font-bold text-white mb-1">{property.title}</h3>
            <div className="flex items-center text-white/80 text-sm mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <p className="line-clamp-1">{property.address}</p>
            </div>
            <p className="text-xl font-bold gradient-text" data-text={formattedPrice}>{formattedPrice}</p>
          </div>
        </div>
        
        {/* Property Features */}
        <div className="p-5 bg-white">
          <div className="flex justify-between text-gray-600 text-sm mb-3">
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div className="flex items-center feature-icon">
                <Bed className="h-4 w-4 mr-1 text-primary" />
                <span>{property.bedrooms} Beds</span>
              </div>
            )}
            
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <div className="flex items-center feature-icon">
                <Bath className="h-4 w-4 mr-1 text-primary" />
                <span>{property.bathrooms} Baths</span>
              </div>
            )}
            
            {property.area !== null && property.area !== undefined && (
              <div className="flex items-center feature-icon">
                <Square className="h-4 w-4 mr-1 text-primary" />
                <span>{property.area} sqft</span>
              </div>
            )}
          </div>
          
          {/* Contact Phone */}
          {property.contactPhone && (
            <div className="mt-2 border-t pt-3">
              <button 
                onClick={(e) => handlePhoneClick(e, property.contactPhone!)}
                className="btn-primary flex items-center justify-center w-full py-2"
              >
                <Phone className="h-4 w-4 mr-2" />
                <span className="font-medium">Call {property.contactPhone}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
