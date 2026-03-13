import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { MapPin, Clock, Users, Bus, Play, CheckCircle, ArrowLeft, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const fetchTripDetails = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      
      // Fetch trip details
      const tripsResponse = await fetch("http://localhost/Bus_system/api/dashboards/drivers/my_trips.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: user.id })
      });
      const tripsData = await tripsResponse.json();
      
      if (tripsData.status === "success") {
        const foundTrip = tripsData.data?.find(t => t.id === parseInt(id));
        setTrip(foundTrip);
      }
      
      // Fetch passengers
      const passengersResponse = await fetch("http://localhost/Bus_system/api/dashboards/drivers/trip_passengers.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: id })
      });
      const passengersData = await passengersResponse.json();
      
      if (passengersData.status === "success") {
        setPassengers(passengersData.data || []);
      }
    } catch (error) {
      console.error("Error fetching trip details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTripStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch("http://localhost/Bus_system/api/dashboards/drivers/update_trip_status.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: id, status: newStatus })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        fetchTripDetails();
      } else {
        alert(data.message || "Failed to update trip status");
      }
    } catch (error) {
      console.error("Error updating trip:", error);
      alert("Failed to update trip status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100";
      case "in-progress":
      case "ongoing": return "text-blue-600 bg-blue-100";
      case "confirmed": return "text-blue-600 bg-blue-100";
      case "scheduled": return "text-yellow-600 bg-yellow-100";
      case "cancelled": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Trip not found</p>
        <Button onClick={() => navigate("/dashboard/driver/trips")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trips
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/driver/trips")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Details</h1>
          <p className="text-gray-600">Trip #{trip.id}</p>
        </div>
      </div>

      {/* Trip Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Route Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Route Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">From</p>
                  <p className="font-semibold text-lg">{trip.origin}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">To</p>
                  <p className="font-semibold text-lg">{trip.destination}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time & Bus Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule & Bus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-semibold">{formatDate(trip.departure_date)}</p>
                  <p className="text-gray-600">{formatTime(trip.departure_time)} - {formatTime(trip.arrival_time)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bus className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bus</p>
                  <p className="font-semibold">{trip.bus_number}</p>
                  <p className="text-gray-600">{trip.total_seats} seats total</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
              </div>
              
              <div className="flex gap-2">
                {trip.status === "scheduled" && (
                  <Button 
                    onClick={() => updateTripStatus("in-progress")}
                    disabled={updating}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Trip
                  </Button>
                )}
                
                {(trip.status === "in-progress" || trip.status === "ongoing") && (
                  <Button 
                    onClick={() => updateTripStatus("completed")}
                    disabled={updating}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Trip
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passengers Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Passengers Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-2xl">{passengers.length}</p>
                <p className="text-gray-500">passengers booked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Passengers List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Passenger List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {passengers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No passengers booked for this trip</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">#</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Passenger</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Seat</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Ticket Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {passengers.map((passenger, index) => (
                    <tr key={passenger.id || index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-700">
                              {passenger.name?.charAt(0) || "P"}
                            </span>
                          </div>
                          <span className="font-medium">{passenger.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div>
                          {passenger.phone && <p>{passenger.phone}</p>}
                          {passenger.email && <p className="text-xs">{passenger.email}</p>}
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
  );
}
