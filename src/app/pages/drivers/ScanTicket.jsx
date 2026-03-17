import { useState } from "react";
import { QrCode, Search, CheckCircle, XCircle, User, Bus, MapPin, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";

export default function ScanTicket() {
  const [ticketCode, setTicketCode] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!ticketCode.trim()) {
      setError("Please enter a ticket code");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearchResult(null);

    try {
      const user = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      
      // Search for booking by ticket code
      const response = await fetch("http://localhost/Bus_system/api/dashboards/drivers/verify_ticket.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          booking_ref: ticketCode.trim(),
          driver_id: user.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Error: " + response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.status === "success" && data.data) {
        // Transform API response to match component expectations
        const ticket = data.data;
        setSearchResult({
          booking_ref: ticket.booking_ref,
          ticket_ref: ticket.ticket_ref,
          user_name: ticket.user_name,
          user_email: ticket.user_email,
          user_phone: ticket.user_phone,
          origin: ticket.origin,
          destination: ticket.destination,
          departure_date: ticket.departure_date,
          departure_time: ticket.departure_time,
          bus_number: ticket.bus_number,
          number_of_seats: ticket.number_of_seats,
          seat_number: ticket.seat_number,
          booking_status: ticket.booking_status,
          ticket_status: ticket.ticket_status,
          is_valid: ticket.is_valid,
          trip_status: ticket.trip_status,
          validation_message: ticket.validation_message
        });
      } else {
        setError(data.message || "Ticket not found. Please check the code and try again.");
      }
    } catch (err) {
      console.error("Error searching ticket:", err);
      setError("Failed to search ticket: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Scan Ticket</h1>
        <p className="text-gray-600 mt-1">Enter ticket code to verify passenger bookings</p>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Enter Ticket Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter ticket code (e.g., BK000001 or CT69B...)"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-lg h-12"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isLoading}
              className="h-12 px-6"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Verify
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Card */}
      {searchResult && (
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Ticket Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Passenger Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Passenger Information
                </h3>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="font-medium text-lg">{searchResult.user_name || "N/A"}</p>
                  <p className="text-gray-500">{searchResult.user_email || "N/A"}</p>
                  <p className="text-gray-500">{searchResult.user_phone || "N/A"}</p>
                </div>
              </div>

              {/* Trip Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bus className="w-4 h-4" />
                  Trip Information
                </h3>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{searchResult.origin} → {searchResult.destination}</span>
                  </div>
                  <p className="text-gray-600">{searchResult.departure_date} at {searchResult.departure_time}</p>
                  <p className="text-gray-600">Bus: {searchResult.bus_number}</p>
                </div>
              </div>

              {/* Booking Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Booking Details
                </h3>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-500">Booking Reference</p>
                  <p className="font-mono font-medium text-lg">{searchResult.booking_ref}</p>
                  {searchResult.ticket_ref && searchResult.ticket_ref !== searchResult.booking_ref && (
                    <>
                      <p className="text-sm text-gray-500 mt-2">Ticket Reference</p>
                      <p className="font-mono text-sm">{searchResult.ticket_ref}</p>
                    </>
                  )}
                  <p className="text-sm text-gray-500 mt-2">Seats: {searchResult.number_of_seats || 1}</p>
                  {searchResult.seat_number && (
                    <p className="text-sm text-gray-500">Seat: {searchResult.seat_number}</p>
                  )}
                  <p className="text-sm text-gray-500">Status: 
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      searchResult.booking_status === 'confirmed' ? 'bg-green-100 text-green-600' : 
                      searchResult.trip_status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {searchResult.trip_status === 'cancelled' ? 'Trip Cancelled' : searchResult.booking_status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Confirmation */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Confirmation</h3>
                <div className={`p-4 rounded-lg border ${
                  searchResult.is_valid 
                    ? 'bg-green-100 border-green-200' 
                    : 'bg-red-100 border-red-200'
                }`}>
                  <div className={`flex items-center gap-2 ${
                    searchResult.is_valid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {searchResult.is_valid ? (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-medium">Valid Ticket</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6" />
                        <span className="font-medium">Invalid Ticket</span>
                      </>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${
                    searchResult.is_valid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {searchResult.validation_message || (searchResult.is_valid 
                      ? `This ticket is valid for the trip from ${searchResult.origin} to ${searchResult.destination}`
                      : 'This ticket cannot be used for the current trip')
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Verify Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Ask the passenger for their ticket code or booking reference</li>
            <li>Enter the code in the search box above (e.g., BK000001 or CT69B0333EE6C2C)</li>
            <li>Click "Verify" to check if the ticket is valid</li>
            <li>Confirm the passenger details match the booking</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
