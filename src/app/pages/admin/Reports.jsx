import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Ticket, DollarSign, Bus, Calendar, MapPin, Activity, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.jsx";

export function Reports() {
  const [stats, setStats] = useState({
    totalBuses: 0,
    totalTrips: 0,
    totalPassengers: 0,
    totalRevenue: 0,
    mostPopularRoute: "",
    dailyBookings: [],
    monthlyData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(interval);
  }, [period]);

  const fetchStats = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    try {
      // Fetch all necessary data
      const [usersRes, busesRes, routesRes, bookingsRes, schedulesRes] = await Promise.all([
        fetch("/api/dashboards/admin/users.php"),
        fetch("/api/dashboards/admin/buses.php"),
        fetch("/api/dashboards/admin/routes.php"),
        fetch("/api/dashboards/admin/bookings.php"),
        fetch("/api/dashboards/admin/schedules.php"),
      ]);

      const usersData = await usersRes.json();
      const busesData = await busesRes.json();
      const routesData = await routesRes.json();
      const bookingsData = await bookingsRes.json();
      const schedulesData = await schedulesRes.json();

      const users = usersData.users || usersData.data || [];
      const buses = busesData.buses || busesData.data || [];
      const routes = routesData.routes || routesData.data || [];
      const bookings = bookingsData.bookings || bookingsData.data || [];
      const schedules = schedulesData.trips || schedulesData.data || [];

      // Calculate most popular route from bookings
      const routeCounts = {};
      const routeRevenue = {};
      bookings.forEach(booking => {
        const route = booking.route || booking.route_name || `${booking.origin} → ${booking.destination}`;
        if (route) {
          routeCounts[route] = (routeCounts[route] || 0) + 1;
          routeRevenue[route] = (routeRevenue[route] || 0) + (parseFloat(booking.price) || parseFloat(booking.total_price) || 0);
        }
      });
      const sortedRoutes = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]);
      const mostPopularRoute = sortedRoutes[0]?.[0] || "N/A";
      
      // Calculate booking status counts
      const statusCounts = { confirmed: 0, pending: 0, cancelled: 0, completed: 0 };
      bookings.forEach(booking => {
        const status = (booking.booking_status || booking.status || "confirmed").toLowerCase();
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
        }
      });
      
      // Calculate daily bookings for the last 7 days
      const dailyBookingsMap = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyBookingsMap[dateStr] = { day: date.toLocaleDateString('en-US', { weekday: 'short' }), bookings: 0, revenue: 0 };
      }
      bookings.forEach(booking => {
        const bookingDate = booking.departure_date || booking.booking_date || booking.created_at;
        if (bookingDate) {
          const dateStr = new Date(bookingDate).toISOString().split('T')[0];
          if (dailyBookingsMap[dateStr]) {
            dailyBookingsMap[dateStr].bookings++;
            dailyBookingsMap[dateStr].revenue += parseFloat(booking.price) || parseFloat(booking.total_price) || 0;
          }
        }
      });
      const dailyBookings = Object.values(dailyBookingsMap);
      
      // Calculate monthly data for the last 6 months
      const monthlyBookingsMap = {};
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        monthlyBookingsMap[monthStr] = { month: date.toLocaleDateString('en-US', { month: 'short' }), bookings: 0, revenue: 0 };
      }
      bookings.forEach(booking => {
        const bookingDate = booking.departure_date || booking.booking_date || booking.created_at;
        if (bookingDate) {
          const monthStr = new Date(bookingDate).toISOString().slice(0, 7);
          if (monthlyBookingsMap[monthStr]) {
            monthlyBookingsMap[monthStr].bookings++;
            monthlyBookingsMap[monthStr].revenue += parseFloat(booking.price) || parseFloat(booking.total_price) || 0;
          }
        }
      });
      const monthlyData = Object.values(monthlyBookingsMap);

      // Calculate total revenue
      const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.price) || parseFloat(b.total_price) || 0), 0);
      const passengers = users.filter(u => u.role === "passenger");

      // Calculate average values
      const avgDailyBookings = dailyBookings.length > 0 ? Math.round(dailyBookings.reduce((sum, d) => sum + d.bookings, 0) / dailyBookings.length) : 0;
      const avgTicketPrice = bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0;
      const busUtilization = buses.length > 0 ? Math.round((schedules.filter(s => s.status !== 'cancelled').length / Math.max(buses.length, 1)) * 100) : 0;

      setStats({
        totalBuses: buses.length,
        totalTrips: schedules.slice(0, 50).length,
        totalPassengers: passengers.length,
        totalRevenue: totalRevenue,
        mostPopularRoute: mostPopularRoute,
        dailyBookings: dailyBookings,
        monthlyData: monthlyData,
        statusCounts: statusCounts,
        routeCounts: sortedRoutes.slice(0, 4),
        avgDailyBookings,
        avgTicketPrice,
        busUtilization,
        activeRoutes: routes.length
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        totalBuses: 0,
        totalTrips: 0,
        totalPassengers: 0,
        totalRevenue: 0,
        mostPopularRoute: "N/A",
        dailyBookings: [],
        monthlyData: [],
        statusCounts: { confirmed: 0, pending: 0, cancelled: 0, completed: 0 },
        routeCounts: [],
        avgDailyBookings: 0,
        avgTicketPrice: 0,
        busUtilization: 0,
        activeRoutes: 0
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Metric', 'Value'];
    const data = [
      ['Total Buses', stats.totalBuses],
      ['Total Trips', stats.totalTrips],
      ['Total Passengers', stats.totalPassengers],
      ['Total Revenue (XAF)', stats.totalRevenue],
      ['Most Popular Route', stats.mostPopularRoute],
      ['Average Daily Bookings', stats.avgDailyBookings],
      ['Average Ticket Price (XAF)', stats.avgTicketPrice],
      ['Bus Utilization (%)', stats.busUtilization],
      ['Active Routes', stats.activeRoutes],
      ['Confirmed Bookings', stats.statusCounts?.confirmed || 0],
      ['Pending Bookings', stats.statusCounts?.pending || 0],
      ['Cancelled Bookings', stats.statusCounts?.cancelled || 0],
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtext && (
              <p className="text-sm mt-1 text-gray-500">{subtext}</p>
            )}
          </div>
          <div className={`p-4 rounded-xl ${color}`}>
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const maxDailyBookings = stats.dailyBookings && stats.dailyBookings.length > 0 ? Math.max(...stats.dailyBookings.map(d => d.bookings), 1) : 1;
  const maxMonthlyBookings = stats.monthlyData && stats.monthlyData.length > 0 ? Math.max(...stats.monthlyData.map(d => d.bookings), 1) : 1;
  const totalStatusCount = stats.statusCounts ? (stats.statusCounts.confirmed + stats.statusCounts.pending + stats.statusCounts.cancelled + stats.statusCounts.completed) : 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">System insights and analytics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => fetchStats()} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 md:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="week">Daily</TabsTrigger>
              <TabsTrigger value="month">Weekly</TabsTrigger>
              <TabsTrigger value="year">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportToJSON}>
            <Download className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">JSON</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Buses"
          value={stats.totalBuses}
          icon={Bus}
          color="bg-blue-100 text-blue-600"
          subtext="Active fleet"
        />
        <StatCard
          title="Total Trips"
          value={stats.totalTrips}
          icon={Calendar}
          color="bg-purple-100 text-purple-600"
          subtext="This period"
        />
        <StatCard
          title="Total Passengers"
          value={stats.totalPassengers}
          icon={Users}
          color="bg-green-100 text-green-600"
          subtext="Registered users"
        />
        <StatCard
          title="Total Revenue"
          value={`XAF ${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-orange-100 text-orange-600"
          subtext="All time"
        />
      </div>

      {/* Most Popular Route */}
      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">🏆 Most Popular Route</p>
              <p className="text-2xl font-bold mt-2 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-purple-600" />
                {stats.mostPopularRoute}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Based on booking data</p>
              <p className="text-lg font-semibold text-green-600">Based on booking data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily/Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {period === "week" ? "Daily Summary" : "Weekly Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.dailyBookings && stats.dailyBookings.length > 0 ? (
                stats.dailyBookings.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{data.day}</span>
                      <span className="text-gray-600">{data.bookings} bookings • XAF {data.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max((data.bookings / maxDailyBookings) * 100, 5)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No booking data available</p>
              )}
            </div>
            {stats.dailyBookings && stats.dailyBookings.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-xl font-bold">{stats.dailyBookings.reduce((sum, d) => sum + d.bookings, 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold text-green-600">XAF {stats.dailyBookings.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.monthlyData && stats.monthlyData.length > 0 ? (
                stats.monthlyData.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{data.month}</span>
                      <span className="text-gray-600">{data.bookings} bookings • XAF {data.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max((data.bookings / maxMonthlyBookings) * 100, 5)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No monthly data available</p>
              )}
            </div>
            {stats.monthlyData && stats.monthlyData.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-xl font-bold">{stats.monthlyData.reduce((sum, d) => sum + d.bookings, 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold text-green-600">XAF {stats.monthlyData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Booking Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.statusCounts ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Confirmed</span>
                    </div>
                    <span className="font-semibold">{totalStatusCount > 0 ? Math.round((stats.statusCounts.confirmed / totalStatusCount) * 100) : 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Pending</span>
                    </div>
                    <span className="font-semibold">{totalStatusCount > 0 ? Math.round((stats.statusCounts.pending / totalStatusCount) * 100) : 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Cancelled</span>
                    </div>
                    <span className="font-semibold">{totalStatusCount > 0 ? Math.round((stats.statusCounts.cancelled / totalStatusCount) * 100) : 0}%</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">No booking status data</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Route Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.routeCounts && stats.routeCounts.length > 0 ? (
                stats.routeCounts.map(([route, count], index) => {
                  const colors = ["text-green-600", "text-blue-600", "text-purple-600", "text-gray-600"];
                  const total = stats.routeCounts.reduce((sum, [, c]) => sum + c, 0);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{route}</span>
                      <span className={`font-semibold ${colors[index]}`}>{total > 0 ? Math.round((count / total) * 100) : 0}%</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No route data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Daily Bookings</span>
                <span className="font-bold text-lg">{stats.avgDailyBookings || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Ticket Price</span>
                <span className="font-bold text-lg">XAF {stats.avgTicketPrice ? stats.avgTicketPrice.toLocaleString() : 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bus Utilization</span>
                <span className="font-bold text-lg">{stats.busUtilization || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Routes</span>
                <span className="font-bold text-lg">{stats.activeRoutes || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
