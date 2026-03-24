import { useState, useEffect } from "react";
import { MapPin, Clock, Users, Bus, Play, CheckCircle, XCircle, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { useNavigate } from "react-router";

export default function DriverTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("all"); // all, today, upcoming, completed

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
        setTrips(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTripStatus = async (tripId, newStatus) => {
    setUpdating(tripId);
    try {
      const user = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      
      const response = await fetch("/api/dashboards/drivers/update_trip_status.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          trip_id: tripId, 
          status: newStatus,
          driver_id: user.id
        })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        fetchTrips();
      } else {
        alert(data.message || "Failed to update trip status");
      }
    } catch (error) {
      console.error("Error updating trip:", error);
      alert("Failed to update trip status");
    } finally {
      setUpdating(null);
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
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  // Filter trips
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
  const filteredTrips = trips.filter(trip => {
    if (filter === "today") return trip.departure_date === todayStr;
    if (filter === "upcoming") return trip.status === "scheduled" || trip.status === "confirmed" || trip.status === "in-progress" || trip.status === "ongoing";
    if (filter === "completed") return trip.status === "completed";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600 mt-1">View and manage your assigned trips</p>
        </div>
        <Button onClick={fetchTrips} className="w-full sm:w-auto">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "today", "upcoming", "completed"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading trips...</div>
      ) : filteredTrips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">No trips found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Route</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Bus</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Passengers</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{trip.origin} → {trip.destination}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(trip.departure_date)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatTime(trip.departure_time)}</td>
                      <td className="py-3 px-4 text-gray-600">{trip.bus_number}</td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {trip.booked_seats || 0}/{trip.available_seats}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/dashboard/driver/trips/${trip.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {trip.status === "scheduled" && (
                            <Button 
                              size="sm" 
                              onClick={() => updateTripStatus(trip.id, "in-progress")}
                              disabled={updating === trip.id}
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              {updating === trip.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          
                          {(trip.status === "in-progress" || trip.status === "ongoing") && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateTripStatus(trip.id, "completed")}
                              disabled={updating === trip.id}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              {updating === trip.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
