import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { 
  Users, Bus, Route, Calendar, Ticket, DollarSign, Activity, 
  TrendingUp, AlertTriangle, CheckCircle, Clock, RefreshCw,
  Download, Filter, Search, BarChart3, PieChart, LineChart,
  UserPlus, Settings, Shield, Database, Server, Cpu, HardDrive
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";

export function EnhancedDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data states
  const [users, setUsers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    activeConnections: 0,
    uptime: 0
  });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      const [usersRes, busesRes, routesRes, schedulesRes, bookingsRes, driversRes] = await Promise.all([
        fetch("/api/dashboards/admin/users.php"),
        fetch("/api/dashboards/admin/buses.php"),
        fetch("/api/dashboards/admin/routes.php"),
        fetch("/api/dashboards/admin/schedules.php"),
        fetch("/api/dashboards/admin/bookings.php"),
        fetch("/api/dashboards/admin/drivers.php"),
      ]);

      const usersData = await usersRes.json();
      const busesData = await busesRes.json();
      const routesData = await routesRes.json();
      const schedulesData = await schedulesRes.json();
      const bookingsData = await bookingsRes.json();
      const driversData = await driversRes.json();

      setUsers(usersData.users || usersData.data || []);
      setBuses(busesData.data || []);
      setRoutes(routesData.data || []);
      setSchedules(schedulesData.data || []);
      setBookings(bookingsData.bookings || bookingsData.data || []);
      setDrivers(driversData.drivers || driversData.data || []);

      // Generate activity logs from data
      generateActivityLogs(usersData || [], bookingsData || []);
      
      // Fetch real system metrics
      fetchSystemMetrics();
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const generateActivityLogs = (usersData, bookingsData) => {
    const logs = [];
    
    // User registration logs
    usersData.slice(0, 10).forEach(user => {
      logs.push({
        id: `user-${user.id}`,
        type: 'user_registration',
        message: `New user registered: ${user.name || user.username}`,
        user: user.email,
        timestamp: user.created_at || new Date().toISOString(),
        status: 'success'
      });
    });

    // Booking logs
    bookingsData.slice(0, 10).forEach(booking => {
      logs.push({
        id: `booking-${booking.id || booking.booking_id}`,
        type: 'booking',
        message: `Booking ${booking.booking_status}: ${booking.user_name || booking.passenger_name}`,
        user: booking.user_email || booking.passenger_email,
        timestamp: booking.created_at || new Date().toISOString(),
        status: booking.booking_status === 'confirmed' ? 'success' : 'warning'
      });
    });

    // Sort by timestamp
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setActivityLogs(logs.slice(0, 20));
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch("/api/dashboards/admin/system_metrics.php");
      const data = await response.json();
      if (data.metrics) {
        setSystemMetrics(data.metrics);
      }
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      // Set default values on error
      setSystemMetrics({
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        activeConnections: 0,
        uptime: 0
      });
    }
  };

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    totalBuses: buses.length,
    totalRoutes: routes.length,
    totalSchedules: schedules.length,
    totalBookings: bookings.length,
    totalDrivers: drivers.length,
    totalRevenue: bookings.reduce((sum, b) => sum + (parseFloat(b.total_price) || parseFloat(b.price) || 0), 0),
    confirmedBookings: bookings.filter(b => b.booking_status === 'confirmed').length,
    pendingBookings: bookings.filter(b => b.booking_status === 'pending').length,
    cancelledBookings: bookings.filter(b => b.booking_status === 'cancelled').length,
    activeDrivers: drivers.filter(d => d.status === 'active' || d.driver_status === 'active').length,
    passengers: users.filter(u => u.role === 'passenger').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchQuery ||
      booking.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.passenger_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.destination?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Export functions
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'driver': return 'bg-blue-100 text-blue-700';
      case 'passenger': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading comprehensive dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive system overview and management
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchAllData()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToCSV(users, 'users')}>
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/admin/users")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/admin/drivers")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Drivers</p>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/admin/buses")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Buses</p>
                <p className="text-2xl font-bold">{stats.totalBuses}</p>
              </div>
              <Bus className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/admin/routes")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Routes</p>
                <p className="text-2xl font-bold">{stats.totalRoutes}</p>
              </div>
              <Route className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/admin/bookings")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <Ticket className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-xl font-bold">{stats.totalRevenue.toLocaleString()} XAF</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <Ticket className="w-4 h-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Server className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Booking Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Confirmed</span>
                    </div>
                    <span className="font-semibold">{stats.confirmedBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Pending</span>
                    </div>
                    <span className="font-semibold">{stats.pendingBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Cancelled</span>
                    </div>
                    <span className="font-semibold">{stats.cancelledBookings}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Passengers</span>
                    </div>
                    <span className="font-semibold">{stats.passengers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Drivers</span>
                    </div>
                    <span className="font-semibold">{stats.totalDrivers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span>Admins</span>
                    </div>
                    <span className="font-semibold">{stats.admins}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {log.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{log.message}</p>
                          <p className="text-xs text-gray-500">{log.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>User Management</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="passenger">Passenger</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredUsers, 'users')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">ID</th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Phone</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user.id}</td>
                        <td className="py-3 px-4 font-medium">{user.name || user.username || '-'}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">{user.phone || '-'}</td>
                        <td className="py-3 px-4">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={user.is_active !== 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {user.is_active !== 0 ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
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
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>Booking Management</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredBookings, 'bookings')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
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
                      <th className="text-left py-3 px-4 font-medium">Price</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id || booking.booking_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">#{booking.id || booking.booking_id}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{booking.user_name || booking.passenger_name}</p>
                            <p className="text-xs text-gray-500">{booking.user_email || booking.passenger_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{booking.origin} → {booking.destination}</td>
                        <td className="py-3 px-4">{booking.departure_date || booking.booking_date}</td>
                        <td className="py-3 px-4">{booking.number_of_seats || 1}</td>
                        <td className="py-3 px-4 font-medium">{parseFloat(booking.total_price || booking.price || 0).toLocaleString()} XAF</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(booking.booking_status)}>
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
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Logs
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportToJSON(activityLogs, 'activity_logs')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {log.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : log.status === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium">{log.message}</p>
                        <p className="text-sm text-gray-500">{log.user}</p>
                        <p className="text-xs text-gray-400">{log.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">CPU Usage</p>
                    <p className="text-3xl font-bold">{systemMetrics.cpuUsage}%</p>
                  </div>
                  <Cpu className="w-10 h-10 text-blue-500" />
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${systemMetrics.cpuUsage}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Memory Usage</p>
                    <p className="text-3xl font-bold">{systemMetrics.memoryUsage}%</p>
                  </div>
                  <Database className="w-10 h-10 text-green-500" />
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${systemMetrics.memoryUsage}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Disk Usage</p>
                    <p className="text-3xl font-bold">{systemMetrics.diskUsage}%</p>
                  </div>
                  <HardDrive className="w-10 h-10 text-purple-500" />
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${systemMetrics.diskUsage}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Connections</p>
                    <p className="text-3xl font-bold">{systemMetrics.activeConnections}</p>
                  </div>
                  <Activity className="w-10 h-10 text-orange-500" />
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Uptime: {systemMetrics.uptime} hours
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Database</span>
                  </div>
                  <p className="text-sm text-gray-600">Connected and operational</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">API Server</span>
                  </div>
                  <p className="text-sm text-gray-600">Running normally</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Cache</span>
                  </div>
                  <p className="text-sm text-gray-600">Active and responsive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
