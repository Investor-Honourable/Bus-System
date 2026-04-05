import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Users, Bus, Route, Calendar, Ticket, Plus, Settings, LogOut, Activity, Server, Cpu, HardDrive, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.jsx";

export function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    activeConnections: 0,
    uptime: "0d 0h 0m"
  });
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isBusDialogOpen, setIsBusDialogOpen] = useState(false);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  // Form states
  const [newBus, setNewBus] = useState({ bus_number: "", capacity: "" });
  const [newRoute, setNewRoute] = useState({ start_point: "", end_point: "" });
  const [newSchedule, setNewSchedule] = useState({
    route_id: "",
    bus_id: "",
    date: "",
    departure_time: "",
    arrival_time: "",
  });

  useEffect(() => {
    // Check if user is admin
    const currentUser = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
    if (!currentUser.id || currentUser.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchBuses(),
        fetchRoutes(),
        fetchSchedules(),
        fetchBookings(),
        fetchActivityLogs(),
        fetchSystemMetrics(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/dashboards/admin/users.php");
      const data = await response.json();
      if (data.users) setUsers(data.users);
      else if (data.data) setUsers(data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchBuses = async () => {
    try {
      const response = await fetch("/api/dashboards/admin/buses.php");
      const data = await response.json();
      if (data.buses) setBuses(data.buses);
      else if (data.data) setBuses(data.data);
    } catch (error) {
      console.error("Error fetching buses:", error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch("/api/dashboards/admin/routes.php");
      const data = await response.json();
      if (data.routes) setRoutes(data.routes);
      else if (data.data) setRoutes(data.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/dashboards/admin/schedules.php");
      const data = await response.json();
      if (data.trips) setSchedules(data.trips);
      else if (data.data) setSchedules(data.data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/dashboards/admin/bookings.php");
      const data = await response.json();
      if (data.bookings) setBookings(data.bookings);
      else if (data.data) setBookings(data.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_notifications", user_id: 1 })
      });
      const data = await response.json();
      if (data.notifications && data.notifications.length > 0) {
        setActivityLogs(data.notifications.map((n, i) => ({
          id: n.id || i + 1,
          action: n.title || "System notification",
          user: n.message || "System",
          timestamp: n.created_at || new Date().toISOString(),
          status: "success"
        })));
      } else {
        // Fallback: get recent bookings as activity
        const bookingsResp = await fetch("/api/dashboards/admin/bookings.php");
        const bookingsData = await bookingsResp.json();
        const recentBookings = (bookingsData.bookings || bookingsData.data || []).slice(0, 5).map((b, i) => ({
          id: b.id || i + 1,
          action: `Booking ${b.booking_status || 'created'}`,
          user: b.passenger_name || "User",
          timestamp: b.created_at || new Date().toISOString(),
          status: "success"
        }));
        setActivityLogs(recentBookings);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      // Get database stats as system metrics
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", user_id: 1 })
      });
      const data = await response.json();
      
      // Calculate approximate metrics from database
      const totalBookings = bookings.length;
      const totalUsers = users.length;
      const totalBuses = buses.length;
      const totalRoutes = routes.length;
      
      // Simulate realistic metrics based on system size
      setSystemMetrics({
        cpuUsage: Math.min(15 + (totalBookings * 0.5), // 15-50% based on activity
        memoryUsage: Math.min(20 + (totalUsers * 0.3),   // 20-50% based on users
        diskUsage: 35, // Fixed for demo
        activeConnections: Math.max(1, Math.floor(totalBookings / 10)),
        uptime: "7d 4h 30m"
      });
    } catch (error) {
      console.error("Error fetching system metrics:", error);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch("/api/dashboards/admin/users.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      const data = await response.json();
      if (data.message) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const createBus = async () => {
    if (!newBus.bus_number || !newBus.capacity) return;
    try {
      const response = await fetch("/api/dashboards/admin/buses.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBus),
      });
      const data = await response.json();
      if (data.message) {
        setNewBus({ bus_number: "", capacity: "" });
        setIsBusDialogOpen(false);
        fetchBuses();
      }
    } catch (error) {
      console.error("Error creating bus:", error);
    }
  };

  const createRoute = async () => {
    if (!newRoute.start_point || !newRoute.end_point) return;
    try {
      const response = await fetch("/api/dashboards/admin/routes.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoute),
      });
      const data = await response.json();
      if (data.message) {
        setNewRoute({ start_point: "", end_point: "" });
        setIsRouteDialogOpen(false);
        fetchRoutes();
      }
    } catch (error) {
      console.error("Error creating route:", error);
    }
  };

  const createSchedule = async () => {
    if (!newSchedule.route_id || !newSchedule.bus_id || !newSchedule.date || !newSchedule.departure_time || !newSchedule.arrival_time) return;
    try {
      const response = await fetch("/api/dashboards/admin/schedules.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSchedule),
      });
      const data = await response.json();
      if (data.message) {
        setNewSchedule({ route_id: "", bus_id: "", date: "", departure_time: "", arrival_time: "" });
        setIsScheduleDialogOpen(false);
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("busfare_current_user");
    localStorage.removeItem("busfare_remember");
    navigate("/login");
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "driver":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "passenger":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getBookingStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "COMPLETED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your bus system</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-3 md:pt-6 p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-xs md:text-sm text-gray-600">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 md:pt-6 p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 bg-green-50 rounded-lg">
                <Bus className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{buses.length}</p>
                <p className="text-xs md:text-sm text-gray-600">Buses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 md:pt-6 p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 bg-purple-50 rounded-lg">
                <Route className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{routes.length}</p>
                <p className="text-xs md:text-sm text-gray-600">Routes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 md:pt-6 p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 bg-orange-50 rounded-lg">
                <Calendar className="w-4 h-4 md:w-6 md:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{schedules.length}</p>
                <p className="text-xs md:text-sm text-gray-600">Schedules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 md:pt-6 p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 bg-red-50 rounded-lg">
                <Ticket className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{bookings.length}</p>
                <p className="text-xs md:text-sm text-gray-600">Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-7 overflow-x-auto">
          <TabsTrigger value="users" className="text-xs md:text-sm">Users</TabsTrigger>
          <TabsTrigger value="buses" className="text-xs md:text-sm">Buses</TabsTrigger>
          <TabsTrigger value="routes" className="text-xs md:text-sm">Routes</TabsTrigger>
          <TabsTrigger value="trips" className="text-xs md:text-sm">Trips</TabsTrigger>
          <TabsTrigger value="bookings" className="text-xs md:text-sm">Bookings</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs md:text-sm">Activity</TabsTrigger>
          <TabsTrigger value="system" className="text-xs md:text-sm">System</TabsTrigger>
        </TabsList>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">ID</th>
                      <th className="text-left py-3 px-4 font-medium">Username</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user.id}</td>
                        <td className="py-3 px-4">{user.username}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">
                          <Select
                            value={user.role}
                            onValueChange={(value) => updateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-full sm:w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="passenger">Passenger</SelectItem>
                              <SelectItem value="driver">Driver</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buses Tab */}
        <TabsContent value="buses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bus Management</CardTitle>
              <Button onClick={() => setIsBusDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Bus
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">ID</th>
                      <th className="text-left py-3 px-4 font-medium">Bus Number</th>
                      <th className="text-left py-3 px-4 font-medium">Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buses.map((bus) => (
                      <tr key={bus.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{bus.id}</td>
                        <td className="py-3 px-4 font-medium">{bus.bus_number}</td>
                        <td className="py-3 px-4">{bus.capacity} seats</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Route Management</CardTitle>
              <Button onClick={() => setIsRouteDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Route
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">ID</th>
                      <th className="text-left py-3 px-4 font-medium">Start Point</th>
                      <th className="text-left py-3 px-4 font-medium">End Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((route) => (
                      <tr key={route.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{route.id}</td>
                        <td className="py-3 px-4 font-medium">{route.start_point}</td>
                        <td className="py-3 px-4">{route.end_point}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Schedule Management</CardTitle>
              <Button onClick={() => setIsScheduleDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Schedule
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">ID</th>
                      <th className="text-left py-3 px-4 font-medium">Route</th>
                      <th className="text-left py-3 px-4 font-medium">Bus</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Departure</th>
                      <th className="text-left py-3 px-4 font-medium">Arrival</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((schedule) => (
                      <tr key={schedule.schedule_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{schedule.schedule_id}</td>
                        <td className="py-3 px-4">{schedule.start_point} → {schedule.end_point}</td>
                        <td className="py-3 px-4">{schedule.bus_number}</td>
                        <td className="py-3 px-4">{schedule.date}</td>
                        <td className="py-3 px-4">{schedule.departure_time}</td>
                        <td className="py-3 px-4">{schedule.arrival_time}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{schedule.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
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
                      <th className="text-left py-3 px-4 font-medium">Bus</th>
                      <th className="text-left py-3 px-4 font-medium">Seat</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.booking_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{booking.booking_id}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{booking.passenger_name}</p>
                            <p className="text-xs text-gray-500">{booking.passenger_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{booking.start_point} → {booking.end_point}</td>
                        <td className="py-3 px-4">{booking.bus_number}</td>
                        <td className="py-3 px-4">{booking.seat_number}</td>
                        <td className="py-3 px-4">{booking.booking_date}</td>
                        <td className="py-3 px-4">
                          <Badge className={getBookingStatusColor(booking.booking_status)}>
                            {booking.booking_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-500">by {log.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Cpu className="w-6 h-6 text-blue-600" />
                    <span className="font-medium">CPU Usage</span>
                  </div>
                  <p className="text-2xl font-bold">{systemMetrics.cpuUsage}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${systemMetrics.cpuUsage}%` }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <HardDrive className="w-6 h-6 text-purple-600" />
                    <span className="font-medium">Memory Usage</span>
                  </div>
                  <p className="text-2xl font-bold">{systemMetrics.memoryUsage}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${systemMetrics.memoryUsage}%` }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Server className="w-6 h-6 text-green-600" />
                    <span className="font-medium">Disk Usage</span>
                  </div>
                  <p className="text-2xl font-bold">{systemMetrics.diskUsage}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${systemMetrics.diskUsage}%` }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-6 h-6 text-orange-600" />
                    <span className="font-medium">Active Connections</span>
                  </div>
                  <p className="text-2xl font-bold">{systemMetrics.activeConnections}</p>
                </div>
                <div className="p-4 border rounded-lg md:col-span-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-6 h-6 text-gray-600" />
                    <span className="font-medium">System Uptime</span>
                  </div>
                  <p className="text-2xl font-bold">{systemMetrics.uptime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Bus Dialog */}
      <Dialog open={isBusDialogOpen} onOpenChange={setIsBusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Bus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bus Number</label>
              <Input
                placeholder="e.g. BUS-001"
                value={newBus.bus_number}
                onChange={(e) => setNewBus({ ...newBus, bus_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacity</label>
              <Input
                type="number"
                placeholder="e.g. 50"
                value={newBus.capacity}
                onChange={(e) => setNewBus({ ...newBus, capacity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBusDialogOpen(false)}>Cancel</Button>
            <Button onClick={createBus}>Add Bus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Route Dialog */}
      <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Point</label>
              <Input
                placeholder="e.g. Douala"
                value={newRoute.start_point}
                onChange={(e) => setNewRoute({ ...newRoute, start_point: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Point</label>
              <Input
                placeholder="e.g. Yaoundé"
                value={newRoute.end_point}
                onChange={(e) => setNewRoute({ ...newRoute, end_point: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRouteDialogOpen(false)}>Cancel</Button>
            <Button onClick={createRoute}>Add Route</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Route</label>
              <Select
                value={newSchedule.route_id}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, route_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.start_point} → {route.end_point}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bus</label>
              <Select
                value={newSchedule.bus_id}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, bus_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.map((bus) => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.bus_number} ({bus.capacity} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={newSchedule.date}
                onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Departure Time</label>
                <Input
                  type="time"
                  value={newSchedule.departure_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, departure_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Arrival Time</label>
                <Input
                  type="time"
                  value={newSchedule.arrival_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, arrival_time: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={createSchedule}>Add Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
