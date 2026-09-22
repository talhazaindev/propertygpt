import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sell Property - Manzil By AlWahabCo",
  description: "List your property for sale on Manzil By AlWahabCo, Pakistan's trusted real estate platform.",
};

// Mark the layout as static to avoid MongoDB issues
export const dynamic = 'force-static';

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-8 pb-8">
      {children}
    </div>
  );
}
