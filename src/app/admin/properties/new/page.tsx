"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PropertyForm from "@/components/property/PropertyForm";
import { ArrowLeft } from "lucide-react";

export default function NewPropertyPage() {
  const router = useRouter();
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <Link 
          href="/admin/properties" 
          className="text-sm text-primary hover:text-primary-dark flex items-center mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Properties
        </Link>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Add New Property</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new property listing</p>
      </div>
      
      {/* Form */}
      <PropertyForm />
    </div>
  );
} 