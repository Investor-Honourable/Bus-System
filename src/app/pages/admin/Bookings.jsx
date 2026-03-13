import { useState, useEffect } from "react";
import { Ticket, Search, CheckCircle, XCircle, Armchair, Eye, Calendar, User, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
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
  DialogFooter,
} from "../../components/ui/dialog.jsx";

export function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isAssignSeatDialogOpen, setIsAssignSeatDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignedSeats, setAssignedSeats] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboards/admin/bookings.php");
      const data = await response.json();
      if (data.data) setBookings(data.data);
      else if (data.bookings) setBookings(data.bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmBooking = async (bookingId) => {
    try {
      const response = await fetch("/api/dashboards/admin/bookings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", booking_id: bookingId, status: "confirmed" }),
      });
      const data = await response.json();
      if (data.success) {
        fetchBookings();
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
    }
  };

  const cancelBooking = async () => {
    if (!selectedBooking) return;
    try {
      const response = await fetch("/api/dashboards/admin/bookings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_booking", booking_id: selectedBooking.booking_id }),
      });
      const data = await response.json();
      if (data.success) {
        setIsCancelDialogOpen(false);
        setSelectedBooking(null);
        fetchBookings();
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  const assignSeats = async () => {
    if (!selectedBooking || !assignedSeats) return;
    try {
      const response = await fetch("/api/dashboards/admin/bookings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "assign_seats", 
          booking_id: selectedBooking.booking_id, 
          seat_numbers: assignedSeats 
        }),
      });
      const data = await response.json();
      if (data.success || data.message) {
        setIsAssignSeatDialogOpen(false);
        setSelectedBooking(null);
        setAssignedSeats("");
        fetchBookings();
      }
    } catch (error) {
      console.error("Error assigning seats:", error);
    }
  };

  const openViewDialog = (booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const openCancelDialog = (booking) => {
    setSelectedBooking(booking);
    setIsCancelDialogOpen(true);
  };

  const openAssignSeatDialog = (booking) => {
    setSelectedBooking(booking);
    setAssignedSeats(booking.seat_numbers || "");
    setIsAssignSeatDialogOpen(true);
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      booking.booking_id?.toString().includes(searchLower) ||
      booking.passenger_name?.toLowerCase().includes(searchLower) ||
      (`${booking.origin} → ${booking.destination}`).toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || booking.booking_status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      confirmed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      cancelled: "bg-red-100 text-red-700",
      completed: "bg-blue-100 text-blue-700",
    };
    return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-700";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticket Control</h1>
          <p className="text-gray-600 mt-1">View and manage all bookings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <Ticket className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold">{bookings.filter(b => b.booking_status === "confirmed").length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{bookings.filter(b => b.booking_status === "pending").length}</p>
              </div>
              <Ticket className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold">{bookings.filter(b => b.booking_status === "cancelled").length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Passenger</th>
                  <th className="text-left py-3 px-4 font-medium">Route</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Seats</th>
                  <th className="text-left py-3 px-4 font-medium">Seat #</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking.booking_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">#{booking.booking_id}</td>
                      <td className="py-3 px-4">{booking.passenger_name}</td>
                      <td className="py-3 px-4">{booking.origin} → {booking.destination}</td>
                      <td className="py-3 px-4">{booking.departure_date}</td>
                      <td className="py-3 px-4">{booking.number_of_seats}</td>
                      <td className="py-3 px-4">{booking.tickets?.map(t => t.seat_number).join(', ') || "-"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(booking.booking_status)}`}>
                          {booking.booking_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openViewDialog(booking)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {booking.booking_status === "pending" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-green-500"
                              onClick={() => confirmBooking(booking.booking_id)}
                              title="Confirm Booking"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {booking.booking_status !== "cancelled" && booking.booking_status !== "completed" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => openAssignSeatDialog(booking)}
                                title="Assign Seat"
                              >
                                <Armchair className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500"
                                onClick={() => openCancelDialog(booking)}
                                title="Cancel Booking"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-500">
                      <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No bookings found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Booking ID</p>
                  <p className="font-medium">#{selectedBooking.booking_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Passenger</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{selectedBooking.passenger_name}</p>
                </div>
                <p className="text-sm text-gray-400 ml-6">{selectedBooking.passenger_email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Route</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{selectedBooking.route}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Travel Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{selectedBooking.travel_date}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Seats Booked</p>
                  <p className="font-medium">{selectedBooking.seats_booked}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Seat Numbers</p>
                  <p className="font-medium">{selectedBooking.seat_numbers || "Not assigned"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium text-green-600">XAF {selectedBooking.price?.toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to cancel the booking for <strong>{selectedBooking.passenger_name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Route: {selectedBooking.route} on {selectedBooking.travel_date}
              </p>
              <p className="text-red-500 mt-2">This action cannot be undone.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>Keep Booking</Button>
            <Button variant="destructive" onClick={cancelBooking}>Cancel Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Seat Dialog */}
      <Dialog open={isAssignSeatDialogOpen} onOpenChange={setIsAssignSeatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Seats</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Passenger: {selectedBooking.passenger_name}</p>
                <p className="text-xs text-blue-700">Route: {selectedBooking.route}</p>
                <p className="text-xs text-blue-700">Seats needed: {selectedBooking.seats_booked}</p>
              </div>
              <div className="space-y-2">
                <Label>Seat Numbers</Label>
                <Input
                  placeholder="e.g. 1,2,3"
                  value={assignedSeats}
                  onChange={(e) => setAssignedSeats(e.target.value)}
                />
                <p className="text-xs text-gray-500">Enter seat numbers separated by commas</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignSeatDialogOpen(false)}>Cancel</Button>
            <Button onClick={assignSeats}>Assign Seats</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
