import { Metadata } from "next";
import SellClient from "@/components/client/SellClient";

export const metadata: Metadata = {
  title: "Sell Your Property - PropertyGPT",
  description: "List your property for sale on PropertyGPT, Pakistan's trusted real estate platform.",
};

// Disable data fetching to avoid MongoDB errors
export const dynamic = 'force-static';

export default function SellPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Sell Your Property</h1>
      <SellClient />
    </div>
  );
} 