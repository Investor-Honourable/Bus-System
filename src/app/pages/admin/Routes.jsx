import { useState, useEffect } from "react";
import { Route as RouteIcon, Plus, Search, Edit, Trash2, MapPin, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog.jsx";

export function Routes() {
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [newRoute, setNewRoute] = useState({ origin: "", destination: "", distance_km: "", duration_minutes: "" });

  useEffect(() => {
    fetchRoutes();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchRoutes(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRoutes = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/dashboards/admin/routes.php");
      const data = await response.json();
      // Handle different API response formats
      const routesList = data.routes || data.data || [];
      if (routesList.length > 0) setRoutes(routesList);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const createRoute = async () => {
    if (!newRoute.origin || !newRoute.destination) return;
    try {
      const response = await fetch("/api/dashboards/admin/routes.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoute),
      });
      const data = await response.json();
      if (data.message) {
        setNewRoute({ origin: "", destination: "", distance_km: "", duration_minutes: "" });
        setIsAddDialogOpen(false);
        fetchRoutes();
      }
    } catch (error) {
      console.error("Error creating route:", error);
    }
  };

  const updateRoute = async () => {
    if (!selectedRoute) return;
    try {
      const response = await fetch("/api/dashboards/admin/routes.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedRoute),
      });
      const data = await response.json();
      if (data.message) {
        setIsEditDialogOpen(false);
        setSelectedRoute(null);
        fetchRoutes();
      }
    } catch (error) {
      console.error("Error updating route:", error);
    }
  };

  const deleteRoute = async () => {
    if (!selectedRoute) return;
    try {
      const response = await fetch("/api/dashboards/admin/routes.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRoute.id }),
      });
      const data = await response.json();
      if (data.message) {
        setIsDeleteDialogOpen(false);
        setSelectedRoute(null);
        fetchRoutes();
      }
    } catch (error) {
      console.error("Error deleting route:", error);
    }
  };

  const openEditDialog = (route) => {
    setSelectedRoute({ ...route });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (route) => {
    setSelectedRoute(route);
    setIsDeleteDialogOpen(true);
  };

  const filteredRoutes = routes.filter(route => 
    route.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.route_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    if (filteredRoutes.length === 0) return;
    
    const headers = ['ID', 'Route Code', 'Start Point', 'End Point', 'Distance (km)', 'Duration', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredRoutes.map(route => [
        route.id,
        route.route_code || '',
        route.origin,
        route.destination,
        route.distance_km || '',
        route.duration_minutes ? `${route.duration_minutes} min` : '',
        route.created_at ? new Date(route.created_at).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `routes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    if (filteredRoutes.length === 0) return;
    
    const blob = new Blob([JSON.stringify(filteredRoutes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `routes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Routes</h1>
          <p className="text-gray-600 mt-1">Manage bus routes and destinations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchRoutes()} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Route
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold">{routes.length}</p>
              </div>
              <RouteIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Destinations</p>
                <p className="text-2xl font-bold">{new Set(routes.flatMap(r => [r.start_point, r.end_point])).size}</p>
              </div>
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Routes</p>
                <p className="text-2xl font-bold">{routes.length}</p>
              </div>
              <RouteIcon className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Routes</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToJSON}>
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Route Code</th>
                  <th className="text-left py-3 px-4 font-medium">Start Point</th>
                  <th className="text-left py-3 px-4 font-medium">End Point</th>
                  <th className="text-left py-3 px-4 font-medium">Distance</th>
                  <th className="text-left py-3 px-4 font-medium">Duration</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((route) => (
                  <tr key={route.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">#{route.id}</td>
                    <td className="py-3 px-4 font-medium">{route.route_code || '-'}</td>
                    <td className="py-3 px-4 font-medium">{route.origin}</td>
                    <td className="py-3 px-4">{route.destination}</td>
                    <td className="py-3 px-4">{route.distance_km ? `${route.distance_km} km` : "N/A"}</td>
                    <td className="py-3 px-4">{route.duration_minutes ? `${route.duration_minutes} min` : "N/A"}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {route.created_at ? new Date(route.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openEditDialog(route)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500"
                          onClick={() => openDeleteDialog(route)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Route Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Start Point</Label>
              <Input
                placeholder="e.g. Douala"
                value={newRoute.origin}
                onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Point</Label>
              <Input
                placeholder="e.g. Yaoundé"
                value={newRoute.destination}
                onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distance (km)</Label>
                <Input
                  placeholder="e.g. 250"
                  value={newRoute.distance_km}
                  onChange={(e) => setNewRoute({ ...newRoute, distance_km: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  placeholder="e.g. 240"
                  value={newRoute.duration_minutes}
                  onChange={(e) => setNewRoute({ ...newRoute, duration_minutes: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={createRoute}>Add Route</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Route Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
          </DialogHeader>
          {selectedRoute && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Start Point</Label>
                <Input
                  value={selectedRoute.origin}
                  onChange={(e) => setSelectedRoute({ ...selectedRoute, origin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Point</Label>
                <Input
                  value={selectedRoute.destination}
                  onChange={(e) => setSelectedRoute({ ...selectedRoute, destination: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input
                    value={selectedRoute.distance_km || ""}
                    onChange={(e) => setSelectedRoute({ ...selectedRoute, distance_km: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    value={selectedRoute.duration_minutes || ""}
                    onChange={(e) => setSelectedRoute({ ...selectedRoute, duration_minutes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={updateRoute}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Route Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Route</DialogTitle>
          </DialogHeader>
          {selectedRoute && (
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to delete the route from <strong>{selectedRoute.origin}</strong> to <strong>{selectedRoute.destination}</strong>?
              </p>
              <p className="text-red-500 mt-2">This action cannot be undone.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteRoute}>Delete Route</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
