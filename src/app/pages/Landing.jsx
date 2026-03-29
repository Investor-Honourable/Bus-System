import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
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
  Loader2
} from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import logoImage from "../../assets/CamTransit.png";
import heroImage from "../../assets/good bus pic.jpg";
import testimonialImage1 from "../../assets/african-american-man.jpg";
import testimonialImage2 from "../../assets/young-adult-travelling.jpg";

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [routesData, setRoutesData] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState(null);

  // Fetch routes from API
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/dashboards/admin/routes.php');
        const data = await response.json();
        if (data.data) {
          // Take first 6 active routes
          const activeRoutes = data.data
            .filter(route => route.status === 'active' || !route.status)
            .slice(0, 6);
          setRoutesData(activeRoutes);
        }
      } catch (error) {
        console.error('Error fetching routes:', error);
        setRoutesError('Failed to load routes');
      } finally {
        setRoutesLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  // Default routes fallback
  const routeImages = [heroImage, testimonialImage1, testimonialImage2, heroImage, testimonialImage1, testimonialImage2];
  const defaultRoutes = [
    { id: 1, start_point: 'Douala', end_point: 'Yaoundé', base_price: 4000, duration_minutes: 210, image: heroImage },
    { id: 2, start_point: 'Yaoundé', end_point: 'Bafoussam', base_price: 5000, duration_minutes: 255, image: testimonialImage1 },
    { id: 3, start_point: 'Douala', end_point: 'Limbe', base_price: 2000, duration_minutes: 90, image: testimonialImage2 },
    { id: 4, start_point: 'Yaoundé', end_point: 'Garoua', base_price: 12500, duration_minutes: 720, image: heroImage },
    { id: 5, start_point: 'Bafoussam', end_point: 'Bamenda', base_price: 3000, duration_minutes: 120, image: testimonialImage1 },
    { id: 6, start_point: 'Douala', end_point: 'Kribi', base_price: 3500, duration_minutes: 180, image: testimonialImage2 }
  ];

  // Assign images to API routes or use default routes with images
  const processedRoutes = routesData.length > 0 
    ? routesData.map((route, index) => ({ ...route, image: routeImages[index % routeImages.length] }))
    : defaultRoutes;
  
  const displayRoutes = processedRoutes;

  const routes = [
    {
      from: "Douala",
      to: "Yaoundé",
      price: "4,000 XAF",
      duration: "3h 30m",
      trips: "15 trips/day",
      rating: 4.8,
      seats: 12,
      image: heroImage
    },
    {
      from: "Yaoundé",
      to: "Bafoussam",
      price: "5,000 XAF",
      duration: "4h 15m",
      trips: "10 trips/day",
      rating: 4.9,
      seats: 8,
      image: testimonialImage1
    },
    {
      from: "Douala",
      to: "Limbe",
      price: "2,000 XAF",
      duration: "1h 30m",
      trips: "20 trips/day",
      rating: 4.9,
      seats: 5,
      image: testimonialImage2
    },
    {
      from: "Yaoundé",
      to: "Garoua",
      price: "12,500 XAF",
      duration: "12h 00m",
      trips: "4 trips/day",
      rating: 4.7,
      seats: 15,
      image: heroImage
    },
    {
      from: "Bafoussam",
      to: "Bamenda",
      price: "3,000 XAF",
      duration: "2h 00m",
      trips: "8 trips/day",
      rating: 4.6,
      seats: 20,
      image: testimonialImage1
    },
    {
      from: "Douala",
      to: "Kribi",
      price: "3,500 XAF",
      duration: "3h 00m",
      trips: "12 trips/day",
      rating: 4.8,
      seats: 10,
      image: testimonialImage2
    }
  ];

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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img 
                src={logoImage} 
                alt="CamTransit Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>

            {/* Center Navigation - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('routes')}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Routes
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Contact
              </button>
            </div>

            {/* Right Side Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
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
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-3">
              <button 
                onClick={() => scrollToSection('features')}
                className="block w-full text-left py-2 text-gray-600 hover:text-blue-600 font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('routes')}
                className="block w-full text-left py-2 text-gray-600 hover:text-blue-600 font-medium"
              >
                Routes
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="block w-full text-left py-2 text-gray-600 hover:text-blue-600 font-medium"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="block w-full text-left py-2 text-gray-600 hover:text-blue-600 font-medium"
              >
                Contact
              </button>
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full justify-center text-gray-600 hover:text-blue-600">
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
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6">
              <Badge className="bg-blue-100 text-blue-700 px-4 py-1 text-sm">
                🇨🇲 Proudly Serving Cameroon
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Travel Across Cameroon with Comfort & Safety
                </span>
              </h1>
              
              <p className="text-lg text-gray-600">
                Book your bus tickets in seconds. Experience modern, reliable, and affordable travel across all major cities in Cameroon.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6">
                    Book Your Trip Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => scrollToSection('routes')}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  View Routes
                </Button>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-gray-600 font-medium">4.8/5 from 2,500+ travelers</span>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Modern bus" 
                className="rounded-2xl shadow-2xl w-full object-cover h-[400px]"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Instant Booking</p>
                    <p className="text-sm text-gray-500">Under 2 minutes</p>
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
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Travel Made Simple & Safe
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Booking</h3>
                <p className="text-gray-600 text-sm">
                  Book your tickets in under 2 minutes. No queues, no hassle.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 2 */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Secure</h3>
                <p className="text-gray-600 text-sm">
                  Your payment and personal data are protected with top-tier security.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 3 */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Wide Coverage</h3>
                <p className="text-gray-600 text-sm">
                  Connect to all major cities across Cameroon with ease.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 4 */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Modern Fleet</h3>
                <p className="text-gray-600 text-sm">
                  Travel in comfort with our modern, air-conditioned buses.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. POPULAR ROUTES SECTION */}
      <section id="routes" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Where Do You Want to Go?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routesLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : routesError ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                {routesError}
              </div>
            ) : (
              displayRoutes.map((route, index) => (
                <Card 
                  key={route.id || index} 
                  className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="relative h-40">
                    <img 
                      src={route.image || routeImages[index % routeImages.length]} 
                      alt={`${route.start_point} to ${route.end_point}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 right-3 bg-white rounded-full px-2 py-1 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{route.rating || '4.8'}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-1 text-white text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{route.start_point}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{route.end_point}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{Math.floor(route.duration_minutes / 60)}h {route.duration_minutes % 60}m</span>
                      </div>
                      <span>{route.distance_km || '--'} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-blue-600">{route.base_price?.toLocaleString() || '4,000'} XAF</span>
                      <Link to="/signup">
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Book in 3 Easy Steps
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Route</h3>
              <p className="text-gray-600">
                Select your departure city, destination, and travel date from our wide range of routes.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Your Seat</h3>
              <p className="text-gray-600">
                Pick your preferred seat from our interactive seat map and view real-time availability.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Pay & Travel</h3>
              <p className="text-gray-600">
                Complete your payment securely and receive your e-ticket instantly via email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS SECTION */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              What Our Travelers Say
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. STATS SECTION */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <p className="text-4xl font-bold">10K+</p>
              <p className="text-blue-100">Happy Travelers</p>
            </div>
            <div>
              <p className="text-4xl font-bold">50+</p>
              <p className="text-blue-100">Routes Available</p>
            </div>
            <div>
              <p className="text-4xl font-bold">100+</p>
              <p className="text-blue-100">Daily Trips</p>
            </div>
            <div>
              <p className="text-4xl font-bold">4.8★</p>
              <p className="text-blue-100">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="shadow-2xl border-0">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-gray-600 mb-8">
                Join thousands of satisfied travelers across Cameroon. Book your next trip today!
              </p>
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8">
                  Create Free Account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Column 1: About */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src={logoImage} 
                  alt="CamTransit Logo" 
                  className="h-16 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Your trusted partner for comfortable and affordable bus travel across Cameroon.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('routes')}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Routes
                  </button>
                </li>
                <li>
                  <Link to="/signup" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Book Now
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                    My Account
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Column 3: Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/help-support" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-service" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Column 4: Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>+237 680641043</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>investorhonourable01@gmail.com</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Yaoundé-Bastos, Cameroon</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 CamTransit. All rights reserved. Made with ❤️ in Cameroon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
