import { useState, useEffect } from "react";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { MapPin, Clock, Star, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";

export function Routes() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch("/api/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_routes" }),
      });

      const data = await response.json();

      if (data.status === "success" && data.routes) {
        setRoutes(
          data.routes.map((r) => ({
            id: r.id,
            name: r.route_code || `Route ${r.id}`,
            code: r.route_code,
            startPoint: r.origin,
            endPoint: r.destination,
            stops: 0,
            frequency: "Available",
            operatingHours: "24/7",
            distance: `${r.distance_km || 0} km`,
            isFavorite: false,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoutes = routes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.startPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.endPoint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('nav.routes')}</h1>
        <p className="text-gray-600">{t('routes.exploreDescription')}</p>
      </div>

      {/* Search */}
      <div className="mb-4 md:mb-6">
        <Input
          placeholder={t('routes.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-full sm:max-w-md"
        />
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {filteredRoutes.map((route) => (
          <Card key={route.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-3">
                    <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm md:text-lg px-3 md:px-4 py-0.5 w-fit">
                      {route.code}
                    </Badge>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">{route.name}</h3>
                    {route.isFavorite && (
                      <Star className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-3 md:mb-4">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-emerald-600" />
                    <span className="font-medium text-gray-700 text-sm md:text-base">{route.startPoint}</span>
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                    <span className="font-medium text-gray-700 text-sm md:text-base">{route.endPoint}</span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      <div>
                        <p className="text-gray-500 text-xs">{t('route.stops')}</p>
                        <p className="font-semibold text-gray-900">{route.stops}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 text-xs">{t('routes.frequency')}</p>
                        <p className="font-semibold text-gray-900">{route.frequency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      <div>
                        <p className="text-gray-500 text-xs">{t('route.distance')}</p>
                        <p className="font-semibold text-gray-900">{route.distance}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 text-xs">{t('common.time')}</p>
                        <p className="font-semibold text-gray-900 text-xs">{route.operatingHours}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 sm:ml-4 w-full sm:w-auto">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1 text-sm">
                    {t('bookings.viewSchedule')}
                  </Button>
                  <Button variant="outline" flex-1 className="text-sm">
                    {route.isFavorite ? t('bookings.removeFromFavorites') : t('bookings.addToFavorites')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="text-center py-10 md:py-12">
          <p className="text-gray-500">{t('messages.noResults')}</p>
        </div>
      )}
    </div>
  );
}
