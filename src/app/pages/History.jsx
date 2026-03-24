import { useState, useEffect } from "react";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { Calendar, MapPin, Clock, Star, Filter, Search } from "lucide-react";
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

export function History() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [tripHistory, setTripHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
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
        const completedTrips = data.bookings
          .filter(b => b.booking_status === 'completed' || b.booking_status === 'confirmed')
          .map((b) => ({
            id: b.id,
            ticketId: b.booking_reference || `TKT-${b.id}`,
            passengerName: currentUser.name || "Passenger",
            routeFrom: b.origin || "Unknown",
            routeTo: b.destination || "Unknown",
            busNumber: b.bus_number || "",
            departureDate: b.departure_date ? new Date(b.departure_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
            departureTime: b.departure_time || "N/A",
            arrivalTime: b.arrival_time || "N/A",
            seatNumber: b.seat_number || "1",
            ticketClass: b.bus_type || "Economy",
            price: (b.total_price || 0).toLocaleString(),
            status: b.booking_status === 'completed' ? 'completed' : 'confirmed',
            rating: 5,
          }));
        setTripHistory(completedTrips);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      setTripHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = tripHistory.filter(
    (trip) =>
      trip.routeFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.routeTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "refunded":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const completedTrips = tripHistory.filter((t) => t.status === "completed").length;
  const totalSpent = tripHistory
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + parseFloat(t.price.replace("$", "")), 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('nav.history')}</h1>
        <p className="text-gray-600 mt-1">{t('passenger.bookingHistory')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('passenger.pastTrips')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{tripHistory.length}</p>
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
                <p className="text-sm text-gray-600">{t('common.completed')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{completedTrips}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('bookings.totalSpent')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${totalSpent.toFixed(2)}</p>
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
                <p className="text-sm text-gray-600">{t('routes.avgRating')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-1">
                  4.7
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
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
                placeholder={t('history.searchPlaceholder')}
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
                <SelectItem value="completed">{t('common.completed')}</SelectItem>
                <SelectItem value="cancelled">{t('common.cancelled')}</SelectItem>
                <SelectItem value="refunded">{t('history.refunded')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              {t('common.filter')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.map((trip) => (
          <Card key={trip.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {trip.ticketId}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(trip.status)}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </Badge>
                    {trip.ticketClass === "Business" && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {trip.ticketClass}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{trip.departureDate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{trip.price}</p>
                  {trip.rating && (
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < trip.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 py-4 border-t border-gray-100">
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-2">{t('route.routeName')}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm">{trip.routeFrom}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-sm">{trip.routeTo}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">{t('bus.busNumber')}</p>
                  <p className="text-sm font-medium">{trip.busNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">{t('common.time')}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="font-medium">
                      {trip.departureTime} - {trip.arrivalTime}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">{t('booking.seatSelection')}</p>
                  <p className="text-sm font-medium">{trip.seatNumber}</p>
                </div>
              </div>

              {trip.status === "completed" && !trip.rating && (
                <div className="pt-4 border-t border-gray-100">
                  <Button variant="outline" size="sm">
                    {t('history.rateThisTrip')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('history.noHistoryFound')}</h3>
            <p className="text-gray-600">{t('messages.noResults')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
