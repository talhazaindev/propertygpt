import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Register - PropertyGPT",
  description: "Create an account to discover and buy properties with PropertyGPT, Pakistan's trusted real estate platform.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-24 pb-8">{children}</main>
      <Footer />
    </div>
  );
} 