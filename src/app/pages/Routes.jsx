import { useState, useEffect } from "react";
import { MapPin, Clock, Star, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";

export function Routes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch("http://localhost/Bus_system/api/index.php", {
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bus Routes</h1>
        <p className="text-gray-600">Explore all available bus routes and schedules</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search routes, stops, or destinations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {filteredRoutes.map((route) => (
          <Card key={route.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-4 py-1">
                      {route.code}
                    </Badge>
                    <h3 className="text-xl font-bold text-gray-900">{route.name}</h3>
                    {route.isFavorite && (
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-gray-700">{route.startPoint}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-gray-700">{route.endPoint}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      <div>
                        <p className="text-gray-500">Stops</p>
                        <p className="font-semibold text-gray-900">{route.stops}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Frequency</p>
                        <p className="font-semibold text-gray-900">{route.frequency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      <div>
                        <p className="text-gray-500">Distance</p>
                        <p className="font-semibold text-gray-900">{route.distance}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Hours</p>
                        <p className="font-semibold text-gray-900 text-xs">{route.operatingHours}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    View Schedule
                  </Button>
                  <Button variant="outline">
                    {route.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No routes found matching your search</p>
        </div>
      )}
    </div>
  );
}
