import { useState, useEffect } from "react";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { Search, Filter, Calendar, MapPin, Users, DollarSign, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Input } from "../components/ui/input.jsx";
import { Button } from "../components/ui/button.jsx";
import { Badge } from "../components/ui/badge.jsx";
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
  DialogTrigger,
} from "../components/ui/dialog.jsx";
import { Label } from "../components/ui/label.jsx";

export function Bookings() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
      const userId = currentUser.id || 0;

      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_bookings", user_id: userId }),
      });

      const data = await response.json();

      if (data.status === "success" && data.bookings) {
        setBookings(
          data.bookings.map((b) => ({
            id: b.booking_reference,
            routeFrom: b.origin,
            routeTo: b.destination,
            busNumber: b.bus_number,
            departureDate: new Date(b.departure_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            departureTime: b.departure_time,
            seatNumber: b.seat_number || "1",
            ticketClass: b.bus_type || "Standard",
            price: (b.total_price || 0).toLocaleString(),
            status: b.booking_status,
            operator: b.bus_name || "Bus",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.routeFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.routeTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('nav.bookings')}</h1>
          <p className="text-gray-600 mt-1">{t('bookings.manageDescription')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('bookings.totalBookings')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {bookings.length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('bookings.upcoming')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('bookings.completed')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {bookings.filter((b) => b.status === "completed").length}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('bookings.totalSpent')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {bookings.reduce((sum, b) => sum + (parseFloat(b.price.replace(/,/g, '')) || 0), 0).toLocaleString()} XAF
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('bookings.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="confirmed">{t('booking.confirmed')}</SelectItem>
                <SelectItem value="pending">{t('common.pending')}</SelectItem>
                <SelectItem value="cancelled">{t('common.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              {t('common.filter')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {booking.routeFrom.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{booking.routeFrom} to {booking.routeTo}</h4>
                        <Badge variant="outline" className="text-xs">
                          {booking.id}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {booking.operator}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">{booking.price}</p>
                    <Badge
                      variant="outline"
                      className={
                        booking.ticketClass === "Business"
                          ? "bg-amber-50 text-amber-700 border-amber-200 mt-1"
                          : "bg-blue-50 text-blue-700 border-blue-200 mt-1"
                      }
                    >
                      {booking.ticketClass}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('route.routeName')}</p>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span className="font-medium">{booking.routeFrom}</span>
                      <span className="text-gray-400">→</span>
                      <MapPin className="w-3 h-3 text-red-600" />
                      <span className="font-medium">{booking.routeTo}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('bus.busNumber')}</p>
                    <p className="text-sm font-medium">{booking.busNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('booking.departureTime')}</p>
                    <p className="text-sm font-medium">
                      {booking.departureDate} • {booking.departureTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('booking.seatSelection')}</p>
                    <p className="text-sm font-medium">{booking.seatNumber}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}