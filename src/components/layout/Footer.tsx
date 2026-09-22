"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { usePathname } from "next/navigation";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const linkClass = "text-sm text-muted-foreground transition-colors hover:text-primary";

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo.jpeg"
                alt="Manzil By AlWahabCo"
                width={160}
                height={56}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Pakistan&apos;s trust-first property marketplace. Every listing verified, every buyer
              protected.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+9242111000000" className="hover:text-primary">
                  +92 42 111 000 000
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:hello@manzil.pk" className="hover:text-primary">
                  hello@manzil.pk
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Gulberg III, Lahore, Pakistan</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">Company</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a href={pathname === "/" ? "#promise" : "/#promise"} className={linkClass}>
                  About AlWahabCo
                </a>
              </li>
              <li>
                <a href={pathname === "/" ? "#verification" : "/#verification"} className={linkClass}>
                  Our Verification Standard
                </a>
              </li>
              <li>
                <Link href="/blogs" className={linkClass}>
                  Insights
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">Buyers</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/properties" className={linkClass}>
                  Browse Listings
                </Link>
              </li>
              <li>
                <a href={pathname === "/" ? "#verification" : "/#verification"} className={linkClass}>
                  How Verification Works
                </a>
              </li>
              <li>
                <Link href="/request-property" className={linkClass}>
                  Request Verification
                </Link>
              </li>
              <li>
                <Link href="/sell" className={linkClass}>
                  Sell Your Property
                </Link>
              </li>
              <li>
                <Link href="/construction" className={linkClass}>
                  Hire Us To Construct
                </Link>
              </li>
              <li>
                <Link href="/blogs" className={linkClass}>
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">Cities</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/properties?city=lahore" className={linkClass}>
                  Lahore
                </Link>
              </li>
              <li>
                <Link href="/properties?city=islamabad" className={linkClass}>
                  Islamabad
                </Link>
              </li>
              <li>
                <Link href="/properties?city=karachi" className={linkClass}>
                  Karachi
                </Link>
              </li>
              <li>
                <Link href="/properties?city=rawalpindi" className={linkClass}>
                  Rawalpindi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {currentYear} Manzil By AlWahabCo. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="cursor-default">Privacy Policy</span>
            <span className="cursor-default">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
