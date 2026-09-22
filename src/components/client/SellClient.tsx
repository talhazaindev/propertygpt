"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import PropertyForm from "@/components/property/PropertyForm";

export default function SellClient() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for authentication state to be determined
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

  if (isLoading) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (status === "authenticated") {
    return <PropertyForm />;
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 md:p-8 border border-gray-100 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-center text-gray-700">
          Please sign in to list your property for sale.
        </p>
        
        <div className="flex justify-center mt-6">
          <a 
            href="/login?callbackUrl=/sell" 
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In to Continue
          </a>
        </div>
      </div>
    </div>
  );
} 