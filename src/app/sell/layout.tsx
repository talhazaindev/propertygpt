import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Sell Property - PropertyGPT",
  description: "List your property for sale on PropertyGPT, Pakistan's trusted real estate platform.",
};

// Mark the layout as static to avoid MongoDB issues
export const dynamic = 'force-static';

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-24 pb-8">
        {children}
      </main>
      <Footer />
    </div>
  );
} 