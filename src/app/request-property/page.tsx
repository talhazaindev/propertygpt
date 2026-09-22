import { Metadata } from "next";
import { PropertyRequestForm } from "@/components/request/PropertyRequestForm";

export const metadata: Metadata = {
  title: "Request a Property | PropertyGPT",
  description: "Can't find what you're looking for? Submit a property request and we'll help you find your dream property.",
};

export default function RequestProperty() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Request a Property
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Can&apos;t find what you&apos;re looking for? Let us know your requirements and we&apos;ll help you find your dream property.
          </p>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <PropertyRequestForm />
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Our team will review your request and get back to you within 48 hours. 
            If you need immediate assistance, please contact us directly at <a href="mailto:contact@propertygpt.com" className="font-medium text-blue-600 hover:underline">contact@propertygpt.com</a>
          </p>
        </div>
      </div>
    </div>
  );
} 