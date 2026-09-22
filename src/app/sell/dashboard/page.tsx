"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import PropertyCard from "@/components/property/PropertyCard";

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      axios
        .get(`/api/properties?userId=${user.id}`)
        .then((res) => setProperties(res.data.properties))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="w-full h-[70vh] flex items-center justify-center">
          <p className="text-gray-500">Loading your properties...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Property Listings</h1>
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">You have not listed any properties yet.</p>
        )}
      </div>
    </ProtectedRoute>
  );
} 