"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, UserCircle, Search, Home, MapPin, Info, Phone, LogIn, UserPlus, Bell, BookOpen, FileText, HardHat } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession({ required: false });
  
  // Define all hooks first before any conditional returns
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHovering, setIsHovering] = useState(false);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isHomePage = pathname === "/";
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Don't render header on admin pages - moved after all hooks are defined
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/properties?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Simplified header for loading state
  if (isLoading) {
    return (
      <header className="bg-white/20 backdrop-blur-xl shadow-lg py-4" suppressHydrationWarning={true}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              <span className="text-primary">Property</span>
              <span className="text-secondary">GPT</span>
            </div>
            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-full" suppressHydrationWarning={true}></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header 
      className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        isScrolled || !isHomePage
          ? 'bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 py-3' 
          : 'bg-transparent py-5'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      suppressHydrationWarning={true}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo with enhanced animation */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/30">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full animate-gradient-xy"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg group-hover:text-xl transition-all duration-300">P</div>
            </div>
            <div className="text-2xl font-bold transition-all duration-300 group-hover:translate-x-1">
              <span className={isScrolled || !isHomePage ? 'text-primary' : 'text-white'}>Property</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary to-secondary-light">GPT</span>
            </div>
          </Link>

          {/* Desktop Navigation with improved hover effects */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link
              href="/properties"
              className={`flex items-center space-x-1 font-medium transition-all relative group overflow-hidden py-2 ${
                isScrolled || !isHomePage ? 'text-gray-700' : 'text-white'
              }`}
            >
              <Home className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">Properties</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-primary group-hover:w-full transition-all duration-300 ease-out"></span>
              <span className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10 -z-10 scale-y-0 group-hover:scale-y-100 origin-bottom rounded-md transition-transform duration-300"></span>
            </Link>
            <Link
              href="/request-property"
              className={`flex items-center space-x-1 font-medium transition-all relative group overflow-hidden py-2 ${
                isScrolled || !isHomePage ? 'text-gray-700' : 'text-white'
              }`}
            >
              <FileText className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">Request Property</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-primary group-hover:w-full transition-all duration-300 ease-out"></span>
              <span className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10 -z-10 scale-y-0 group-hover:scale-y-100 origin-bottom rounded-md transition-transform duration-300"></span>
            </Link>
            <Link
              href="/construction"
              className={`flex items-center space-x-1 font-medium transition-all relative group overflow-hidden py-2 ${
                isScrolled || !isHomePage ? 'text-gray-700' : 'text-white'
              }`}
            >
              <HardHat className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">Hire Us To Construct</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-primary group-hover:w-full transition-all duration-300 ease-out"></span>
              <span className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10 -z-10 scale-y-0 group-hover:scale-y-100 origin-bottom rounded-md transition-transform duration-300"></span>
            </Link>
            <Link
              href="/blogs"
              className={`flex items-center space-x-1 font-medium transition-all relative group overflow-hidden py-2 ${
                isScrolled || !isHomePage ? 'text-gray-700' : 'text-white'
              }`}
            >
              <BookOpen className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">Blog</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-primary group-hover:w-full transition-all duration-300 ease-out"></span>
              <span className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10 -z-10 scale-y-0 group-hover:scale-y-100 origin-bottom rounded-md transition-transform duration-300"></span>
            </Link>
            <Link
              href="/about"
              className={`flex items-center space-x-1 font-medium transition-all relative group overflow-hidden py-2 ${
                isScrolled || !isHomePage ? 'text-gray-700' : 'text-white'
              }`}
            >
              <Info className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">About Us</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-primary group-hover:w-full transition-all duration-300 ease-out"></span>
              <span className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10 -z-10 scale-y-0 group-hover:scale-y-100 origin-bottom rounded-md transition-transform duration-300"></span>
            </Link>
            <Link
              href="/contact"
              className={`flex items-center space-x-1 font-medium transition-all relative group overflow-hidden py-2 ${
                isScrolled || !isHomePage ? 'text-gray-700' : 'text-white'
              }`}
            >
              <Phone className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">Contact</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-primary group-hover:w-full transition-all duration-300 ease-out"></span>
              <span className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10 -z-10 scale-y-0 group-hover:scale-y-100 origin-bottom rounded-md transition-transform duration-300"></span>
            </Link>
            
            {/* Enhanced Search Bar */}
            <form onSubmit={handleSearch} className="relative w-64 ml-4 group">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-2.5 pl-10 pr-4 rounded-full text-sm transition-all duration-300
                  ${isScrolled || !isHomePage
                    ? 'bg-white/80 focus:bg-white border-gray-200 focus:border-secondary text-gray-700' 
                    : 'bg-white/20 focus:bg-white/90 border-white/30 focus:border-white text-white focus:text-gray-800'
                  } 
                  border backdrop-blur-sm outline-none shadow-sm focus:shadow-lg group-hover:shadow-md`}
              />
              <Search className={`absolute left-3 top-3 h-4 w-4 transition-all duration-300 ${
                isScrolled || !isHomePage ? 'text-gray-500 group-hover:text-secondary' : 'text-white/70 group-hover:text-white'
              }`} />
              <div className={`absolute right-3 top-2.5 text-xs px-1.5 py-0.5 rounded-full bg-gradient-to-r from-secondary/80 to-primary/80 text-white scale-0 group-hover:scale-100 transition-transform duration-300 origin-right`}>
                Press Enter
              </div>
            </form>
            
            {/* Auth Buttons with improved animations */}
            {!isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className={`flex items-center px-5 py-2 rounded-full border transition-all duration-300 hover:scale-105 relative overflow-hidden group
                    ${isScrolled || !isHomePage
                      ? 'border-primary text-primary hover:text-white'
                      : 'border-white/30 text-white hover:border-white/70'
                    }`}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                  <LogIn className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-secondary to-secondary-light text-white hover:shadow-xl hover:shadow-secondary/20 transition-all duration-300 relative overflow-hidden group hover:scale-105 border border-transparent"
                >
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                  <UserPlus className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Register</span>
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button 
                  onClick={toggleUserMenu}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 relative overflow-hidden group
                    ${isScrolled || !isHomePage
                      ? 'border border-gray-200/50 bg-white/70 backdrop-blur-sm text-gray-700 hover:border-primary hover:text-primary hover:bg-white/90'
                      : 'bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 border'
                    }`}
                >
                  <div className="relative z-10">
                    {session?.user?.image ? (
                      <div className="relative">
                        <Image 
                          src={session.user.image} 
                          alt={session.user.name || "User"} 
                          width={32} 
                          height={32}
                          className="rounded-full ring-2 ring-white/30 group-hover:ring-secondary/30 transition-all"
                        />
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white animate-pulse"></span>
                      </div>
                    ) : (
                      <div className="relative">
                        <UserCircle className="h-8 w-8" />
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white animate-pulse"></span>
                      </div>
                    )}
                  </div>
                  <span className="font-medium relative z-10">{session?.user?.name || "User"}</span>
                  <span className="absolute right-0 top-0 h-5 w-5 bg-secondary rounded-full flex items-center justify-center text-white text-xs -mt-1.5 -mr-1.5 shadow-md shadow-secondary/20 group-hover:scale-110 transition-transform">3</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl py-2 z-10 transform transition-all duration-300 animate-in fade-in-50 zoom-in-95 slide-in-from-top-5 origin-top-right bg-white/90 backdrop-blur-lg border border-white/20">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-green-600">Online</span>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-b border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-500">NOTIFICATIONS</span>
                        <span className="text-xs font-medium text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full">3 New</span>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300">
                        <div className="p-2 hover:bg-secondary/5 rounded-lg transition-colors duration-200 flex items-start space-x-3 hover:translate-x-1">
                          <div className="h-8 w-8 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bell className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-800">New property listing in your area</p>
                            <p className="text-xs text-gray-500">2 hours ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link 
                      href="/dashboard"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-secondary/5 hover:text-primary transition-all duration-200 group"
                    >
                      <Home className="h-4 w-4 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                      Dashboard
                    </Link>
                    <Link 
                      href="/profile"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-secondary/5 hover:text-primary transition-all duration-200 group"
                    >
                      <UserCircle className="h-4 w-4 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                      Profile Settings
                    </Link>
                    <Link 
                      href="/favorites"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-secondary/5 hover:text-primary transition-all duration-200 group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Saved Properties
                    </Link>
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-500/10 transition-all duration-200 group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-red-500 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Mobile menu button with improved animation */}
          <button
            className="lg:hidden focus:outline-none relative overflow-hidden rounded-full p-2 hover:bg-white/10 transition-colors duration-200"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className={`h-6 w-6 transition-all duration-300 ${isScrolled ? 'text-gray-700' : 'text-white'}`} />
            ) : (
              <div className="relative">
                <Menu className={`h-6 w-6 transition-all duration-300 ${isScrolled ? 'text-gray-700' : 'text-white'}`} />
                {isAuthenticated && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-secondary rounded-full flex items-center justify-center text-white text-xs animate-pulse shadow-sm shadow-secondary/30">3</span>
                )}
              </div>
            )}
          </button>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 px-2 mt-2 bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 animate-in slide-in-from-top-5 duration-300">
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2.5 pl-10 pr-4 rounded-full bg-white/80 border border-gray-200 focus:border-secondary outline-none shadow-sm focus:shadow-md transition-all duration-200"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            </form>
            
            <div className="flex flex-col space-y-1">
              <Link
                href="/properties"
                className="flex items-center p-3 hover:bg-secondary/5 rounded-lg text-gray-700 hover:text-primary transition-all duration-200 group"
              >
                <Home className="h-5 w-5 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                <span className="font-medium">Properties</span>
              </Link>
              <Link
                href="/request-property"
                className="flex items-center p-3 hover:bg-secondary/5 rounded-lg text-gray-700 hover:text-primary transition-all duration-200 group"
              >
                <FileText className="h-5 w-5 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                <span className="font-medium">Request Property</span>
              </Link>
              <Link
                href="/construction"
                className="flex items-center p-3 hover:bg-secondary/5 rounded-lg text-gray-700 hover:text-primary transition-all duration-200 group"
              >
                <HardHat className="h-5 w-5 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                <span className="font-medium">Hire Us To Construct</span>
              </Link>
              <Link
                href="/blogs"
                className="flex items-center p-3 hover:bg-secondary/5 rounded-lg text-gray-700 hover:text-primary transition-all duration-200 group"
              >
                <BookOpen className="h-5 w-5 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                <span className="font-medium">Blog</span>
              </Link>
              <Link
                href="/about"
                className="flex items-center p-3 hover:bg-secondary/5 rounded-lg text-gray-700 hover:text-primary transition-all duration-200 group"
              >
                <Info className="h-5 w-5 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                <span className="font-medium">About Us</span>
              </Link>
              <Link
                href="/contact"
                className="flex items-center p-3 hover:bg-secondary/5 rounded-lg text-gray-700 hover:text-primary transition-all duration-200 group"
              >
                <Phone className="h-5 w-5 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                <span className="font-medium">Contact</span>
              </Link>
              
              <div className="border-t border-white/10 my-2 pt-2">
                {!isAuthenticated ? (
                  <div className="flex flex-col space-y-3">
                    <Link
                      href="/login"
                      className="flex items-center justify-center py-3 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-all duration-200 group"
                    >
                      <LogIn className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                      <span className="font-medium">Login</span>
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center justify-center py-3 rounded-lg bg-gradient-to-r from-secondary to-secondary-light text-white shadow-md hover:shadow-lg hover:shadow-secondary/20 transition-all duration-200 group"
                    >
                      <UserPlus className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                      <span className="font-medium">Register</span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center p-3 bg-secondary/5 rounded-lg">
                      {session?.user?.image ? (
                        <div className="relative">
                          <Image 
                            src={session.user.image} 
                            alt={session.user.name || "User"} 
                            width={40} 
                            height={40}
                            className="rounded-full mr-3 ring-2 ring-white/30"
                          />
                          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white animate-pulse"></span>
                        </div>
                      ) : (
                        <div className="relative">
                          <UserCircle className="h-10 w-10 mr-3 text-gray-500" />
                          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white animate-pulse"></span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{session?.user?.name}</p>
                        <p className="text-xs text-gray-500">{session?.user?.email}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-secondary/5 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">NOTIFICATIONS</span>
                        <span className="text-xs font-medium text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full">3 New</span>
                      </div>
                      <div className="p-2 bg-white/50 rounded-lg flex items-start space-x-3 hover:translate-x-1 transition-transform duration-200">
                        <div className="h-8 w-8 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bell className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-800">New property listing in your area</p>
                          <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center p-3 hover:bg-secondary/5 rounded-lg text-gray-700 hover:text-primary transition-all duration-200 group"
                    >
                      <Home className="h-5 w-5 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center p-3 hover:bg-secondary/5 rounded-lg text-gray-700 hover:text-primary transition-all duration-200 group"
                    >
                      <UserCircle className="h-5 w-5 mr-3 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                      <span className="font-medium">Profile Settings</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center p-3 hover:bg-red-500/10 rounded-lg text-red-600 transition-all duration-200 text-left group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 