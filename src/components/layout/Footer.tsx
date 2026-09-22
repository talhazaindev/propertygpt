"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Home, Info, MessageCircle, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { usePathname } from "next/navigation";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  
  // Don't render footer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  return (
    <footer className="pt-16 pb-8 relative bg-gradient-to-br from-primary-dark via-primary to-primary-dark text-white">
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-5 bg-repeat"></div>
      
      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-dark via-secondary to-secondary-light"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Footer top section - Get in touch */}
        <div className="flex flex-col md:flex-row items-center justify-between p-6 mb-12 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold">Ready to Find Your Dream Property?</h3>
            <p className="text-white/80 mt-2">Get in touch with our expert team today</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/contact" 
              className="px-6 py-3 bg-secondary hover:bg-secondary-light text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
            >
              Contact Us
            </Link>
            <Link 
              href="/properties" 
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-full transition-all"
            >
              Browse Properties
            </Link>
          </div>
        </div>
        
        {/* Footer main content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mr-3">
                <span className="text-2xl font-bold text-white">P</span>
              </div>
              <div className="text-xl font-bold">
                Property<span className="text-secondary">GPT</span>
              </div>
            </div>
            <p className="text-white/70 mb-6 leading-relaxed">
              Your trusted partner for secure and authentic real estate transactions
              across Pakistan. We're committed to making your property journey seamless.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-secondary hover:text-white transition-all duration-300">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-secondary hover:text-white transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-secondary hover:text-white transition-all duration-300">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-secondary hover:text-white transition-all duration-300">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 relative inline-block">
              Quick Links
              <span className="absolute left-0 bottom-[-8px] w-12 h-[3px] bg-secondary"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-white/70 hover:text-secondary flex items-center transition-colors">
                  <Home className="h-4 w-4 mr-2" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link href="/properties" className="text-white/70 hover:text-secondary flex items-center transition-colors">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Properties</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/70 hover:text-secondary flex items-center transition-colors">
                  <Info className="h-4 w-4 mr-2" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/70 hover:text-secondary flex items-center transition-colors">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white/70 hover:text-secondary flex items-center transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <span>Blog</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-lg font-semibold mb-6 relative inline-block">
              Popular Cities
              <span className="absolute left-0 bottom-[-8px] w-12 h-[3px] bg-secondary"></span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/properties?cityId=karachi" className="text-white/70 hover:text-secondary transition-colors group">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-secondary/50 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                  Karachi
                </div>
              </Link>
              <Link href="/properties?cityId=lahore" className="text-white/70 hover:text-secondary transition-colors group">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-secondary/50 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                  Lahore
                </div>
              </Link>
              <Link href="/properties?cityId=islamabad" className="text-white/70 hover:text-secondary transition-colors group">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-secondary/50 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                  Islamabad
                </div>
              </Link>
              <Link href="/properties?cityId=rawalpindi" className="text-white/70 hover:text-secondary transition-colors group">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-secondary/50 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                  Rawalpindi
                </div>
              </Link>
              <Link href="/properties?cityId=faisalabad" className="text-white/70 hover:text-secondary transition-colors group">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-secondary/50 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                  Faisalabad
                </div>
              </Link>
              <Link href="/properties?cityId=multan" className="text-white/70 hover:text-secondary transition-colors group">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-secondary/50 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                  Multan
                </div>
              </Link>
              <Link href="/properties?cityId=peshawar" className="text-white/70 hover:text-secondary transition-colors group">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-secondary/50 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                  Peshawar
                </div>
              </Link>
              <Link href="/properties?cityId=quetta" className="text-white/70 hover:text-secondary transition-colors group">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-secondary/50 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                  Quetta
                </div>
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6 relative inline-block">
              Contact Us
              <span className="absolute left-0 bottom-[-8px] w-12 h-[3px] bg-secondary"></span>
            </h3>
            <address className="not-italic text-white/70 space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 mt-0.5 text-secondary" />
                <div>
                  <p>Head Office: 123 Main Street</p>
                  <p>Islamabad, Pakistan</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-secondary" />
                <a href="mailto:info@propertygpt.pk" className="hover:text-secondary transition-colors">info@propertygpt.pk</a>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-secondary" />
                <a href="tel:+923001234567" className="hover:text-secondary transition-colors">+92 300 1234567</a>
              </div>
            </address>

            {/* Newsletter Signup */}
            <div className="mt-6 bg-white/10 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Subscribe to our newsletter</h4>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="flex-1 py-2 px-3 bg-white/10 border border-white/20 rounded-l-md text-white focus:outline-none focus:border-secondary"
                />
                <button className="bg-secondary hover:bg-secondary-light px-4 rounded-r-md transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="mt-16 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 text-sm mb-4 md:mb-0">
            &copy; {currentYear} PropertyGPT. All rights reserved.
          </p>
          <div className="flex space-x-6 text-white/60 text-sm">
            <Link href="/terms" className="hover:text-secondary transition-colors">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
            <Link href="/sitemap" className="hover:text-secondary transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 