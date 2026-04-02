import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, Calendar, MapPin, Users, DollarSign, Phone, Mail, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog.jsx";
import { Label } from "../../components/ui/label.jsx";
import { toast } from "sonner";

export function Bookings() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      const userId = currentUser.id || 0;



      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_user_bookings", user_id: userId }),
      });

      const data = await response.json();

      if (data.status === "success" && data.bookings) {
        setBookings(
          data.bookings.map((b) => ({
            id: b.id,
            bookingReference: b.booking_reference,
            routeFrom: b.origin,
            routeTo: b.destination,
            busNumber: b.bus_number,
            departureDate: new Date(b.departure_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            departureTime: b.departure_time,
            seatNumber: b.seat_numbers || b.seat_number || "1",
            ticketClass: b.bus_type || "Standard",
            price: Number(b.total_price || 0),
            status: b.booking_status,
            operator: b.bus_name || "Bus",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter(
    (booking) => {
      const matchesSearch = 
        booking.routeFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.routeTo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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
        toast.info("Your refund will be processed shortly");
        fetchBookings();
        
        // Refresh notifications
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
      } else {
        toast.error(data.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-1">View and manage all your bus reservations</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">View and manage all your bus reservations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {bookings.length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {bookings.filter((b) => b.status === "completed").length}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {bookings
                    .filter(b => b.status === "confirmed")
                    .reduce((sum, b) => sum + Number(b.price || 0), 0)
                    .toLocaleString()} XAF
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, ID, or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={() => setStatusFilter("all")}>
              <Filter className="w-4 h-4" />
              Clear Filter
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No Bookings Found</h3>
              <p className="text-gray-500 text-sm mb-4">
                {searchQuery || statusFilter !== "all" 
                  ? "No bookings match your search criteria"
                  : "You haven't booked any trips yet"}
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/dashboard/discover")}>
                Book Your First Trip
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {booking.routeFrom.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{booking.routeFrom} to {booking.routeTo}</h4>
                        <Badge variant="outline" className="text-xs">
                          {booking.bookingReference}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {booking.operator}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">{booking.price}</p>
                    <Badge
                      variant="outline"
                      className={
                        booking.ticketClass === "Business"
                          ? "bg-amber-50 text-amber-700 border-amber-200 mt-1"
                          : "bg-blue-50 text-blue-700 border-blue-200 mt-1"
                      }
                    >
                      {booking.ticketClass}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Route</p>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span className="font-medium">{booking.routeFrom}</span>
                      <span className="text-gray-400">→</span>
                      <MapPin className="w-3 h-3 text-red-600" />
                      <span className="font-medium">{booking.routeTo}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Bus</p>
                    <p className="text-sm font-medium">{booking.busNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Departure</p>
                    <p className="text-sm font-medium">
                      {booking.departureDate} • {booking.departureTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Seat</p>
                    <p className="text-sm font-medium">{booking.seatNumber}</p>
                  </div>
                </div>
                {(booking.status === "confirmed" || booking.status === "pending") && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel Booking
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </CardContent>
        
      </Card>
    </div>
  );
}