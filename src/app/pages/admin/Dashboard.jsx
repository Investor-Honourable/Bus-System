import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "../../i18n/LanguageContext.jsx";
import { Users, Bus, Route, Calendar, Ticket, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";

export function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    users: 0,
    buses: 0,
    routes: 0,
    schedules: 0,
    bookings: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const usersRes = await fetch("/api/dashboards/admin/users.php");
      const usersData = await usersRes.json();
      const users = usersData.data || [];

      const busesRes = await fetch("/api/dashboards/admin/buses.php");
      const busesData = await busesRes.json();
      const buses = busesData.data || [];

      const routesRes = await fetch("/api/dashboards/admin/routes.php");
      const routesData = await routesRes.json();
      const routes = routesData.data || [];

      const schedulesRes = await fetch("/api/dashboards/admin/schedules.php");
      const schedulesData = await schedulesRes.json();
      const schedules = schedulesData.data || [];

      const bookingsRes = await fetch("/api/dashboards/admin/bookings.php");
      const bookingsData = await bookingsRes.json();
      const bookings = bookingsData.data || [];
      
      // Calculate total revenue from bookings
      const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.total_price || b.price || 0), 0);

      setStats({
        users: users.length,
        buses: buses.length,
        routes: routes.length,
        schedules: schedules.length,
        bookings: bookings.length,
        totalRevenue: totalRevenue
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { title: t('admin.totalUsers'), value: stats.users, icon: Users, color: "bg-blue-500" },
    { title: t('admin.totalBuses'), value: stats.buses, icon: Bus, color: "bg-green-500" },
    { title: t('admin.totalRoutes'), value: stats.routes, icon: Route, color: "bg-purple-500" },
    { title: t('admin.activeTrips'), value: stats.schedules, icon: Calendar, color: "bg-orange-500" },
    { title: t('admin.totalBookings'), value: stats.bookings, icon: Ticket, color: "bg-red-500" },
    { title: t('admin.totalRevenue'), value: `${stats.totalRevenue.toLocaleString()} XAF`, icon: DollarSign, color: "bg-yellow-500" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
        <p className="text-gray-600 mt-1">{t('admin.welcomeMessage')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <button 
              onClick={() => navigate("/dashboard/admin/users")}
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center cursor-pointer"
            >
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-700">{t('admin.manageUsers')}</p>
            </button>
            <button 
              onClick={() => navigate("/dashboard/admin/buses")}
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center cursor-pointer"
            >
              <Bus className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-700">{t('admin.addBus')}</p>
            </button>
            <button 
              onClick={() => navigate("/dashboard/admin/routes")}
              className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center cursor-pointer"
            >
              <Route className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-700">{t('admin.addRoute')}</p>
            </button>
            <button 
              onClick={() => navigate("/dashboard/admin/trips")}
              className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center cursor-pointer"
            >
              <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-700">{t('admin.addTrip')}</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
