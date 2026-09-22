import Link from "next/link";
import Image from "next/image";
import { 
  CheckCircle2, MapPin, Search, Home as HomeIcon, Building, Landmark, 
  DollarSign, Shield, Users, ChevronRight, Star, ClipboardCheck, HardHat, SquareStack, TrendingUp, Clock, Settings 
} from "lucide-react";
import { EnhancedSection } from "@/components/ui/enhanced-section";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section with Video Background */}
      <section className="relative h-screen min-h-[700px] w-full flex items-center justify-center overflow-hidden hero-section">
        {/* Video or Image Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="Luxury Real Estate in Pakistan"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        <div className="absolute inset-0 z-1 bg-gradient-to-r from-primary/90 to-primary-dark/70"></div>
        
        {/* Particle effect overlay */}
        <div className="hero-particles">
          {Array.from({ length: 8 }).map((_, index) => {
            const particles = [
              { width: '15px', height: '15px', left: '20%', top: '30%', duration: '8s', delay: '0s' },
              { width: '25px', height: '25px', left: '80%', top: '20%', duration: '12s', delay: '1s' },
              { width: '20px', height: '20px', left: '15%', top: '70%', duration: '10s', delay: '2s' },
              { width: '30px', height: '30px', left: '70%', top: '60%', duration: '9s', delay: '3s' },
              { width: '18px', height: '18px', left: '45%', top: '25%', duration: '11s', delay: '4s' },
              { width: '22px', height: '22px', left: '85%', top: '75%', duration: '13s', delay: '0.5s' },
              { width: '16px', height: '16px', left: '10%', top: '50%', duration: '14s', delay: '1.5s' },
              { width: '28px', height: '28px', left: '60%', top: '35%', duration: '7s', delay: '2.5s' }
            ];
            
            return (
              <div 
                key={index}
                className="hero-particle floating"
                style={{
                  width: particles[index].width,
                  height: particles[index].height,
                  left: particles[index].left,
                  top: particles[index].top,
                  animationDuration: particles[index].duration,
                  animationDelay: particles[index].delay
                }}
              ></div>
            );
          })}
        </div>
        
        {/* Gold accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-dark via-secondary to-secondary-light z-10"></div>
        
        <div className="relative z-10 text-white text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in">
            Find Your <span className="gradient-text">Dream Property</span> in Pakistan
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-3xl mx-auto animate-slide-up delay-200">
            Your trusted partner for secure and authentic real estate transactions across Pakistan
          </p>
          
          {/* Search Box */}
          <div className="glass-effect p-5 rounded-2xl max-w-4xl mx-auto mb-10 animate-slide-up delay-300">
            <form className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3.5 top-1/2 h-5 w-5 text-white -translate-y-1/2 z-10" />
                <select className="modern-input w-full h-14 pr-10 text-white appearance-none transition-all hover:bg-white/20 focus:ring focus:ring-secondary/20">
                  <option value="">All Cities</option>
                  <option value="karachi">Karachi</option>
                  <option value="lahore">Lahore</option>
                  <option value="islamabad">Islamabad</option>
                  <option value="rawalpindi">Rawalpindi</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 relative">
                <HomeIcon className="absolute left-3.5 top-1/2 h-5 w-5 text-white -translate-y-1/2 z-10" />
                <select className="modern-input w-full h-14 pr-10 text-white appearance-none transition-all hover:bg-white/20 focus:ring focus:ring-secondary/20">
                  <option value="">Property Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="commercial">Commercial</option>
                  <option value="land">Land</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div className="md:w-auto">
                <button type="submit" className="btn-secondary w-full md:w-auto h-14 px-8 flex items-center justify-center">
                  <Search className="h-5 w-5 mr-2" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center animate-slide-up delay-400">
            <Link
              href="/properties"
              className="btn-primary flex items-center justify-center group"
            >
              Browse Properties
              <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/sell"
              className="glass-effect px-6 py-3 rounded-full border border-white/30 text-white transition-all flex items-center justify-center group hover:bg-white/20"
            >
              List Your Property
              <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        
        {/* Stats Banner */}
        <div className="absolute bottom-0 left-0 right-0 glass-effect py-5 border-t border-white/20 z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-white">
              <div className="animate-fade-in delay-100">
                <div className="text-3xl font-bold gradient-text">1,200+</div>
                <div className="text-sm text-white/80">Properties Listed</div>
              </div>
              <div className="animate-fade-in delay-200">
                <div className="text-3xl font-bold gradient-text">850+</div>
                <div className="text-sm text-white/80">Happy Clients</div>
              </div>
              <div className="animate-fade-in delay-300">
                <div className="text-3xl font-bold gradient-text">15+</div>
                <div className="text-sm text-white/80">Cities Covered</div>
              </div>
              <div className="animate-fade-in delay-400">
                <div className="text-3xl font-bold gradient-text">99%</div>
                <div className="text-sm text-white/80">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <EnhancedSection padding="xl" background="white">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
            Why Choose <span className="gradient-text">PropertyGPT</span>
          </h2>
          <div className="w-20 h-1 bg-secondary mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            We're dedicated to providing a seamless, secure, and transparent real estate experience for all our clients across Pakistan.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal-stagger">
          {/* Feature 1 */}
          <EnhancedCard 
            variant="luxury" 
            hover="lift" 
            icon={Shield}
            iconColor="text-primary"
            title="Verified Properties"
            className="text-center"
          >
            <p className="text-gray-600 mb-4">
              Every listing undergoes thorough verification for ownership,
              documentation, and legal compliance for your peace of mind.
            </p>
            <ul className="space-y-2 text-left">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Document verification</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Ownership validation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Legal compliance check</span>
              </li>
            </ul>
          </EnhancedCard>

          {/* Feature 2 */}
          <EnhancedCard 
            variant="luxury" 
            hover="lift" 
            icon={DollarSign}
            iconColor="text-primary"
            title="Secure Transactions"
            className="text-center"
          >
            <p className="text-gray-600 mb-4">
              We act as a trusted intermediary between buyers and sellers,
              handling the entire process securely from start to finish.
            </p>
            <ul className="space-y-2 text-left">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Secure payment process</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Escrow services</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Transaction monitoring</span>
              </li>
            </ul>
          </EnhancedCard>

          {/* Feature 3 */}
          <EnhancedCard 
            variant="luxury" 
            hover="lift" 
            icon={Users}
            iconColor="text-primary"
            title="Expert Support"
            className="text-center"
          >
            <p className="text-gray-600 mb-4">
              Our experienced team provides comprehensive support throughout your
              property journey, from search to successful closing.
            </p>
            <ul className="space-y-2 text-left">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">24/7 customer support</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Property consultation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Legal assistance</span>
              </li>
            </ul>
          </EnhancedCard>
        </div>
      </EnhancedSection>
      
      {/* Property Categories - update to use property-card class */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
              Explore <span className="gradient-text">Property Types</span>
            </h2>
            <div className="w-20 h-1 bg-secondary mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Discover diverse property options tailored to meet your specific needs and preferences
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category 1 */}
            <div className="property-card">
              <Image
                src="/images/residential.jpg"
                alt="Residential Properties"
                width={600}
                height={400}
                className="object-cover h-80 w-full"
              />
              <div className="property-card-content">
                <div className="badge badge-secondary inline-block mb-2">Residential</div>
                <h3 className="text-xl font-bold text-white mb-2">Houses & Apartments</h3>
                <p className="text-white/80 text-sm mb-3">Find your perfect home with our selection of houses, apartments, and villas</p>
                <Link href="/properties?type=residential" className="inline-flex items-center text-secondary hover:text-secondary-light font-medium group-hover:underline">
                  Browse Properties
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {/* Category 2 */}
            <div className="property-card">
              <Image
                src="/images/commercial.jpg"
                alt="Commercial Properties"
                width={600}
                height={400}
                className="object-cover h-80 w-full"
              />
              <div className="property-card-content">
                <div className="badge badge-secondary inline-block mb-2">Commercial</div>
                <h3 className="text-xl font-bold text-white mb-2">Office & Retail</h3>
                <p className="text-white/80 text-sm mb-3">Ideal office spaces, retail properties, and industrial facilities for your business</p>
                <Link href="/properties?type=commercial" className="inline-flex items-center text-secondary hover:text-secondary-light font-medium group-hover:underline">
                  Browse Properties
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {/* Category 3 */}
            <div className="property-card">
              <Image
                src="/images/land.jpg"
                alt="Land Plots"
                width={600}
                height={400}
                className="object-cover h-80 w-full"
              />
              <div className="property-card-content">
                <div className="badge badge-secondary inline-block mb-2">Land & Plots</div>
                <h3 className="text-xl font-bold text-white mb-2">Development Opportunities</h3>
                <p className="text-white/80 text-sm mb-3">Residential and commercial plots in prime locations for development</p>
                <Link href="/properties?type=land" className="inline-flex items-center text-secondary hover:text-secondary-light font-medium group-hover:underline">
                  Browse Properties
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {/* Category 4 */}
            <div className="property-card">
              <Image
                src="/images/luxury.jpg"
                alt="Luxury Properties"
                width={600}
                height={400}
                className="object-cover h-80 w-full"
              />
              <div className="property-card-content">
                <div className="badge badge-secondary inline-block mb-2">Luxury</div>
                <h3 className="text-xl font-bold text-white mb-2">Premium Living</h3>
                <p className="text-white/80 text-sm mb-3">Exclusive high-end properties offering premium amenities and locations</p>
                <Link href="/properties?type=luxury" className="inline-flex items-center text-secondary hover:text-secondary-light font-medium group-hover:underline">
                  Browse Properties
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
              What Our <span className="gradient-text">Clients Say</span>
            </h2>
            <div className="w-20 h-1 bg-secondary mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Hear from our satisfied clients about their experience with PropertyGPT
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="luxury-card p-8 group testimonial-card">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden mr-4 ring-2 ring-secondary/20">
                    <Image
                      src="/images/testimonial-1.jpg"
                      alt="Ahmed Khan"
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary group-hover:text-secondary transition-colors">Ahmed Khan</h4>
                    <p className="text-sm text-gray-500">Property Buyer, Lahore</p>
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-secondary fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "I was skeptical about buying property online, but PropertyGPT made the entire process seamless and secure. Their verification process gave me confidence, and I found my dream home within weeks!"
              </p>
              <div className="text-secondary font-medium text-sm bg-secondary/5 px-3 py-1.5 rounded-full inline-block">Purchased a 3-bedroom house in DHA</div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="luxury-card p-8 group testimonial-card">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden mr-4 ring-2 ring-secondary/20">
                    <Image
                      src="/images/testimonial-2.jpg"
                      alt="Fatima Aziz"
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary group-hover:text-secondary transition-colors">Fatima Aziz</h4>
                    <p className="text-sm text-gray-500">Property Seller, Karachi</p>
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-secondary fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "As a seller, I was worried about finding legitimate buyers. PropertyGPT handled everything professionally, from property valuation to final sale. The process was transparent and I got a fair price."
              </p>
              <div className="text-secondary font-medium text-sm bg-secondary/5 px-3 py-1.5 rounded-full inline-block">Sold a commercial property in Clifton</div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="luxury-card p-8 group testimonial-card">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden mr-4 ring-2 ring-secondary/20">
                    <Image
                      src="/images/testimonial-3.jpg"
                      alt="Imran Malik"
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary group-hover:text-secondary transition-colors">Imran Malik</h4>
                    <p className="text-sm text-gray-500">Real Estate Investor, Islamabad</p>
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-secondary fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "I've been investing in real estate for years, and PropertyGPT has been a game-changer. Their nationwide network helped me diversify my portfolio with properties in multiple cities."
              </p>
              <div className="text-secondary font-medium text-sm bg-secondary/5 px-3 py-1.5 rounded-full inline-block">Purchased multiple investment properties</div>
            </div>
          </div>
        </div>
      </section>

      {/* Request Property Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
              Can't Find What You're <span className="gradient-text">Looking For</span>?
            </h2>
            <div className="w-20 h-1 bg-secondary mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Let us know your specific requirements and our team will help you find the perfect property
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="order-2 lg:order-1">
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="p-8 bg-gradient-to-r from-primary to-primary-dark text-white">
                  <h3 className="text-2xl font-bold mb-2">Submit Your Requirements</h3>
                  <p className="text-white/80">Our experts will search properties matching your criteria</p>
                </div>
                <div className="p-8 space-y-5 luxury-card-inner">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Detailed Specifications</h4>
                      <p className="text-gray-600 text-sm">Tell us everything from location preferences to size requirements and budget constraints</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <SquareStack className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Personalized Recommendations</h4>
                      <p className="text-gray-600 text-sm">Receive curated property options that perfectly match your requirements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Market Insights</h4>
                      <p className="text-gray-600 text-sm">Get expert analysis of property trends and investment opportunities in your desired area</p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Link href="/request-property" className="btn-primary w-full flex items-center justify-center group">
                      Request Property
                      <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex items-center justify-center">
              <div className="relative max-w-md">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20"></div>
                <Image
                  src="/images/property-search.jpg"
                  alt="Property Search"
                  width={500}
                  height={600}
                  className="object-cover rounded-xl relative z-10"
                />
                <div className="absolute -bottom-8 -right-8 p-6 bg-secondary text-white rounded-xl shadow-xl z-20">
                  <div className="text-4xl font-bold">95%</div>
                  <div className="text-sm font-medium">Request Fulfillment Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hire Us to Construct Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
              Custom <span className="gradient-text">Construction Services</span>
            </h2>
            <div className="w-20 h-1 bg-secondary mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Build your dream property with our professional construction and development services
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="col-span-1 lg:col-span-2 order-2 lg:order-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                <div className="luxury-card p-6 hover-3d">
                  <div className="flex items-start space-x-4 mb-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <HardHat className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary text-lg">Expert Builders</h4>
                      <p className="text-gray-600 text-sm">Our team of experienced professionals ensures quality construction that meets all standards</p>
                    </div>
                  </div>
                </div>
                
                <div className="luxury-card p-6 hover-3d">
                  <div className="flex items-start space-x-4 mb-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary text-lg">Custom Designs</h4>
                      <p className="text-gray-600 text-sm">Collaborate with our architects to create a space that perfectly matches your vision</p>
                    </div>
                  </div>
                </div>
                
                <div className="luxury-card p-6 hover-3d">
                  <div className="flex items-start space-x-4 mb-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary text-lg">Timely Delivery</h4>
                      <p className="text-gray-600 text-sm">We value your time and ensure that projects are completed within the agreed timeline</p>
                    </div>
                  </div>
                </div>
                
                <div className="sm:col-span-2 lg:col-span-1 mt-4">
                  <Link href="/construction" className="btn-primary w-full flex items-center justify-center group">
                    Get Construction Quote
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="col-span-1 lg:col-span-3 order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden h-full min-h-[400px]">
                <Image
                  src="/images/construction.jpg"
                  alt="Custom Construction"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/80"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 text-white">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-3">Transform Your Vision Into Reality</h3>
                  <p className="text-white/90 mb-6 max-w-lg">Whether you're building a family home, commercial space, or investment property, our construction services deliver quality results on time and within budget.</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="glass-effect px-4 py-2 rounded-full border border-white/20">Residential Construction</div>
                    <div className="glass-effect px-4 py-2 rounded-full border border-white/20">Commercial Buildings</div>
                    <div className="glass-effect px-4 py-2 rounded-full border border-white/20">Renovations & Extensions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/cta-bg.jpg"
            alt="Real Estate Background"
            fill
            className="object-cover opacity-20"
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark opacity-90 z-1"></div>

        {/* Floating shapes for visual interest */}
        <div className="absolute inset-0 z-1 overflow-hidden">
          <div className="absolute h-64 w-64 rounded-full bg-white/5 -top-20 -left-20 floating-slow"></div>
          <div className="absolute h-96 w-96 rounded-full bg-secondary/5 bottom-0 right-0 floating"></div>
          <div className="absolute h-32 w-32 rounded-full bg-white/5 top-1/3 right-1/4 floating-delayed"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Ready to Find Your <span className="gradient-text">Perfect Property</span>?
          </h2>
          <p className="text-xl mb-10 text-white/80 max-w-3xl mx-auto">
            Join thousands of satisfied customers who have found their dream
            homes through PropertyGPT. Let us help you make the right move.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/properties"
              className="btn-primary min-w-[180px] text-lg"
            >
              Browse Properties
            </Link>
            <Link
              href="/contact"
              className="btn-secondary min-w-[180px] text-lg"
            >
              Contact Us
            </Link>
          </div>
          
          <div className="mt-16 pt-16 border-t border-white/10 flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-10">
            <div className="flex items-center glass-effect p-4 rounded-xl">
              <Shield className="w-10 h-10 text-secondary mr-4" />
              <div className="text-left">
                <div className="text-white font-medium">100% Secure</div>
                <div className="text-white/70 text-sm">Verified Transactions</div>
              </div>
            </div>
            <div className="flex items-center glass-effect p-4 rounded-xl">
              <Users className="w-10 h-10 text-secondary mr-4" />
              <div className="text-left">
                <div className="text-white font-medium">Expert Support</div>
                <div className="text-white/70 text-sm">7 Days a Week</div>
              </div>
            </div>
            <div className="flex items-center glass-effect p-4 rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-secondary mr-4" />
              <div className="text-left">
                <div className="text-white font-medium">Trusted Platform</div>
                <div className="text-white/70 text-sm">By Thousands of Clients</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 