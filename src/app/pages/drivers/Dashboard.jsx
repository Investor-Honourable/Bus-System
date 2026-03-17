import { useState, useEffect } from "react";
import { Bus, Users, MapPin, Clock, CheckCircle, AlertCircle, ArrowRight, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { useNavigate } from "react-router";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayTrips: 0,
    totalPassengers: 0,
    completedTrips: 0,
    upcomingTrips: 0
  });
  const [todayTrips, setTodayTrips] = useState([]);
  const [nextTrip, setNextTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      
      // Fetch trips assigned to this driver
      const response = await fetch("http://localhost/Bus_system/api/dashboards/drivers/my_trips.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: user.id })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        const trips = data.data || [];
        
        // Use local date instead of UTC
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + 
          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
          String(today.getDate()).padStart(2, '0');
        const todayTripsList = trips.filter(t => t.departure_date === todayStr);
        
        // Sort by departure time to find next trip
        const sortedTrips = [...todayTripsList].sort((a, b) => 
          a.departure_time.localeCompare(b.departure_time)
        );
        
        // Find next upcoming trip (not completed)
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 8);
        const next = sortedTrips.find(t => t.departure_time > currentTime && t.status !== "completed");
        
        setNextTrip(next);
        setTodayTrips(todayTripsList);
        
        const completed = trips.filter(t => t.status === "completed").length;
        const upcoming = trips.filter(t => t.status === "scheduled" || t.status === "confirmed" || t.status === "in-progress" || t.status === "ongoing").length;
        
        // Calculate total passengers from all trips
        const totalPassengers = trips.reduce((sum, t) => sum + (parseInt(t.booked_seats) || 0), 0);
        
        setStats({
          todayTrips: todayTripsList.length,
          totalPassengers,
          completedTrips: completed,
          upcomingTrips: upcoming
        });
      }
    } catch (error) {
      console.error("Error fetching driver data:", error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Driver Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your today's overview</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Today's Trips</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.todayTrips}</p>
                <p className="text-xs text-orange-600 mt-1">{todayTrips.length} scheduled</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-orange-200 flex items-center justify-center">
                <Bus className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Passengers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPassengers}</p>
                <p className="text-xs text-blue-600 mt-1">all time</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-blue-200 flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completedTrips}</p>
                <p className="text-xs text-green-600 mt-1">trips</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-green-200 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.upcomingTrips}</p>
                <p className="text-xs text-purple-600 mt-1">trips</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-purple-200 flex items-center justify-center">
                <Clock className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Trip Card */}
      {nextTrip && (
        <Card className="border-2 border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Next Departure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-lg">{nextTrip.origin}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-orange-500" />
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-lg">{nextTrip.destination}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(nextTrip.departure_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus className="w-4 h-4" />
                    {nextTrip.bus_number}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {nextTrip.booked_seats || 0} passengers
                  </span>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/dashboard/driver/trips")}
                className="bg-orange-500 hover:bg-orange-600"
              >
                View Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Trips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Today's Trips</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/driver/trips")}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading trips...</div>
          ) : todayTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No trips scheduled for today</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {todayTrips.slice(0, 4).map((trip) => (
                <div 
                  key={trip.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Bus className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{trip.origin} → {trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(trip.departure_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {trip.booked_seats || 0}/{trip.available_seats}
                        </span>
                        <span className="flex items-center gap-1">
                          {trip.bus_number}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate("/dashboard/driver/scan")}
        >
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Bus className="w-5 h-5 text-orange-600" />
          </div>
          <span className="font-medium">Scan Ticket</span>
          <span className="text-xs text-gray-500">Verify passenger bookings</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate("/dashboard/driver/passengers")}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-medium">Passengers</span>
          <span className="text-xs text-gray-500">View & confirm passengers</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate("/dashboard/driver/notifications")}
        >
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <span className="font-medium">Notifications</span>
          <span className="text-xs text-gray-500">View alerts & updates</span>
        </Button>
      </div>
    </div>
  );
}
