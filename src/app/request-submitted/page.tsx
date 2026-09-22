import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Request Submitted | PropertyGPT",
  description: "Your property request has been submitted successfully.",
};

export default function RequestSubmitted() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Request Submitted!
        </h1>
        
        <p className="mt-4 text-lg text-gray-600">
          Thank you for submitting your property request. Our team will review your requirements and get back to you within 48 hours.
        </p>
        
        <div className="mt-8 space-y-4">
          <p className="text-sm text-gray-500">
            Your request has been added to our database. Our property specialists will begin searching for properties that match your criteria.
          </p>
          
          <p className="text-sm text-gray-500">
            If you have any additional information or questions, please feel free to contact us at <a href="mailto:contact@propertygpt.com" className="font-medium text-blue-600 hover:underline">contact@propertygpt.com</a>
          </p>
        </div>
        
        <div className="mt-8 flex justify-center space-x-4">
          <Button asChild>
            <Link href="/">
              Return to Home
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/properties">
              Browse Properties
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 