import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Download, Printer, QrCode, MapPin, Calendar, Clock, User, Ticket } from "lucide-react";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";

export function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      const userId = currentUser.id || 0;

      // First, try to fix any missing tickets for this user
      try {
        await fetch("/api/index.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fix_tickets", user_id: userId }),
        });
      } catch (fixError) {
        console.log("Fix tickets not available, continuing anyway");
      }

      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_tickets", user_id: userId }),
      });

      const data = await response.json();

      if (data.status === "success" && data.tickets && data.tickets.length > 0) {
        setTickets(
          data.tickets.map((t) => ({
            id: t.ticket_reference || t.id,
            passengerName: t.passenger_name || currentUser.name || "Passenger",
            routeFrom: t.origin,
            routeTo: t.destination,
            busNumber: t.bus_number || "",
            departureDate: new Date(t.departure_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            departureTime: t.departure_time,
            arrivalTime: t.arrival_time,
            seatNumber: t.seat_number || "1",
            ticketClass: "Economy",
            price: (t.total_price || 0).toLocaleString(),
            status: t.ticket_status || "active",
            bookingDate: t.created_at ? new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
          }))
        );
      } else {
        console.log("No tickets or error:", data);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "used":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
        <p className="text-gray-600 mt-1">View and manage your bus tickets</p>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="overflow-hidden hover:shadow-lg transition-shadow border-2"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge className="bg-white/20 text-white border-white/30 mb-2">
                    {ticket.ticketClass}
                  </Badge>
                  <h3 className="text-xl font-bold">{ticket.id}</h3>
                </div>
                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <User className="w-4 h-4" />
                <span>{ticket.passengerName}</span>
              </div>
            </div>

            <CardContent className="pt-6">
              {/* Route Information */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span>From</span>
                    </div>
                    <p className="font-semibold text-gray-900">{ticket.routeFrom}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {ticket.departureTime}
                    </p>
                  </div>
                  <div className="px-4">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-end gap-2 text-sm text-gray-500 mb-1">
                      <span>To</span>
                      <MapPin className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="font-semibold text-gray-900">{ticket.routeTo}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {ticket.arrivalTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{ticket.departureDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bus Number</p>
                  <p className="text-sm font-medium text-gray-900">{ticket.busNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Seat</p>
                  <p className="text-sm font-medium text-gray-900">{ticket.seatNumber}</p>
                </div>
              </div>

              {/* QR Code and Price */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Scan to validate</p>
                    <p className="text-sm font-medium text-gray-900">Mobile ticket</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{ticket.price}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>

              {/* Booking Info */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Booked on {ticket.bookingDate}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for no tickets */}
      {tickets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tickets Found</h3>
            <p className="text-gray-600 mb-4">You haven't booked any tickets yet</p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/dashboard/discover")}
            >
              Book Your First Trip
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
