import './globals.css';
import type { Metadata } from 'next';
import { Playfair_Display, Manrope } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SessionProvider } from '@/providers/SessionProvider';
import { Toaster } from "@/components/ui/sonner";
import ClientAnimations from '@/components/ClientAnimations';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Manzil By AlWahabCo — Verified Property in Pakistan',
  description:
    "Pakistan's trust-first property marketplace. Every listing verified — clear title, real ownership, genuine documents.",
  icons: {
    icon: '/images/logo.jpeg',
    apple: '/images/logo.jpeg',
    shortcut: '/images/logo.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const childrenString = String(children);
  const isAdminPath =
    childrenString.includes('"/admin') ||
    childrenString.includes('/admin/') ||
    childrenString.includes('pathname":"/admin');

  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${manrope.variable}`}>
      <body className={`${manrope.className} bg-background text-foreground antialiased`} suppressHydrationWarning>
        <SessionProvider>
          <div className="flex flex-col min-h-screen">
            {!isAdminPath && <Header />}
            <main className="flex-grow">{children}</main>
            {!isAdminPath && <Footer />}
          </div>
        </SessionProvider>
        <Toaster />
        <ClientAnimations />
      </body>
    </html>
  );
}
