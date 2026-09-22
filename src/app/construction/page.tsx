import { Metadata } from "next";
import { ConstructionRequestForm } from "@/components/construction/ConstructionRequestForm";

export const metadata: Metadata = {
  title: "Hire Us To Construct | PropertyGPT",
  description: "Submit a construction request for your dream property",
};

export default function ConstructionRequestPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="flex flex-col items-center mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3">
          Hire Us To Construct Your Property
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Let us build your dream property. Fill out the form below and our construction experts will get in touch with you.
        </p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border">
        <ConstructionRequestForm />
      </div>
    </div>
  );
} 