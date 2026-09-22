"use client";

import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Bed, Bath, Square, MapPin } from "lucide-react";
import { useState } from "react";

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
    formattedPrice?: string;
  };
}

const FALLBACK_IMAGE = "/images/property-placeholder.svg";

function defaultFormatPrice(price: number): string {
  if (price >= 10_000_000) {
    return `PKR ${(price / 10_000_000).toFixed(2)} Cr`;
  }
  if (price >= 100_000) {
    return `PKR ${(price / 100_000).toFixed(1)} Lakh`;
  }
  return `PKR ${price.toLocaleString()}`;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const formattedPrice =
    property.formattedPrice || defaultFormatPrice(property.price);
  const [imgSrc, setImgSrc] = useState(
    property.images?.[0] || "/images/property-placeholder.jpg"
  );

  const handleImageError = () => {
    if (imgSrc !== "/images/property-placeholder.jpg") {
      setImgSrc("/images/property-placeholder.jpg");
    } else {
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={imgSrc}
          alt={property.title}
          fill
          onError={handleImageError}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {(property.isVerified ||
          property.status === "VERIFIED" ||
          property.status === "ACTIVE") && (
          <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5" />
            Title Verified
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg font-semibold leading-snug text-foreground line-clamp-2">
              {property.title}
            </h3>
            <div className="mt-1.5 flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{property.address}</span>
            </div>
          </div>
          <p className="shrink-0 font-semibold text-primary">{formattedPrice}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          {property.bedrooms != null && (
            <span className="inline-flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-primary" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-primary" />
              {property.bathrooms}
            </span>
          )}
          {property.area != null && (
            <span className="inline-flex items-center gap-1">
              <Square className="h-3.5 w-3.5 text-primary" />
              {property.area.toLocaleString()} sqft
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
