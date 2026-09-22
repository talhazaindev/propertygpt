"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  UserCircle,
  LogIn,
  UserPlus,
  Home,
  FileText,
  HardHat,
  BookOpen,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession({ required: false });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isAuthenticated = status === "authenticated";
  const isHomePage = pathname === "/";

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 10);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const navLinkClass =
    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? "border-border bg-background/95 shadow-sm backdrop-blur-md"
          : "border-transparent bg-background/80 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Manzil By AlWahabCo — home">
          <Image
            src="/images/logo-nav.jpeg"
            alt="Manzil By AlWahabCo"
            width={140}
            height={48}
            className="h-11 w-auto object-contain"
            priority
            sizes="140px"
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {isHomePage ? (
            <>
              <a href="#verification" className={navLinkClass}>
                How Verification Works
              </a>
              <a href="#listings" className={navLinkClass}>
                Listings
              </a>
              <a href="#promise" className={navLinkClass}>
                Our Promise
              </a>
              <a href="#reviews" className={navLinkClass}>
                Reviews
              </a>
            </>
          ) : (
            <>
              <Link href="/properties" className={navLinkClass}>
                Properties
              </Link>
              <Link href="/request-property" className={navLinkClass}>
                Request Property
              </Link>
              <Link href="/construction" className={navLinkClass}>
                Construction
              </Link>
              <Link href="/blogs" className={navLinkClass}>
                Blog
              </Link>
            </>
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {status === "loading" ? (
            <div className="h-5 w-14 animate-pulse rounded bg-muted" aria-hidden />
          ) : !isAuthenticated ? (
            <Link
              href="/login"
              prefetch
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <UserCircle className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="max-w-[100px] truncate">{session?.user?.name || "Account"}</span>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card py-2 shadow-lg">
                  <div className="border-b border-border px-4 py-2">
                    <p className="text-sm font-medium text-foreground">{session?.user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
          <Link
            href="/sell"
            className="inline-flex items-center rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Sell
          </Link>
          <Link
            href={isHomePage ? "#cta" : "/request-property"}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Verify a Property
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
            {isHomePage && (
              <>
                <a href="#verification" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
                  How Verification Works
                </a>
                <a href="#listings" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
                  Listings
                </a>
                <a href="#promise" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
                  Our Promise
                </a>
                <a href="#reviews" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
                  Reviews
                </a>
                <div className="my-2 border-t border-border" />
              </>
            )}
            <Link href="/properties" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
              <Home className="h-4 w-4 text-primary" /> Properties
            </Link>
            <Link href="/request-property" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
              <FileText className="h-4 w-4 text-primary" /> Request Property
            </Link>
            <Link href="/construction" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
              <HardHat className="h-4 w-4 text-primary" /> Hire Us To Construct
            </Link>
            <Link href="/blogs" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
              <BookOpen className="h-4 w-4 text-primary" /> Blog
            </Link>
            <div className="my-2 border-t border-border" />
            {status === "loading" ? null : !isAuthenticated ? (
              <>
                <Link href="/login" prefetch className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
                  <LogIn className="h-4 w-4" /> Sign in
                </Link>
                <Link href="/register" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
                  <UserPlus className="h-4 w-4" /> Register
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
                <button type="button" onClick={handleSignOut} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                  Sign out
                </button>
              </>
            )}
            <Link
              href="/sell"
              className="mt-2 inline-flex items-center justify-center rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Sell Your Property
            </Link>
            <Link
              href={isHomePage ? "#cta" : "/request-property"}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Verify a Property
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
