import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Download, Printer, QrCode, MapPin, Calendar, Clock, User, Ticket } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";

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
        body: JSON.stringify({ action: "get_user_tickets", user_id: userId }),
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
            busName: t.bus_name || "Bus",
            busType: t.bus_type || "Standard",
            departureDate: new Date(t.departure_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            departureTime: t.departure_time,
            arrivalTime: t.arrival_time,
            seatNumber: t.seat_number || "1",
            ticketClass: "Economy",
            price: (t.total_price || 0).toLocaleString(),
            status: t.ticket_status || "active",
            bookingDate: t.created_at ? new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
            bookingRef: t.booking_reference,
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

  const handleDownload = (ticket) => {
    // Create a printable ticket content
    const ticketContent = `
CAMTRANSIT BUS TICKET
========================
Ticket Reference: ${ticket.bookingRef || ticket.id}
Passenger: ${ticket.passengerName}
------------------------
ROUTE INFORMATION
From: ${ticket.routeFrom}
To: ${ticket.routeTo}
------------------------
TRIP DETAILS
Date: ${ticket.departureDate}
Departure: ${ticket.departureTime}
Arrival: ${ticket.arrivalTime}
Bus: ${ticket.busNumber || ticket.busName || 'N/A'}
Seat: ${ticket.seatNumber}
------------------------
PRICE: ${ticket.price} XAF
Status: ${ticket.status.toUpperCase()}
========================
Thank you for traveling with CamTransit!
    `.trim();

    // Create and download a text file
    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.bookingRef || ticket.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = (ticket) => {
    // Open print window with ticket details
    const printContent = `
      <html>
      <head>
        <title>Bus Ticket - ${ticket.bookingRef || ticket.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .ticket { border: 2px dashed #333; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; margin: 8px 0; }
          .label { font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h2>🚌 CamTransit</h2>
            <p>Bus Ticket</p>
          </div>
          <div class="row"><span class="label">Ticket Ref:</span><span>${ticket.bookingRef || ticket.id}</span></div>
          <div class="row"><span class="label">Passenger:</span><span>${ticket.passengerName}</span></div>
          <div class="row"><span class="label">From:</span><span>${ticket.routeFrom}</span></div>
          <div class="row"><span class="label">To:</span><span>${ticket.routeTo}</span></div>
          <div class="row"><span class="label">Date:</span><span>${ticket.departureDate}</span></div>
          <div class="row"><span class="label">Departure:</span><span>${ticket.departureTime}</span></div>
          <div class="row"><span class="label">Arrival:</span><span>${ticket.arrivalTime}</span></div>
          <div class="row"><span class="label">Bus:</span><span>${ticket.busNumber || ticket.busName || 'N/A'}</span></div>
          <div class="row"><span class="label">Seat:</span><span>${ticket.seatNumber}</span></div>
          <div class="row"><span class="label">Price:</span><span>${ticket.price} XAF</span></div>
          <div class="row"><span class="label">Status:</span><span>${ticket.status.toUpperCase()}</span></div>
          <div class="footer">
            <p>Thank you for traveling with CamTransit!</p>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
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
                  <h3 className="text-xl font-bold">{ticket.bookingRef || `TKT-${ticket.id}`}</h3>
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
                  <p className="text-xs text-gray-500 mb-1">Bus</p>
                  <p className="text-sm font-medium text-gray-900">{ticket.busNumber || ticket.busName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Seat</p>
                  <p className="text-sm font-medium text-gray-900">{ticket.seatNumber}</p>
                </div>
              </div>

              {/* QR Code and Price */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                    <QrCode className="w-10 h-10 text-gray-600" />
                    <span className="text-[8px] text-gray-400">{String(ticket.id || '').slice(0, 8)}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ticket Ref</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.bookingRef || `TKT-${ticket.id}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{ticket.price} XAF</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => handleDownload(ticket)}
                  disabled={ticket.status === 'cancelled'}
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => handlePrint(ticket)}
                  disabled={ticket.status === 'cancelled'}
                >
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
