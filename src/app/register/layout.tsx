import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - Manzil By AlWahabCo",
  description: "Create an account to discover and buy properties with Manzil By AlWahabCo, Pakistan's trusted real estate platform.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="pt-8 pb-8">{children}</div>;
}
