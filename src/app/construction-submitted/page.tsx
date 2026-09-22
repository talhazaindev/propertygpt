import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Request Submitted | PropertyGPT",
  description: "Your construction request has been submitted successfully",
};

export default function ConstructionSubmittedPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-md border text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Construction Request Submitted!
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Thank you for submitting your construction request. Our team will review your details 
          and get in touch with you shortly to discuss your project requirements.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">
              Return to Home
            </Link>
          </Button>
          
          <Button variant="outline" asChild size="lg">
            <Link href="/construction">
              Submit Another Request
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 