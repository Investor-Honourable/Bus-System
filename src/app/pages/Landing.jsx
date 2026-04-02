import { useState } from "react";
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
  X
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

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img 
                src={logoImage} 
                alt="CamTransit Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-semibold">CamTransit</span>
            </div>

            {/* Center Navigation - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('routes')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Routes
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Contact
              </button>
            </div>

            {/* Right Side Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
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
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                🇨🇲 Proudly Serving Cameroon
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl !font-bold !leading-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Travel Across Cameroon with Comfort & Safety
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 !leading-relaxed">
                Book your bus tickets in seconds. Experience modern, reliable, and affordable travel across all major cities in Cameroon.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Book Your Trip Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => scrollToSection('routes')}
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  View Routes
                </Button>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600 font-medium">4.8/5 from 2,500+ travelers</span>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl rounded-3xl" />
              <img 
                src={heroImage} 
                alt="Modern bus" 
                className="relative rounded-3xl shadow-2xl w-full h-[80px] object-cover"
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Instant Booking</p>
                    <p className="text-xs text-gray-500">Under 2 minutes</p>
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
            <h2 className="text-4xl !font-bold text-gray-900 mb-4">
              Travel Made Simple & Safe
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                <h3 className="text-xl font-semibold text-gray-900">Instant Booking</h3>
                <p className="text-gray-600">
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
                <h3 className="text-xl font-semibold text-gray-900">100% Secure</h3>
                <p className="text-gray-600">
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
                <h3 className="text-xl font-semibold text-gray-900">Modern Fleet</h3>
                <p className="text-gray-600">
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
                <h3 className="text-xl font-semibold text-gray-900">Wide Coverage</h3>
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
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Popular Destinations
            </Badge>
            <h2 className="text-4xl !font-bold text-gray-900 mb-4">
              Where Do You Want to Go?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our most popular routes across Cameroon with competitive prices and comfortable buses.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {routes.map((route, index) => (
              <Card 
                key={index} 
                className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="relative h-48">
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
                <CardContent className="p-6 space-y-4">
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
                  <Link to="/signup" className="block">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
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
            <h2 className="text-4xl !font-bold text-gray-900 mb-4">
              Book in 3 Easy Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our streamlined booking process makes it easy to get your tickets in minutes.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto text-white text-2xl !font-bold">
                1
              </div>
              <h3 className="!text-xl font-semibold text-gray-900">Choose Your Route</h3>
              <p className="text-gray-600">
                Select your departure city, destination, and travel date from our wide range of routes.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto text-white text-2xl !font-bold">
                2
              </div>
              <h3 className="!text-xl font-semibold text-gray-900">Select Your Seat</h3>
              <p className="text-gray-600">
                Pick your preferred seat from our interactive seat map and view real-time availability.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto text-white text-2xl !font-bold">
                3
              </div>
              <h3 className="!text-xl font-semibold text-gray-900">Pay & Travel</h3>
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
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Customer Reviews
            </Badge>
            <h2 className="text-4xl !font-bold text-gray-900 mb-4">
              What Our Travelers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
              <p className="text-blue-100">Happy Travelers</p>
            </div>
            <div>
              <p className="text-5xl !font-bold mb-2">50+</p>
              <p className="text-blue-100">Routes Available</p>
            </div>
            <div>
              <p className="text-5xl !font-bold mb-2">100+</p>
              <p className="text-blue-100">Daily Trips</p>
            </div>
            <div>
              <p className="text-5xl !font-bold mb-2">4.8★</p>
              <p className="text-blue-100">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 space-y-6">
            <h2 className="text-4xl !font-bold text-gray-900">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied travelers across Cameroon. Book your next trip today!
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Column 1: About */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src={logoImage} 
                  alt="CamTransit Logo" 
                  className="w-10 h-10 object-contain"
                />
                <span className="text-xl font-semibold text-white">CamTransit</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Your trusted partner for comfortable and affordable bus travel across Cameroon.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white !font-semibold mb-4">Quick Links</h4>
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
              <h4 className="text-white !font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Column 4: Contact */}
            <div>
              <h4 className="text-white !font-semibold mb-4">Contact Us</h4>
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
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 CamerTransit. All rights reserved. Made with ❤️ in Cameroon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
