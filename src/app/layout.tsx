import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SessionProvider } from '@/providers/SessionProvider';
import { Toaster } from "@/components/ui/sonner";
import ClientAnimations from '@/components/ClientAnimations';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Real Estate GPT - Your Trusted Real Estate Partner in Pakistan',
  description: 'Connecting buyers and sellers for secure, authentic, and fraudless real estate transactions across Pakistan',
};

// This is a server component, but contains client components
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use a more comprehensive check to detect admin paths
  const childrenString = String(children);
  const isAdminPath = 
    childrenString.includes('"/admin') || 
    childrenString.includes('/admin/') ||
    childrenString.includes('pathname":"/admin');
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          <div className="flex flex-col min-h-screen">
            {/* Don't render Header for admin routes */}
            {!isAdminPath && <Header />}
            <main className="flex-grow">{children}</main>
            {/* Don't render Footer for admin routes */}
            {!isAdminPath && <Footer />}
          </div>
        </SessionProvider>
        <Toaster />
        <ClientAnimations />
      </body>
    </html>
  );
} 