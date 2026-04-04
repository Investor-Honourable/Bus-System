import { useState, useEffect } from "react";
import { Users, Bus, MapPin, Clock, Ticket, Phone, Mail, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";

export default function TripPassengers() {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passengersLoading, setPassengersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      
      const response = await fetch("/api/dashboards/drivers/my_trips.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: user.id })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        const tripsData = data.trips || data.data || [];
        setTrips(tripsData);
        // Auto-select first trip if available
        if (tripsData.length > 0) {
          fetchPassengers(tripsData[0].id);
          setSelectedTrip(tripsData[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPassengers = async (tripId) => {
    setPassengersLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      
      const response = await fetch("/api/dashboards/drivers/trip_passengers.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: tripId, user_id: user.id })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        // API returns passengers in 'passengers' array
        setPassengers(data.passengers || data.data || []);
        setError("");
      } else {
        console.error("Error fetching passengers:", data.message);
        setError(data.message || "Failed to load passengers");
        setPassengers([]);
      }
    } catch (error) {
      console.error("Error fetching passengers:", error);
    } finally {
      setPassengersLoading(false);
    }
  };

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
    fetchPassengers(trip.id);
  };

  const filteredPassengers = passengers.filter(p => 
    p.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.passenger_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.passenger_phone?.includes(searchTerm) ||
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100";
      case "confirmed": return "text-blue-600 bg-blue-100";
      case "scheduled": return "text-yellow-600 bg-yellow-100";
      case "cancelled": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Passengers</h1>
        <p className="text-gray-600 mt-1">View passengers for your trips</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trips List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Select Trip</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading trips...</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No trips available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => handleTripSelect(trip)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTrip?.id === trip.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                      <span className="text-xs text-gray-500">{trip.bus_number} ({trip.total_seats || trip.available_seats || 'N/A'} seats)</span>
                    </div>
                    <div className="font-medium text-sm">{trip.origin} → {trip.destination}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      {trip.departure_date} at {trip.departure_time}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      {trip.booked_seats || 0}/{trip.available_seats || trip.total_seats || 'N/A'} passengers
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Passengers List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg">
                Passengers {selectedTrip && `(${selectedTrip.origin} → ${selectedTrip.destination})`}
              </CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search passengers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTrip ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Select a trip to view passengers</p>
              </div>
            ) : passengersLoading ? (
              <div className="text-center py-12 text-gray-500">Loading passengers...</div>
            ) : filteredPassengers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>{searchTerm ? "No passengers match your search" : "No passengers booked for this trip"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Passenger</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Seat</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Booking Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPassengers.map((passenger, index) => (
                      <tr key={passenger.id || index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-orange-700">
                                {passenger.passenger_name?.charAt(0) || passenger.name?.charAt(0) || "P"}
                              </span>
                            </div>
                            <span className="font-medium">{passenger.passenger_name || passenger.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {passenger.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="w-3 h-3" />
                                {passenger.phone}
                              </div>
                            )}
                            {passenger.passenger_email && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{passenger.passenger_email || passenger.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">Seat {passenger.seat_number || "-"}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Ticket className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-mono">{passenger.booking_ref || "-"}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
