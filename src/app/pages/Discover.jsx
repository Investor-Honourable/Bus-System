import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { 
  MapPin, Star, Clock, DollarSign, Users, TrendingUp, ArrowRight, 
  Search, Bus, Calendar, Phone, Mail, User, CreditCard, CheckCircle,
  ChevronLeft, ChevronRight, Wifi, Coffee, Power, ArrowLeft, AlertCircle,
  Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.jsx";
import { toast } from "sonner";

// Cities for search
const CAMEROON_CITIES = [
  "Douala", "Yaoundé", "Bafoussam", "Bamenda", "Kribi", 
  "Limbe", "Garoua", "Maroua", "Ngaoundéré", "Edea",
  "Kumba", "Buea", "Ebolowa", "Bertoua", "Doume"
];

export function Discover() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Search form state
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchPassengers, setSearchPassengers] = useState(1);
  const [tripType, setTripType] = useState("one-way");
  const [isSearching, setIsSearching] = useState(false);
  
  // Booking flow state
  const [bookingStep, setBookingStep] = useState("search"); // search, results, seats, passenger, review, payment, confirmation
  const [searchResults, setSearchResults] = useState([]);
  
  // Seat selection state
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  
  // Passenger details state
  const [passengerDetails, setPassengerDetails] = useState({
    fullName: "",
    phone: "",
    email: "",
    specialRequests: "",
    idNumber: ""
  });
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");

  useEffect(() => {
    // If search params exist, use them
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");
    
    if (from) setSearchFrom(from);
    if (to) setSearchTo(to);
    if (date) setSearchDate(date);
    
    // Initial fetch - ensure data exists first
    ensureDataExists();
  }, []);

  const ensureDataExists = async () => {
    try {
      // Run auto_setup to create sample data - wait for it to complete
      const setupResponse = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto_setup" }),
      });
      
      const setupData = await setupResponse.json();
      console.log("Auto setup response:", setupData);
      
      // Wait a bit for data to be inserted
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then fetch routes
      fetchRoutes();
    } catch (e) {
      console.log("Auto setup error:", e);
      // Try to fetch routes anyway - they might exist
      fetchRoutes();
    }
  };

  const fetchRoutes = async () => {
    setIsLoading(true);
    try {
      // First try to get routes directly
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_all_routes" }),
      });

      const data = await response.json();
      console.log("Routes API response:", data);

      // Handle both success and error responses
      if (data.routes && data.routes.length > 0) {
        const mappedRoutes = data.routes.map((route, index) => ({
          id: route.id || index + 1,
          name: `${route.origin} - ${route.destination}`,
          from: route.origin,
          to: route.destination,
          image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
          duration: `${Math.floor((route.duration_minutes || 180) / 60)}h ${(route.duration_minutes || 180) % 60}m`,
          distance: `${route.distance_km || 0} km`,
          price: (route.base_price || 0).toLocaleString(),
          rating: 4.5 + Math.random() * 0.5,
          reviews: Math.floor(100 + Math.random() * 200),
          description: `Route from ${route.origin} to ${route.destination}`,
          popular: index < 3,
          seatsAvailable: 50,
          nextDeparture: "Various",
          tripId: route.id,
          busType: 'Standard',
          busNumber: '',
          departureDate: '',
          departureTime: '',
          arrivalTime: '',
          busId: 0,
          totalSeats: 50,
          amenities: [],
        }));
        setRoutes(mappedRoutes);
      } else {
        // No routes found, set empty array
        console.log("No routes found in response");
        setRoutes([]);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform search with given parameters - searches routes directly, not trips
  const performSearch = async (origin, destination, date) => {
    if (!origin || !destination) {
      toast.error("Please select departure and destination cities");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setBookingStep("results");

    try {
      // Search for routes that match origin and destination
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_all_routes"
        }),
      });

      const data = await response.json();
      console.log("Routes response:", data);

      // Filter routes that match the search
      let matchedRoutes = [];
      if (data.routes) {
        matchedRoutes = data.routes.filter(route => 
          route.origin.toLowerCase().includes(origin.toLowerCase()) ||
          route.destination.toLowerCase().includes(destination.toLowerCase())
        );
      }

      // If no routes found, try direct match
      if (matchedRoutes.length === 0 && data.routes) {
        matchedRoutes = data.routes.filter(route => 
          (route.origin.toLowerCase() === origin.toLowerCase() && 
           route.destination.toLowerCase() === destination.toLowerCase()) ||
          (route.origin.toLowerCase() === destination.toLowerCase() && 
           route.destination.toLowerCase() === origin.toLowerCase())
        );
      }

      if (matchedRoutes.length > 0) {
        // Convert routes to trip format for display
        const trips = matchedRoutes.map((route, index) => ({
          id: route.id || index + 1,
          name: `${route.origin} - ${route.destination}`,
          from: route.origin,
          to: route.destination,
          image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
          duration: `${Math.floor((route.duration_minutes || 180) / 60)}h ${(route.duration_minutes || 180) % 60}m`,
          distance: `${route.distance_km || 0} km`,
          price: parseInt(route.base_price || 3000),
          priceFormatted: (route.base_price || 3000).toLocaleString(),
          rating: 4.5 + Math.random() * 0.5,
          reviews: Math.floor(100 + Math.random() * 200),
          description: `Route from ${route.origin} to ${route.destination}`,
          popular: index < 3,
          seatsAvailable: 50,
          nextDeparture: "Available today",
          tripId: route.id,
          busType: 'Standard',
          busNumber: '',
          busName: '',
          departureDate: date || new Date().toISOString().split('T')[0],
          departureTime: '09:00:00',
          arrivalTime: '',
          busId: 1,
          totalSeats: 50,
          amenities: ['WiFi', 'AC'],
          routeId: route.id,
          isRouteOnly: true // Flag to indicate this is a route, not a trip
        }));
        setSearchResults(trips);
        toast.success(`Found ${trips.length} routes!`);
      } else {
        toast.error("No routes found for this search");
      }
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Failed to search. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    // Allow search without filters to show all available trips
    // But require at least one filter if searching
    if (!searchFrom && !searchTo && !searchDate) {
      // If no filters, just show all available trips
      setIsSearching(true);
      setSearchResults([]);
      setBookingStep("results");
      
      try {
        const response = await fetch("/api/index.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "search_trips" }),
        });

        let data = await response.json();
        
        // If still no trips, try auto_setup
        if (data.status === "success" && (!data.trips || data.trips.length === 0)) {
          toast.info("No trips found. Setting up sample data...");
          
          await fetch("/api/index.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "auto_setup" }),
          });
          
          // Try again
          const retryResponse = await fetch("/api/index.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "search_trips" }),
          });
          data = await retryResponse.json();
        }

        if (data.status === "success" && data.trips && data.trips.length > 0) {
          const trips = data.trips.map((trip, index) => ({
            id: trip.id || index + 1,
            name: `${trip.origin} - ${trip.destination}`,
            from: trip.origin,
            to: trip.destination,
            image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
            duration: `${Math.floor((trip.duration_minutes || 180) / 60)}h ${(trip.duration_minutes || 180) % 60}m`,
            distance: `${trip.distance_km || 0} km`,
            price: parseInt(trip.price || 0),
            priceFormatted: (trip.price || 0).toLocaleString(),
            rating: 4.5 + Math.random() * 0.5,
            reviews: Math.floor(100 + Math.random() * 200),
            description: `Route from ${trip.origin} to ${trip.destination}`,
            popular: index < 3,
            seatsAvailable: trip.available_seats || 0,
            nextDeparture: trip.departure_time ? new Date(`2000-01-01T${trip.departure_time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "N/A",
            tripId: trip.id,
            busType: trip.bus_type || 'Standard',
            busNumber: trip.bus_number || '',
            busName: trip.bus_name || '',
            departureDate: trip.departure_date,
            departureTime: trip.departure_time,
            arrivalTime: trip.arrival_time,
            busId: trip.bus_id,
            totalSeats: trip.total_seats || 50,
            amenities: trip.amenities || [],
          }));
          setSearchResults(trips);
        }
      } catch (error) {
        console.error("Error searching trips:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    // Original search with filters
    if (!searchFrom || !searchTo) {
      toast.error("Please select departure and destination cities");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setBookingStep("results");

    try {
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search_trips",
          origin: searchFrom,
          destination: searchTo,
          date: searchDate
        }),
      });

      let data = await response.json();

      // If no trips found, try to auto-setup sample data
      if (data.status === "success" && (!data.trips || data.trips.length === 0)) {
        toast.info("No trips found. Setting up sample data...");
        
        const setupResponse = await fetch("/api/index.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "auto_setup" }),
        });
        
        const setupData = await setupResponse.json();
        
        if (setupData.setup) {
          toast.success("Sample data created! Searching again...");
          
          // Try searching again WITHOUT date filter to find available trips
          const retryResponse = await fetch("/api/index.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "search_trips",
              origin: searchFrom,
              destination: searchTo
            }),
          });
          
          data = await retryResponse.json();
        }
      }

      if (data.status === "success" && data.trips && data.trips.length > 0) {
        const trips = data.trips.map((trip, index) => ({
          id: trip.id || index + 1,
          name: `${trip.origin} - ${trip.destination}`,
          from: trip.origin,
          to: trip.destination,
          image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
          duration: `${Math.floor((trip.duration_minutes || 180) / 60)}h ${(trip.duration_minutes || 180) % 60}m`,
          distance: `${trip.distance_km || 0} km`,
          price: parseInt(trip.price || 0),
          priceFormatted: (trip.price || 0).toLocaleString(),
          rating: 4.5 + Math.random() * 0.5,
          reviews: Math.floor(100 + Math.random() * 200),
          description: `Route from ${trip.origin} to ${trip.destination}`,
          popular: index < 3,
          seatsAvailable: trip.available_seats || 0,
          nextDeparture: trip.departure_time ? new Date(`2000-01-01T${trip.departure_time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "N/A",
          tripId: trip.id,
          busType: trip.bus_type || 'Standard',
          busNumber: trip.bus_number || '',
          busName: trip.bus_name || '',
          departureDate: trip.departure_date,
          departureTime: trip.departure_time,
          arrivalTime: trip.arrival_time,
          busId: trip.bus_id,
          totalSeats: trip.total_seats || 50,
          amenities: trip.amenities || [],
        }));
        setSearchResults(trips);
      }
    } catch (error) {
      console.error("Error searching trips:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrip = async (trip) => {
    // If this is a route-only (no actual trip), create a trip first
    if (trip.isRouteOnly) {
      try {
        // Create a trip for this route
        const response = await fetch("/api/index.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_trip_for_route",
            route_id: trip.routeId,
            date: trip.departureDate || new Date().toISOString().split('T')[0]
          }),
        });
        
        const data = await response.json();
        console.log("Create trip response:", data);
        
        if (data.trip_id) {
          // Update trip with the new trip ID
          trip = {
            ...trip,
            tripId: data.trip_id,
            isRouteOnly: false
          };
        }
      } catch (error) {
        console.error("Error creating trip:", error);
      }
    }
    
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setBookingStep("seats");
    
    // Load booked seats
    if (trip.tripId) {
      fetchBookedSeats(trip.tripId);
    }
  };

  const fetchBookedSeats = async (tripId) => {
    if (!tripId) return;
    
    setIsLoadingSeats(true);
    try {
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_booked_seats",
          trip_id: tripId
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setBookedSeats(data.booked_seats || []);
        
        // Check if any of our selected seats became unavailable
        const newlyBooked = selectedSeats.filter(s => data.booked_seats.includes(s));
        if (newlyBooked.length > 0) {
          toast.error(`Seats ${newlyBooked.join(', ')} have just been booked. Please select different seats.`);
          setSelectedSeats(prev => prev.filter(s => !newlyBooked.includes(s)));
        }
      }
    } catch (error) {
      console.error("Error loading booked seats:", error);
    } finally {
      setIsLoadingSeats(false);
    }
  };

  // Auto-refresh seats every 30 seconds when on seat selection
  useEffect(() => {
    if (bookingStep === "seats" && selectedTrip?.tripId) {
      const interval = setInterval(() => {
        fetchBookedSeats(selectedTrip.tripId);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [bookingStep, selectedTrip]);

  const toggleSeat = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return;
    
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber);
      } else if (prev.length < searchPassengers) {
        return [...prev, seatNumber].sort((a, b) => a - b);
      }
      return prev;
    });
  };

  const handleContinueToPassenger = async () => {
    if (selectedSeats.length !== searchPassengers) {
      toast.error(`Please select exactly ${searchPassengers} seat(s)`);
      return;
    }
    
    // Validate seats are still available before proceeding
    setIsLoadingSeats(true);
    try {
      const tripId = selectedTrip.tripId || selectedTrip.id;
      
      if (!tripId) {
        // Skip validation if no trip ID, proceed anyway
        setBookingStep("passenger");
        setIsLoadingSeats(false);
        return;
      }
      
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_seats",
          trip_id: tripId,
          seat_numbers: selectedSeats
        }),
      });

      const data = await response.json();

      if (data.status !== "success") {
        toast.error(data.message || "Selected seats are no longer available. Please select different seats.");
        fetchBookedSeats(tripId);
        setIsLoadingSeats(false);
        return;
      }
      
      // Pre-fill user data if logged in
      if (currentUser.name) {
        setPassengerDetails(prev => ({
          ...prev,
          fullName: prev.fullName || currentUser.name || "",
          email: prev.email || currentUser.email || "",
          phone: prev.phone || currentUser.phone || ""
        }));
      }
      
      setBookingStep("passenger");
    } catch (error) {
      console.error("Seat validation error:", error);
      // On network error, proceed anyway (validation will happen at booking time)
      toast.warning("Could not validate seats. Proceeding anyway - booking will validate seats.");
      
      // Pre-fill user data if logged in
      if (currentUser.name) {
        setPassengerDetails(prev => ({
          ...prev,
          fullName: prev.fullName || currentUser.name || "",
          email: prev.email || currentUser.email || "",
          phone: prev.phone || currentUser.phone || ""
        }));
      }
      
      setBookingStep("passenger");
    } finally {
      setIsLoadingSeats(false);
    }
  };

  const handleContinueToReview = () => {
    // Validate all required fields
    const errors = [];
    
    if (!passengerDetails.fullName || passengerDetails.fullName.trim().length < 3) {
      errors.push("Full name is required (minimum 3 characters)");
    }
    
    if (!passengerDetails.phone || passengerDetails.phone.trim().length < 9) {
      errors.push("Valid phone number is required");
    }
    
    if (!passengerDetails.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passengerDetails.email)) {
      errors.push("Valid email address is required");
    }
    
    if (!passengerDetails.idNumber || passengerDetails.idNumber.trim().length < 5) {
      errors.push("Valid ID number is required (National ID or Passport)");
    }
    
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }
    
    setBookingStep("review");
  };

  const handleContinueToPayment = async () => {
    // Check if user is logged in
    if (!currentUser.id) {
      toast.error("Please log in to complete your booking");
      // Store the booking step to return after login
      localStorage.setItem('pending_booking', JSON.stringify({
        selectedTrip,
        selectedSeats,
        passengerDetails,
        searchPassengers
      }));
      navigate('/login');
      return;
    }
    setBookingStep("payment");
  };

  const handleConfirmPayment = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);

    try {
      const userId = currentUser.id || 0;
      const tripId = selectedTrip.tripId || selectedTrip.id;
      
      console.log("Creating booking - tripId:", tripId, "userId:", userId);
      
      // Skip validation and directly create booking
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_booking",
          user_id: userId,
          trip_id: tripId,
          seats: selectedSeats.length || 1,
          seat_numbers: selectedSeats.join(',') || '1',
          passenger_name: passengerDetails.fullName,
          passenger_phone: passengerDetails.phone,
          passenger_email: passengerDetails.email,
          id_number: passengerDetails.idNumber,
          special_requests: passengerDetails.specialRequests,
          payment_method: paymentMethod
        }),
      });

      const data = await response.json();
      console.log("Booking response:", data);

      if (data.status === "success") {
        toast.success("Booking confirmed successfully!");
        setBookingRef(data.booking?.reference || 'CT' + Date.now());
        setBookingSuccess(true);
        setBookingStep("confirmation");
        
        // Show detailed toast notifications (API already creates notifications in database)
        toast.success("🎫 Tickets issued: " + (data.booking?.tickets?.length || 0) + " ticket(s)");
        toast.info("💳 Payment receipt generated");
        toast.info("💺 Seats allocated for your trip");
        
        // Refresh the notification count
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
      } else {
        toast.error(data.message || "Booking failed. Please try again.");
        if (data.taken_seats) {
          fetchBookedSeats(tripId);
        }
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Unable to connect to server. Please check your internet connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (bookingStep === "results") {
      setBookingStep("search");
    } else if (bookingStep === "seats") {
      setBookingStep("results");
    } else if (bookingStep === "passenger") {
      setBookingStep("seats");
    } else if (bookingStep === "review") {
      setBookingStep("passenger");
    } else if (bookingStep === "payment") {
      setBookingStep("review");
    } else if (bookingStep === "confirmation") {
      setBookingStep("search");
      setSearchResults([]);
      setSelectedTrip(null);
      setSelectedSeats([]);
    }
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    if (time.includes(':')) {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    return time;
  };

  const calculateArrivalTime = (departure, duration) => {
    if (!departure || !duration) return "N/A";
    const [hours, mins] = duration.replace('h', '').replace('m', '').split(' ').map(Number);
    const totalMinutes = (hours || 0) * 60 + (mins || 0);
    const depDate = new Date(`2000-01-01T${departure}`);
    const arrival = new Date(depDate.getTime() + totalMinutes * 60000);
    return arrival.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Render bus seat layout
  const renderBusSeats = () => {
    const totalRows = 10;
    const seatsPerRow = 5;
    
    return (
      <div className="space-y-3">
        <div className="bg-gray-800 text-white text-center py-2 rounded-t-lg flex justify-center items-center gap-2">
          <Bus className="w-4 h-4" />
          <span className="text-sm font-medium">Bus Entrance/Exit</span>
        </div>
        
        <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
          {Array.from({ length: totalRows * seatsPerRow }, (_, i) => {
            const seatNumber = i + 1;
            const isBooked = bookedSeats.includes(seatNumber);
            const isSelected = selectedSeats.includes(seatNumber);
            const isAvailable = !isBooked && selectedSeats.length < searchPassengers;
            
            return (
              <button
                key={seatNumber}
                onClick={() => toggleSeat(seatNumber)}
                disabled={isBooked || (!isSelected && selectedSeats.length >= searchPassengers)}
                className={`
                  w-10 h-10 rounded-lg text-xs font-medium transition-all
                  ${isBooked 
                    ? 'bg-red-500 text-white cursor-not-allowed' 
                    : isSelected 
                      ? 'bg-blue-600 text-white transform scale-110 shadow-lg'
                      : isAvailable
                        ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-105'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {seatNumber}
              </button>
            );
          })}
        </div>
        
        <div className="bg-gray-800 text-white text-center py-2 rounded-b-lg flex justify-center items-center gap-2">
          <span className="text-sm font-medium">Driver</span>
          <div className="w-8 h-2 bg-yellow-500 rounded"></div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
    );
  };

  // ==================== STEP: SEARCH ====================
  if (bookingStep === "search") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Book Your Trip</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Explore routes and find your perfect journey across Cameroon</p>
        </div>

        {/* Search Form */}
        <Card className="border-2 border-blue-100 shadow-lg">
          <CardContent className="pt-6">
            {/* Trip Type Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setTripType("one-way")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tripType === "one-way" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                One Way
              </button>
              <button
                onClick={() => setTripType("round-trip")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tripType === "round-trip" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Round Trip
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* From */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  From (Departure City)
                </Label>
                <select
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select city</option>
                  {CAMEROON_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* To */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <ArrowRight className="w-4 h-4" />
                  To (Destination City)
                </Label>
                <select
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select city</option>
                  {CAMEROON_CITIES.filter(c => c !== searchFrom).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Travel Date
                </Label>
                <Input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="p-3"
                />
              </div>

              {/* Passengers */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Passengers
                </Label>
                <select
                  value={searchPassengers}
                  onChange={(e) => setSearchPassengers(parseInt(e.target.value))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1,2,3,4,5,6].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full h-[46px] bg-blue-600 hover:bg-blue-700 text-lg font-semibold"
                >
                  {isSearching ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Searching...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Search
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Banner */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white overflow-hidden relative">
          <CardContent className="pt-8 pb-8">
            <div className="relative z-10">
              <Badge className="bg-white/20 text-white border-white/30 mb-3">
                Featured Route
              </Badge>
              <h2 className="text-3xl font-bold mb-2">Special Offer: Douala to Yaoundé</h2>
              <p className="text-blue-100 mb-4 max-w-xl">
                Experience comfort on our most popular route. Book now and save 15% on VIP seats!
              </p>
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>3h 30m journey</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span>From 3,400 XAF (was 4,000)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-white" />
                  <span>4.8 rating</span>
                </div>
              </div>
              <Button 
                className="bg-white text-blue-600 hover:bg-blue-50" 
                onClick={() => {
                  const from = "Douala";
                  const to = "Yaoundé";
                  const date = new Date().toISOString().split('T')[0];
                  setSearchFrom(from);
                  setSearchTo(to);
                  setSearchDate(date);
                  setSearchPassengers(1);
                  // Use setTimeout to allow state to update
                  setTimeout(() => {
                    performSearch(from, to, date);
                  }, 100);
                }}
              >
                Book Now
              </Button>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-white/10 rounded-full -mb-36" />
          </CardContent>
        </Card>

        {/* Available Routes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Available Routes</h2>
          </div>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading routes...</p>
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Routes Available</h3>
              <p className="text-gray-600 mb-6">We couldn't find any available routes. This might be because:</p>
              <ul className="text-sm text-gray-500 mb-6 space-y-1">
                <li>• The system is still setting up</li>
                <li>• There are no scheduled trips for your search</li>
                <li>• All seats are currently booked</li>
              </ul>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsLoading(true);
                    ensureDataExists();
                  }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Routes
                </Button>
                <Button 
                  onClick={() => {
                    setSearchFrom('');
                    setSearchTo('');
                    setSearchDate('');
                    handleSearch();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Search All Routes
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes.map((route) => (
                <Card key={route.id} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={route.image}
                      alt={route.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {route.popular && (
                      <Badge className="absolute top-3 right-3 bg-blue-600 text-white">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    {route.seatsAvailable <= 10 && (
                      <Badge className="absolute top-3 left-3 bg-red-600 text-white">
                        Only {route.seatsAvailable} seats left!
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg mb-1">{route.name}</h3>
                      <div className="flex items-center gap-1 text-white text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{route.from}</span>
                        <ArrowRight className="w-3 h-3 mx-1" />
                        <span>{route.to}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-3">{route.description}</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Duration
                        </span>
                        <span className="font-medium text-gray-900">{route.duration}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Next departure</span>
                        <span className="font-medium text-gray-900">{route.nextDeparture}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-gray-900">{route.rating}</span>
                          <span className="text-gray-400">({route.reviews})</span>
                        </div>
                        <span className="text-gray-500">{route.seatsAvailable} seats left</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Starting from</p>
                        <p className="text-xl font-bold text-blue-600">{route.price} XAF</p>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700" 
                        onClick={(e) => {
                          e.stopPropagation();
                          const from = route.from;
                          const to = route.to;
                          const date = new Date().toISOString().split('T')[0];
                          setSearchFrom(from);
                          setSearchTo(to);
                          setSearchDate(date);
                          setSearchPassengers(1);
                          // Use setTimeout to allow state to update
                          setTimeout(() => {
                            performSearch(from, to, date);
                          }, 100);
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">50+</p>
                  <p className="text-sm text-gray-600">Routes Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">10K+</p>
                  <p className="text-sm text-gray-600">Happy Travelers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">4.8</p>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ==================== STEP: RESULTS ====================
  if (bookingStep === "results") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" size="icon" onClick={handleBack} className="touch-manipulation min-h-[44px] min-w-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Available Trips</h1>
            <p className="text-gray-600">
              {searchFrom} → {searchTo} • {searchDate || 'Any date'} • {searchPassengers} passenger(s)
            </p>
          </div>
        </div>

        {isSearching ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching for available trips...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <Card className="p-12 text-center">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600 mb-2">We couldn't find any trips for your search criteria.</p>
            <p className="text-sm text-gray-500 mb-6">
              {searchFrom && searchTo 
                ? `No trips from "${searchFrom}" to "${searchTo}" available.`
                : "Please select departure and destination cities."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={async () => {
                  // First run auto_setup then search
                  setIsSearching(true);
                  try {
                    await fetch("/api/index.php", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "auto_setup" }),
                    });
                    
                    // Wait and search without filters
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const response = await fetch("/api/index.php", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "search_trips" }),
                    });
                    
                    const data = await response.json();
                    if (data.status === "success" && data.trips) {
                      const trips = data.trips.map((trip, index) => ({
                        id: trip.id || index + 1,
                        name: `${trip.origin} - ${trip.destination}`,
                        from: trip.origin,
                        to: trip.destination,
                        image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
                        duration: `${Math.floor((trip.duration_minutes || 180) / 60)}h ${(trip.duration_minutes || 180) % 60}m`,
                        distance: `${trip.distance_km || 0} km`,
                        price: parseInt(trip.price || 0),
                        priceFormatted: (trip.price || 0).toLocaleString(),
                        rating: 4.5 + Math.random() * 0.5,
                        reviews: Math.floor(100 + Math.random() * 200),
                        description: `Route from ${trip.origin} to ${trip.destination}`,
                        popular: index < 3,
                        seatsAvailable: trip.available_seats || 0,
                        nextDeparture: trip.departure_time ? new Date(`2000-01-01T${trip.departure_time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "N/A",
                        tripId: trip.id,
                        busType: trip.bus_type || 'Standard',
                        busNumber: trip.bus_number || '',
                        busName: trip.bus_name || '',
                        departureDate: trip.departure_date,
                        departureTime: trip.departure_time,
                        arrivalTime: trip.arrival_time,
                        busId: trip.bus_id,
                        totalSeats: trip.total_seats || 50,
                        amenities: trip.amenities || [],
                      }));
                      setSearchResults(trips);
                      toast.success(`Found ${trips.length} available trips!`);
                    }
                  } catch (err) {
                    console.error("Search error:", err);
                    toast.error("Failed to search. Please try again.");
                  } finally {
                    setIsSearching(false);
                  }
                }} 
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search All Dates
              </Button>
              <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700">
                Modify Search
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {searchResults.map((trip) => (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Bus Company & Type */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Bus className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{trip.busName || 'CamTransit'}</h3>
                        <p className="text-sm text-gray-500">{trip.busType} • {trip.busNumber}</p>
                        <div className="flex gap-1 mt-1">
                          {trip.amenities?.includes('wifi') && <Badge variant="outline" className="text-xs"><Wifi className="w-3 h-3 mr-1" />WiFi</Badge>}
                          {trip.amenities?.includes('ac') && <Badge variant="outline" className="text-xs">A/C</Badge>}
                        </div>
                      </div>
                    </div>

                    {/* Times */}
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{formatTime(trip.departureTime || trip.nextDeparture)}</p>
                        <p className="text-sm text-gray-500">{trip.from}</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-xs text-gray-400">{trip.duration}</p>
                        <div className="w-24 h-0.5 bg-gray-300 relative">
                          <ArrowRight className="w-4 h-4 text-gray-400 absolute -right-2 -top-2 bg-white" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{trip.distance}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{formatTime(trip.arrivalTime) || calculateArrivalTime(trip.departureTime || trip.nextDeparture, trip.duration)}</p>
                        <p className="text-sm text-gray-500">{trip.to}</p>
                      </div>
                    </div>

                    {/* Price & Book */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">{trip.priceFormatted || trip.price} XAF</p>
                        <p className="text-sm text-gray-500">per person</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={trip.seatsAvailable > 10 ? "outline" : "destructive"}>
                          {trip.seatsAvailable} seats left
                        </Badge>
                        <Button 
                          onClick={() => handleSelectTrip(trip)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Select Seat
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==================== STEP: SEAT SELECTION ====================
  if (bookingStep === "seats") {
    const totalPrice = selectedTrip?.price * searchPassengers || 0;
    
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" size="icon" onClick={handleBack} className="touch-manipulation min-h-[44px] min-w-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Select Your Seat(s)</h1>
            <p className="text-gray-600 text-sm">
              {selectedTrip?.from} → {selectedTrip?.to} • {searchDate || selectedTrip?.departureDate}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bus Layout */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Bus Seat Map</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchBookedSeats(selectedTrip.tripId)}
                    disabled={isLoadingSeats}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingSeats ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                {isLoadingSeats ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading seat availability...</p>
                  </div>
                ) : (
                  renderBusSeats()
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trip Summary */}
          <div>
            <Card className="sticky top-6">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Trip Summary</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Route</span>
                    <span className="font-medium">{selectedTrip?.from} → {selectedTrip?.to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium">{searchDate || selectedTrip?.departureDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Departure</span>
                    <span className="font-medium">{formatTime(selectedTrip?.departureTime || selectedTrip?.nextDeparture)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bus</span>
                    <span className="font-medium">{selectedTrip?.busType}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Seats Selected</span>
                    <span className="font-medium">{selectedSeats.length} / {searchPassengers}</span>
                  </div>
                  {selectedSeats.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {selectedSeats.map(seat => (
                        <Badge key={seat} className="bg-blue-100 text-blue-700">Seat {seat}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{totalPrice.toLocaleString()} XAF</span>
                  </div>
                </div>

                <Button 
                  onClick={handleContinueToPassenger}
                  disabled={selectedSeats.length !== searchPassengers}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Passenger Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP: PASSENGER DETAILS ====================
  if (bookingStep === "passenger") {
    const totalPrice = selectedTrip?.price * searchPassengers || 0;
    
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" size="icon" onClick={handleBack} className="touch-manipulation min-h-[44px] min-w-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Passenger Details</h1>
            <p className="text-gray-600 text-sm">
              {selectedTrip?.from} → {selectedTrip?.to} • {searchDate || selectedTrip?.departureDate}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Passenger Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        value={passengerDetails.fullName}
                        onChange={(e) => setPassengerDetails(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        value={passengerDetails.phone}
                        onChange={(e) => setPassengerDetails(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="237 6XX XXX XXX"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        value={passengerDetails.email}
                        onChange={(e) => setPassengerDetails(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>ID Number *</Label>
                    <Input
                      value={passengerDetails.idNumber}
                      onChange={(e) => setPassengerDetails(prev => ({ ...prev, idNumber: e.target.value }))}
                      placeholder="National ID / Passport number"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-2">
                    <Label>Special Requests (Optional)</Label>
                    <textarea
                      value={passengerDetails.specialRequests}
                      onChange={(e) => setPassengerDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Wheelchair access, assistance required, etc."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="sticky top-6">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Booking Summary</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Route</span>
                    <span className="font-medium">{selectedTrip?.from} → {selectedTrip?.to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium">{searchDate || selectedTrip?.departureDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Passengers</span>
                    <span className="font-medium">{searchPassengers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seats</span>
                    <span className="font-medium">{selectedSeats.join(', ')}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{totalPrice.toLocaleString()} XAF</span>
                  </div>
                </div>

                <Button 
                  onClick={handleContinueToReview}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Review
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP: REVIEW ====================
  if (bookingStep === "review") {
    const totalPrice = selectedTrip?.price * searchPassengers || 0;
    
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" size="icon" onClick={handleBack} className="touch-manipulation min-h-[44px] min-w-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Review Your Booking</h1>
            <p className="text-gray-600 text-sm">
              {selectedTrip?.from} → {selectedTrip?.to} • {searchDate || selectedTrip?.departureDate}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Review Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  Trip Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Route</p>
                    <p className="font-medium">{selectedTrip?.from} → {selectedTrip?.to}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">{searchDate || selectedTrip?.departureDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Departure Time</p>
                    <p className="font-medium">{formatTime(selectedTrip?.departureTime || selectedTrip?.nextDeparture)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bus Type</p>
                    <p className="font-medium">{selectedTrip?.busType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seat Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Seat Selection
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map(seat => (
                    <Badge key={seat} className="bg-blue-100 text-blue-700 px-3 py-1">
                      Seat {seat}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedSeats.length} passenger(s) • {selectedTrip?.price?.toLocaleString()} XAF each
                </p>
              </CardContent>
            </Card>

            {/* Passenger Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Passenger Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Full Name</p>
                    <p className="font-medium">{passengerDetails.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{passengerDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{passengerDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">ID Number</p>
                    <p className="font-medium">{passengerDetails.idNumber}</p>
                  </div>
                  {passengerDetails.specialRequests && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Special Requests</p>
                      <p className="font-medium">{passengerDetails.specialRequests}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Summary */}
          <div>
            <Card className="sticky top-6">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Price Summary</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ticket Price</span>
                    <span>{selectedTrip?.price?.toLocaleString()} XAF × {selectedSeats.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{totalPrice.toLocaleString()} XAF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Booking Fee</span>
                    <span>0 XAF</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{totalPrice.toLocaleString()} XAF</span>
                  </div>
                </div>

                <Button 
                  onClick={handleContinueToPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Payment
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By proceeding, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP: PAYMENT ====================
  if (bookingStep === "payment") {
    const totalPrice = selectedTrip?.price * searchPassengers || 0;
    
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" size="icon" onClick={handleBack} className="touch-manipulation min-h-[44px] min-w-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment</h1>
            <p className="text-gray-600 text-sm">
              {selectedTrip?.from} → {selectedTrip?.to} • {searchDate || selectedTrip?.departureDate}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
                
                <div className="space-y-3">
                  {/* MTN MoMo */}
                  <div 
                    onClick={() => setPaymentMethod("mtn_momo")}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "mtn_momo" 
                        ? "border-blue-500 bg-blue-50" 
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        M
                      </div>
                      <div>
                        <h4 className="font-semibold">MTN Mobile Money</h4>
                        <p className="text-sm text-gray-500">Pay with MTN MoMo</p>
                      </div>
                      {paymentMethod === "mtn_momo" && (
                        <CheckCircle className="w-6 h-6 text-blue-500 ml-auto" />
                      )}
                    </div>
                  </div>

                  {/* Orange Money */}
                  <div 
                    onClick={() => setPaymentMethod("orange_money")}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "orange_money" 
                        ? "border-blue-500 bg-blue-50" 
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        O
                      </div>
                      <div>
                        <h4 className="font-semibold">Orange Money</h4>
                        <p className="text-sm text-gray-500">Pay with Orange Money</p>
                      </div>
                      {paymentMethod === "orange_money" && (
                        <CheckCircle className="w-6 h-6 text-blue-500 ml-auto" />
                      )}
                    </div>
                  </div>

                  {/* Card */}
                  <div 
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "card" 
                        ? "border-blue-500 bg-blue-50" 
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Credit/Debit Card</h4>
                        <p className="text-sm text-gray-500">Visa, Mastercard</p>
                      </div>
                      {paymentMethod === "card" && (
                        <CheckCircle className="w-6 h-6 text-blue-500 ml-auto" />
                      )}
                    </div>
                  </div>
                </div>

                {paymentMethod && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      You will receive a payment request on your {paymentMethod === 'mtn_momo' ? 'MTN MoMo' : paymentMethod === 'orange_money' ? 'Orange Money' : 'card'}.
                    </p>
                    <p className="text-xs text-gray-500">
                      Total amount: <span className="font-bold text-lg">{totalPrice.toLocaleString()} XAF</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="sticky top-6">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Booking Summary</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Route</span>
                    <span className="font-medium">{selectedTrip?.from} → {selectedTrip?.to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium">{searchDate || selectedTrip?.departureDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time</span>
                    <span className="font-medium">{formatTime(selectedTrip?.departureTime || selectedTrip?.nextDeparture)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Passengers</span>
                    <span className="font-medium">{searchPassengers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seats</span>
                    <span className="font-medium">{selectedSeats.join(', ')}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{searchPassengers} x Ticket</span>
                    <span>{totalPrice.toLocaleString()} XAF</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Booking Fee</span>
                    <span>0 XAF</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{totalPrice.toLocaleString()} XAF</span>
                  </div>
                </div>

                <Button 
                  onClick={handleConfirmPayment}
                  disabled={!paymentMethod || isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Confirm & Pay {totalPrice.toLocaleString()} XAF
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP: CONFIRMATION ====================
  if (bookingStep === "confirmation") {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">Your trip has been successfully booked.</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Booking Reference</p>
              <p className="text-2xl font-bold text-blue-600">{bookingRef}</p>
            </div>

            <div className="text-left space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Route</span>
                <span className="font-medium">{selectedTrip?.from} → {selectedTrip?.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{searchDate || selectedTrip?.departureDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{formatTime(selectedTrip?.departureTime || selectedTrip?.nextDeparture)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Passengers</span>
                <span className="font-medium">{searchPassengers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Seats</span>
                <span className="font-medium">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Passenger</span>
                <span className="font-medium">{passengerDetails.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                <span className="font-medium capitalize">
                  {paymentMethod === 'mtn_momo' ? 'MTN MoMo' : paymentMethod === 'orange_money' ? 'Orange Money' : 'Card'}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              A confirmation has been sent to {passengerDetails.email}
            </p>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/tickets')}
                className="flex-1"
              >
                View Tickets
              </Button>
              <Button 
                onClick={() => {
                  setBookingStep("search");
                  setSearchResults([]);
                  setSelectedTrip(null);
                  setSelectedSeats([]);
                  setPassengerDetails({
                    fullName: "",
                    phone: "",
                    email: "",
                    specialRequests: "",
                    idNumber: ""
                  });
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Book Another Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
