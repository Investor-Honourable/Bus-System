import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  Bus, 
  Clock, 
  Shield, 
  MapPin, 
  Star, 
  ArrowRight, 
  Phone, 
  Mail, 
  Facebook, 
  Twitter, 
  Instagram,
  CheckCircle,
  Menu,
  X,
  Loader2,
  Globe
} from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { LanguageSwitcher } from "../components/LanguageSwitcher.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import logoImage from "../../assets/CamTransit.png";
import heroImage from "../../assets/good bus pic.jpg";
import testimonialImage1 from "../../assets/african-american-man.jpg";
import testimonialImage2 from "../../assets/young-adult-travelling.jpg";

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [activeNav, setActiveNav] = useState("home");

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    const storedLang = localStorage.getItem('app_language');
    if (storedLang && window.i18nTranslations?.[storedLang]) {
      setTimeout(() => {
        const trans = window.i18nTranslations[storedLang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
          const key = el.getAttribute('data-i18n');
          if (trans[key]) {
            el.textContent = trans[key];
          }
        });
      }, 500);
    }
  }, []);

  const handleNavClick = (section) => {
    setActiveNav(section);
    if (section !== 'home') {
      scrollToSection(section);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fetchRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_trips" })
      });
      const data = await response.json();
      if (data.status === "success" && data.trips) {
        const routesMap = {};
        data.trips.forEach(trip => {
          const key = `${trip.origin}-${trip.destination}`;
          if (!routesMap[key]) {
            routesMap[key] = {
              from: trip.origin,
              to: trip.destination,
              price: trip.price,
              duration: formatDuration(parseInt(trip.duration_minutes || 180)),
              trips: 1,
              rating: 4.5 + Math.random() * 0.5,
              seats: trip.available_seats || 15,
              image: heroImage
            };
          } else {
            routesMap[key].trips++;
          }
        });
        const formattedRoutes = Object.values(routesMap).slice(0, 6);
        setRoutes(formattedRoutes);
      }
    } catch (err) {
      console.error("Error fetching routes:", err);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h 00m`;
    return `${mins}m`;
  };

const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

const defaultRoutes = [
    {
      from: "Douala",
      to: "Yaoundé",
      price: "4,000 XAF",
      duration: "3h 30m",
      trips: "15 trips/day",
      rating: 4.8,
      seats: 12,
      image: heroImage
    }
  ];

  const displayRoutes = routes.length > 0 ? routes : defaultRoutes;

  const testimonials = [
    {
      name: "Marie Ngono",
      location: "Yaoundé",
      rating: 5,
      text: "The best bus booking platform in Cameroon! I travel frequently between Yaoundé and Douala, and CamerTransit makes it so easy. The buses are always on time and comfortable."
    },
    {
      name: "Jean-Paul Fotso",
      location: "Bafoussam",
      rating: 5,
      text: "I was skeptical at first, but after my first trip, I'm a loyal customer. The mobile tickets are convenient, and customer service is excellent. Highly recommended!"
    },
    {
      name: "Aminata Bello",
      location: "Douala",
      rating: 5,
      text: "As a business traveler, I need reliability. CamerTransit has never let me down. The buses are modern, clean, and the booking process is incredibly smooth."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 1. STICKY NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="flex justify-between items-center h-20 sm:h-24">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src={logoImage} 
                alt="CamTransit Logo" 
                className="w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 object-contain"
              />
            </div>

            {/* Center Navigation - Desktop */}
            <div className="hidden md:flex items-center justify-center flex-1 gap-1 px-4">
              <button 
                onClick={() => handleNavClick('home')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeNav === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                Home
              </button>
<button 
                onClick={() => handleNavClick('features')}
                data-nav="features"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeNav === 'features' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                Features
              </button>
              <button 
                onClick={() => handleNavClick('routes')}
                data-nav="routes"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeNav === 'routes' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                Routes
              </button>
              <button 
                onClick={() => handleNavClick('testimonials')}
                data-nav="testimonials"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeNav === 'testimonials' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                Testimonials
              </button>
              <button 
                onClick={() => handleNavClick('contact')}
                data-nav="contact"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeNav === 'contact' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                Contact
              </button>
            </div>

            {/* Right Side Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <button 
                onClick={() => scrollToSection('features')}
                className="block w-full text-left py-2 text-gray-600 hover:text-gray-900"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('routes')}
                className="block w-full text-left py-2 text-gray-600 hover:text-gray-900"
              >
                Routes
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="block w-full text-left py-2 text-gray-600 hover:text-gray-900"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="block w-full text-left py-2 text-gray-600 hover:text-gray-900"
              >
                Contact
              </button>
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full justify-center text-gray-600 hover:text-gray-900">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" className="block">
                  <Button className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-28 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text Content */}
            <div className="space-y-8 sm:space-y-10 text-center sm:text-left">
              <Badge data-i18n="landing.badge" className="bg-blue-50 text-blue-700 border-blue-200 text-sm sm:text-base px-5 py-2 font-semibold">
                🇨🇲 Cameroon #1 Bus Booking Platform
              </Badge>
              
              <div className="py-3 overflow-hidden">
                <h1 data-i18n="landing.hero_title" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', lineHeight: 1.6, letterSpacing: '0.03em', whiteSpace: 'nowrap', maxWidth: '100%' }} className="!font-bold text-blue-700 truncate">
                  Travel Across Cameroon — With Comfort & Safety
                </h1>
              </div>
              
              <p data-i18n="landing.hero_desc" className="text-xl sm:text-2xl text-gray-600 !leading-relaxed font-medium max-w-xl mx-auto sm:mx-0">
                Book your bus tickets in seconds. Experience modern, reliable, and affordable travel across all major cities in Cameroon.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center sm:justify-start">
                <Link to="/signup">
                  <Button data-i18n="landing.cta_primary" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl shadow-blue-600/25">
                    Book Your Trip Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  data-i18n="landing.cta_secondary"
                  variant="outline" 
                  size="lg"
                  onClick={() => scrollToSection('routes')}
                  className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Explore Routes
                </Button>
              </div>
              
              <div className="flex items-center gap-4 pt-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 sm:w-6 h-5 sm:h-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span data-i18n="landing.rating_text" className="text-base sm:text-lg text-gray-700 font-semibold">4.8/5 from 10,000+ happy travelers</span>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-2xl sm:blur-3xl rounded-2xl sm:rounded-3xl" />
              <img 
                src={heroImage} 
                alt="Modern bus" 
                className="relative rounded-2xl sm:rounded-3xl shadow-2xl w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover"
              />
              <div className="absolute -bottom-3 sm:-bottom-4 -left-3 sm:-left-4 bg-white rounded-lg shadow-lg p-2 sm:p-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">Instant Booking</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Under 2 minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Why Choose Us
            </Badge>
            <h2 data-i18n="landing.features_title" className="text-4xl !font-bold text-gray-900 mb-4">
              Travel Made Simple & Safe
            </h2>
            <p data-i18n="landing.features_desc" className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the best bus booking platform in Cameroon with modern features designed for your comfort.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 data-i18n="landing.feature_instant_title" className="text-xl font-semibold text-gray-900">Instant Booking</h3>
                <p data-i18n="landing.feature_instant_desc" className="text-gray-600">
                  Book your tickets in under 2 minutes. No queues, no hassle.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 2 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 data-i18n="landing.feature_secure_title" className="text-xl font-semibold text-gray-900">100% Secure</h3>
                <p data-i18n="landing.feature_secure_desc" className="text-gray-600">
                  Your payment and personal data are protected with top-tier security.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 3 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <h3 data-i18n="landing.feature_fleet_title" className="text-xl font-semibold text-gray-900">Modern Fleet</h3>
                <p data-i18n="landing.feature_fleet_desc" className="text-gray-600">
                  Travel in comfort with our modern, air-conditioned buses.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 4 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 data-i18n="landing.feature_coverage_title" className="text-xl font-semibold text-gray-900">Wide Coverage</h3>
                <p className="text-gray-600">
                  Connect to all major cities across Cameroon with ease.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. POPULAR ROUTES SECTION */}
      <section id="routes" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <Badge className="mb-3 sm:mb-4 bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
              Popular Destinations
            </Badge>
            <h2 data-i18n="landing.routes_title" className="text-2xl sm:text-3xl md:text-4xl !font-bold text-gray-900 mb-3 sm:mb-4">
              Where Do You Want to Go?
            </h2>
            <p data-i18n="landing.routes_desc" className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our most popular routes across Cameroon with competitive prices and comfortable buses.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {isLoadingRoutes ? (
              <div className="col-span-3 text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="mt-2 text-gray-500">Loading routes...</p>
              </div>
            ) : displayRoutes.map((route, index) => (
              <Card 
                key={index} 
                className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col"
              >
                {/* Image Container - Fixed aspect ratio */}
                <div className="relative h-48 flex-shrink-0">
                  <img 
                    src={route.image} 
                    alt={`${route.from} to ${route.to}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 right-4 bg-white/90 text-gray-900 border-0 rounded-full px-2 py-1 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{route.rating}</span>
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="!font-semibold">{route.from}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="!font-semibold">{route.to}</span>
                    </div>
                    <p className="text-sm opacity-90 mt-1">{route.trips}</p>
                  </div>
                </div>
                {/* Content Container - Always visible below image */}
                <div className="p-6 space-y-4 flex-grow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{route.duration}</span>
                    </div>
                    <span className="text-sm text-gray-600">{route.seats} seats available</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Starting from</p>
                    <p className="!text-2xl !font-bold text-blue-600">{route.price}</p>
                  </div>
                  <Link to="/signup" className="block mt-auto">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
            )}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Simple Process
            </Badge>
            <h2 data-i18n="landing.steps_title" className="text-4xl !font-bold text-gray-900 mb-4">
              Book in 3 Easy Steps
            </h2>
            <p data-i18n="landing.steps_desc" className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our streamlined booking process makes it easy to get your tickets in minutes.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto text-white text-2xl !font-bold">
                1
              </div>
              <h3 data-i18n="landing.step1_title" className="!text-xl font-semibold text-gray-900">Choose Your Route</h3>
              <p data-i18n="landing.step1_desc" className="text-gray-600">
                Select your departure city, destination, and travel date from our wide range of routes.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto text-white text-2xl !font-bold">
                2
              </div>
              <h3 data-i18n="landing.step2_title" className="!text-xl font-semibold text-gray-900">Select Your Seat</h3>
              <p data-i18n="landing.step2_desc" className="text-gray-600">
                Pick your preferred seat from our interactive seat map and view real-time availability.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto text-white text-2xl !font-bold">
                3
              </div>
              <h3 data-i18n="landing.step3_title" className="!text-xl font-semibold text-gray-900">Pay & Travel</h3>
              <p className="text-gray-600">
                Complete your payment securely and receive your e-ticket instantly via email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS SECTION */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge data-i18n="landing.testimonials_badge" className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Customer Reviews
            </Badge>
            <h2 data-i18n="landing.testimonials_title" className="text-4xl !font-bold text-gray-900 mb-4">
              What Our Travelers Say
            </h2>
            <p data-i18n="landing.testimonials_desc" className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied travelers who trust CamerTransit for their journeys.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-none shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.text}"</p>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="!font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. STATS SECTION */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-5xl !font-bold mb-2">10K+</p>
              <p data-i18n="landing.stats_travelers" className="text-blue-100">Happy Travelers</p>
            </div>
            <div>
              <p className="text-5xl !font-bold mb-2">50+</p>
              <p data-i18n="landing.stats_routes" className="text-blue-100">Routes Available</p>
            </div>
            <div>
              <p className="text-5xl !font-bold mb-2">100+</p>
              <p data-i18n="landing.stats_trips" className="text-blue-100">Daily Trips</p>
            </div>
            <div>
              <p className="text-5xl !font-bold mb-2">4.8★</p>
              <p data-i18n="landing.stats_rating" className="text-blue-100">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 space-y-6">
            <h2 data-i18n="landing.cta_title" className="text-4xl !font-bold text-gray-900">
              Ready to Start Your Journey?
            </h2>
            <p data-i18n="landing.cta_desc" className="text-xl text-gray-600">
              Join thousands of satisfied travelers across Cameroon. Book your next trip today!
            </p>
            <Link to="/signup">
              <Button data-i18n="landing.cta_create" size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 animate-pulse">
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
            {/* Column 1: About */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={logoImage} 
                  alt="CamTransit Logo" 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                />
                <span className="text-2xl sm:text-3xl font-bold text-white">CamTransit</span>
              </div>
              <p data-i18n="landing.footer_about" className="text-sm text-gray-400 mb-4">
                Your trusted partner for comfortable and affordable bus travel across Cameroon.
              </p>
              <div className="flex gap-4">
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Column 2: Quick Links */}
            <div>
              <h4 data-i18n="landing.footer_quicklinks" className="text-white !font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="#features"
                    data-i18n="landing.footer_features"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link 
                    to="#routes"
                    data-i18n="landing.footer_routes"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Routes
                  </Link>
                </li>
                <li>
                  <Link to="/signup" data-i18n="landing.footer_booknow" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Book Now
                  </Link>
                </li>
                <li>
                  <Link to="/login" data-i18n="landing.footer_myaccount" className="text-gray-400 hover:text-white transition-colors text-sm">
                    My Account
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Column 3: Support */}
            <div>
              <h4 data-i18n="landing.footer_support" className="text-white !font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/help-support" data-i18n="landing.footer_helpcenter" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-service" data-i18n="landing.footer_terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" data-i18n="landing.footer_privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" data-i18n="landing.footer_refund" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Column 4: Contact */}
            <div>
              <h4 data-i18n="landing.footer_contact" className="text-white !font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>+237 680641043</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="break-all">investorhonourable01@gmail.com</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Yaoundé-Bastos, Cameroon</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 md:pt-8 text-center text-xs sm:text-sm text-gray-500">
            <p>© 2026 CamTransit. All rights reserved. Made with ❤️ in Cameroon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
