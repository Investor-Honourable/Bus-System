import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MapPin, Clock, Calendar, CalendarIcon, ArrowRight, Bus, Ticket, Search, Download, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog.jsx";
import { toast } from "sonner";

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem("busfare_current_user") || "{}"));
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [stats, setStats] = useState([
    {
      label: "Completed Trips",
      value: "0",
      subtitle: "This year",
      icon: Bus,
      color: "blue",
    },
    {
      label: "Upcoming Trips",
      value: "0",
      subtitle: "Next 7 days",
      icon: CalendarIcon,
      color: "purple",
    },
    {
      label: "Total Spent",
      value: "0",
      subtitle: "XAF this year",
      icon: Ticket,
      color: "green",
    },
    {
      label: "Favorite Route",
      value: "N/A",
      subtitle: "Most traveled",
      icon: MapPin,
      color: "orange",
    },
  ]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [allUpcomingTrips, setAllUpcomingTrips] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllTrips, setShowAllTrips] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);

  useEffect(() => {
    // Auto-setup sample data FIRST, then fetch dashboard data
    autoSetupData();
  }, []);

  const autoSetupData = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      const userId = currentUser.id || 0;
      
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto_setup", user_id: userId }),
      });
      const data = await response.json();
      console.log("Auto setup response:", data);
      
      // Small delay to ensure data is created
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.log("Auto setup error:", e);
    }
    
    // Always fetch dashboard data
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    try {
      const currentUser = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      const userId = currentUser.id || 0;

      // Fetch stats
      let statsData = { status: 'error', stats: null };
      try {
        const statsResponse = await fetch("/api/index.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_stats", user_id: userId }),
        });
        statsData = await statsResponse.json();
        console.log("Stats API response:", statsData);
      } catch (e) {
        console.log("Stats fetch error:", e);
      }

      if (statsData.status === "success" && statsData.stats) {
        setStats([
          {
            label: "Completed Trips",
            value: statsData.stats.completed_trips?.toString() || "0",
            subtitle: "This year",
            icon: Bus,
            color: "blue",
          },
          {
            label: "Upcoming Trips",
            value: parseInt(statsData.stats.upcoming_trips) || "0",
            subtitle: "Next 7 days",
            icon: CalendarIcon,
            color: "purple",
          },
          {
            label: "Total Spent",
            value: Number(statsData.stats.total_spent || 0).toLocaleString() + " XAF",
            subtitle: "This year",
            icon: Ticket,
            color: "green",
          },
          {
            label: "Favorite Route",
            value: statsData.stats.favorite_route || "N/A",
            subtitle: "Most traveled",
            icon: MapPin,
            color: "orange",
          },
        ]);
      }

      // Fetch bookings
      let bookingsData = { status: 'error', bookings: [] };
      try {
        const bookingsResponse = await fetch("/api/index.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_bookings", user_id: userId }),
        });
        bookingsData = await bookingsResponse.json();
        console.log("Bookings API response:", bookingsData);
      } catch (e) {
        console.log("Bookings fetch error:", e);
      }

      const now = new Date();
      
      if (bookingsData.status === "success" && bookingsData.bookings && bookingsData.bookings.length > 0) {
        const bookings = bookingsData.bookings;
        
        // Get all confirmed bookings as upcoming trips
        const upcoming = bookings
          .filter((b) => b.booking_status === "confirmed" || b.booking_status === "pending")
          .slice(0, 10)
          .map((b) => ({
            id: b.id,
            route: `${b.origin} → ${b.destination}`,
            date: new Date(b.departure_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
            time: b.departure_time,
            arrival: b.arrival_time,
            duration: b.duration_minutes ? `${Math.floor(b.duration_minutes/60)}h ${b.duration_minutes%60}m` : "",
            busType: b.bus_type || "Standard",
            seat: b.seat_numbers || b.seat_number || "1",
            price: (b.total_price || b.price || 0).toLocaleString(),
            status: b.booking_status,
            operator: b.bus_name || "Bus",
            busNumber: b.bus_number || "",
            bookingRef: b.booking_reference,
          }));

        // Store ALL upcoming trips for "View All"
        const allUpcoming = bookings
          .filter((b) => b.booking_status === "confirmed" || b.booking_status === "pending")
          .map((b) => ({
            id: b.id,
            route: `${b.origin} → ${b.destination}`,
            origin: b.origin,
            destination: b.destination,
            date: new Date(b.departure_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
            rawDate: b.departure_date,
            time: b.departure_time,
            arrival: b.arrival_time,
            duration: b.duration_minutes ? `${Math.floor(b.duration_minutes/60)}h ${b.duration_minutes%60}m` : "",
            busType: b.bus_type || "Standard",
            seat: b.seat_numbers || b.seat_number || "1",
            numSeats: b.number_of_seats || 1,
            price: (b.total_price || b.price || 0).toLocaleString(),
            rawPrice: b.total_price || b.price || 0,
            status: b.booking_status,
            operator: b.bus_name || "Bus",
            busNumber: b.bus_number || "",
            bookingRef: b.booking_reference,
          }));

        const past = bookings
          .filter((b) => new Date(b.departure_date) < now || b.booking_status === "completed")
          .slice(0, 5)
          .map((b) => ({
            id: b.id,
            route: `${b.origin} → ${b.destination}`,
            date: new Date(b.booking_date || b.departure_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            time: b.departure_time,
            status: b.booking_status === "completed" ? "completed" : "cancelled",
            price: (b.total_price || 0).toLocaleString(),
            rating: 5,
          }));

        setUpcomingTrips(upcoming);
        setAllUpcomingTrips(allUpcoming);
        setRecentActivity(past.length > 0 ? past : []);
      } else {
        // No bookings
        setUpcomingTrips([]);
        setAllUpcomingTrips([]);
        setRecentActivity([]);
      }
      
      // Always fetch routes for popular routes section
      let routesData = { status: 'error', routes: [] };
      try {
        const routesRes = await fetch("/api/index.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_routes" })
        });
        routesData = await routesRes.json();
        console.log("Routes API response:", routesData);
      } catch (e) {
        console.log("Routes fetch error:", e);
      }
      
      // Parse routes from different API formats
      let routes = [];
      if (routesData?.status === 'success' && routesData?.routes && Array.isArray(routesData.routes)) {
        routes = routesData.routes;
      } else if (routesData?.data && Array.isArray(routesData.data)) {
        routes = routesData.data;
      }
      
      console.log("Parsed routes:", routes);
      
      if (routes.length > 0) {
        const formattedRoutes = routes.slice(0, 5).map(r => ({
          from: r.origin || r.start_point || r.from || 'N/A',
          to: r.destination || r.end_point || r.to || 'N/A',
          price: (r.base_price || r.price || 0).toLocaleString(),
          duration: r.duration_minutes || r.duration || "-",
          trips: "Available"
        }));
        console.log("Formatted routes:", formattedRoutes);
        setPopularRoutes(formattedRoutes);
      } else {
        // Set fallback sample routes
        setPopularRoutes([
          { from: "Douala", to: "Yaoundé", price: "3,500", duration: "3h", trips: "Available" },
          { from: "Douala", to: "Kribi", price: "2,500", duration: "2h", trips: "Available" },
          { from: "Douala", to: "Bafoussam", price: "3,000", duration: "2.5h", trips: "Available" },
          { from: "Yaoundé", to: "Bafoussam", price: "2,800", duration: "2.3h", trips: "Available" },
          { from: "Douala", to: "Limbe", price: "2,000", duration: "1.5h", trips: "Available" }
        ]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Still set fallback data on error
      setPopularRoutes([
        { from: "Douala", to: "Yaoundé", price: "3,500", duration: "3h", trips: "Available" },
        { from: "Douala", to: "Kribi", price: "2,500", duration: "2h", trips: "Available" },
        { from: "Douala", to: "Bafoussam", price: "3,000", duration: "2.5h", trips: "Available" },
        { from: "Yaoundé", to: "Bafoussam", price: "2,800", duration: "2.3h", trips: "Available" },
        { from: "Douala", to: "Limbe", price: "2,000", duration: "1.5h", trips: "Available" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      const userId = currentUser.id || 0;

      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_booking", user_id: userId, booking_id: bookingId }),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast.success("Booking cancelled successfully");
        setShowTicketDialog(false);
        fetchDashboardData();
      } else {
        toast.error(data.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking. Please try again.");
    }
  };

  const handleDownloadTicket = (ticket) => {
    const ticketContent = `
CAMTRANSIT BUS TICKET
========================
Ticket Reference: ${ticket.bookingRef || 'N/A'}
Passenger: ${currentUser.name || 'Passenger'}
------------------------
ROUTE INFORMATION
From: ${ticket.origin || ticket.route.split(' → ')[0]}
To: ${ticket.destination || ticket.route.split(' → ')[1]}
------------------------
TRIP DETAILS
Date: ${ticket.date}
Departure: ${ticket.time}
Arrival: ${ticket.arrival}
Bus: ${ticket.busNumber || ticket.operator}
Seat: ${ticket.seat}
------------------------
PRICE: ${ticket.price} XAF
Status: ${ticket.status.toUpperCase()}
========================
Thank you for traveling with CamTransit!
    `.trim();

    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.bookingRef || ticket.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getColorClass = (color) => {
    const colors = {
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      green: "bg-green-500",
      orange: "bg-orange-500",
    };
    return colors[color] || "bg-blue-500";
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: "bg-green-100 text-green-700 border-green-200",
      completed: "bg-gray-100 text-gray-700 border-gray-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const handleSearch = () => {
    // Navigate to Discover page with search params
    const params = new URLSearchParams();
    if (fromCity) params.set('from', fromCity);
    if (toCity) params.set('to', toCity);
    if (travelDate) params.set('date', travelDate);
    navigate(`/dashboard/discover?${params.toString()}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{t('auth.loginTitle')}, {currentUser?.name || t('passenger.traveler')}!</h1>
        <p className="text-gray-600 text-sm sm:text-base">{t('passenger.planJourney')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${getColorClass(stat.color)} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Book Section */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-600">
        <CardContent className="p-4 sm:p-6">
          <div className="text-white mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Book Your Next Trip</h2>
            <p className="text-blue-100 text-sm">Search for available buses across Cameroon</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="text-white text-sm mb-2 block">From</label>
              <Input 
                placeholder="e.g. Douala" 
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="bg-white/90 border-0 h-11 sm:h-12 touch-manipulation"
              />
            </div>
            <div>
              <label className="text-white text-sm mb-2 block">To</label>
              <Input 
                placeholder="e.g. Yaoundé" 
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="bg-white/90 border-0 h-11 sm:h-12 touch-manipulation"
              />
            </div>
            <div>
              <label className="text-white text-sm mb-2 block">Travel Date</label>
              <Input 
                type="date" 
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="bg-white/90 border-0 h-11 sm:h-12 touch-manipulation"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full h-11 sm:h-12 bg-white text-blue-600 hover:bg-gray-100 font-semibold gap-2 touch-manipulation" onClick={handleSearch}>
                <Search className="w-4 h-4" />
                <span className="sm:hidden">Search</span>
                <span className="hidden sm:inline">Search Buses</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Trips */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Upcoming Trips</CardTitle>
              {allUpcomingTrips.length > 3 && (
                <Button variant="outline" size="sm" onClick={() => setShowAllTrips(true)}>
                  View All ({allUpcomingTrips.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTrips.length > 0 ? (
              <div className="space-y-4">
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 mb-1">{trip.route}</h4>
                        <p className="text-sm text-gray-500">{trip.operator} • Bus {trip.busNumber}</p>
                      </div>
                      <Badge className={getStatusColor(trip.status)}>
                        {trip.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Departure</p>
                        <p className="font-semibold text-gray-900">{trip.time}</p>
                        <p className="text-xs text-gray-600">{trip.date}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-px w-8 bg-gray-300"></div>
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div className="h-px w-8 bg-gray-300"></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{trip.duration}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Arrival</p>
                        <p className="font-semibold text-gray-900">{trip.arrival}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Seat</p>
                          <p className="font-semibold text-gray-900">{trip.seat}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Class</p>
                          <p className="font-semibold text-gray-900">{trip.busType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">{trip.price} XAF</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setSelectedTicket(trip);
                            setShowTicketDialog(true);
                          }}
                        >
                          View Ticket
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No Upcoming Trips</h3>
                <p className="text-gray-500 text-sm mb-4">Book your next adventure now!</p>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/dashboard/discover")}>
                  Book a Trip
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Routes & Recent Activity */}
        <div className="space-y-6">
          {/* Popular Routes */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {popularRoutes.map((route, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors border border-gray-200 hover:border-blue-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span>{route.from}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span>{route.to}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{route.duration}</span>
                      <span>{route.trips}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-sm font-bold text-blue-600">From {route.price} XAF</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">
                          {activity.route}
                        </h4>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">{"⭐".repeat(activity.rating)}</p>
                      <p className="font-bold text-gray-900 text-sm">{activity.price} XAF</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View All Upcoming Trips Dialog */}
      <Dialog open={showAllTrips} onOpenChange={setShowAllTrips}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Upcoming Trips ({allUpcomingTrips.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {allUpcomingTrips.length > 0 ? (
              allUpcomingTrips.map((trip) => (
                <div key={trip.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{trip.route}</h4>
                      <p className="text-sm text-gray-500">{trip.operator} • Bus {trip.busNumber}</p>
                      <p className="text-xs text-gray-400 mt-1">Ref: {trip.bookingRef}</p>
                    </div>
                    <Badge className={getStatusColor(trip.status)}>
                      {trip.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Departure</p>
                      <p className="font-semibold text-gray-900">{trip.time}</p>
                      <p className="text-xs text-gray-600">{trip.date}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-px w-8 bg-gray-300"></div>
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div className="h-px w-8 bg-gray-300"></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{trip.duration || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Arrival</p>
                      <p className="font-semibold text-gray-900">{trip.arrival || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Seat(s)</p>
                        <p className="font-semibold text-gray-900">{trip.seat} {trip.numSeats > 1 && `(x${trip.numSeats})`}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Class</p>
                        <p className="font-semibold text-gray-900">{trip.busType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{trip.price} XAF</p>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setSelectedTicket(trip);
                          setShowTicketDialog(true);
                        }}
                      >
                        View Ticket
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming trips found</p>
                <Button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setShowAllTrips(false);
                    navigate('/dashboard/discover');
                  }}
                >
                  Book a Trip
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Your Bus Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              {/* Ticket Header */}
              <div className="bg-blue-600 text-white p-4 rounded-t-lg -mx-6 -mt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">CamTransit</p>
                    <p className="text-blue-200 text-sm">Bus Ticket</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl">{selectedTicket.price} XAF</p>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Route</p>
                    <p className="font-semibold text-gray-900">{selectedTicket.route}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Booking Ref</p>
                    <p className="font-mono font-semibold text-gray-900">{selectedTicket.bookingRef || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-gray-200 py-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-semibold text-gray-900">{selectedTicket.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Departure</p>
                      <p className="font-semibold text-gray-900">{selectedTicket.time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Arrival</p>
                      <p className="font-semibold text-gray-900">{selectedTicket.arrival}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Seat</p>
                    <p className="font-bold text-xl text-blue-600">{selectedTicket.seat}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bus Type</p>
                    <p className="font-semibold text-gray-900">{selectedTicket.busType}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Operator</p>
                    <p className="font-semibold text-gray-900">{selectedTicket.operator}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bus Number</p>
                    <p className="font-semibold text-gray-900">{selectedTicket.busNumber}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Present this ticket when boarding. Keep it safe until your journey ends.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => handleDownloadTicket(selectedTicket)}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  {selectedTicket.status === "confirmed" && (
                    <Button 
                      variant="destructive" 
                      className="flex-1 gap-2"
                      onClick={() => handleCancelBooking(selectedTicket.id)}
                    >
                      <X className="w-4 h-4" />
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}