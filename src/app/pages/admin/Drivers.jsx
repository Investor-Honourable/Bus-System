import { useState, useEffect } from "react";
import { UserCog, Plus, Search, Edit, Trash2, Phone, Mail, UserPlus, MapPin, Bus, AlertCircle, Loader2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,

} from "../../components/ui/dialog.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog.jsx";

export function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [newDriver, setNewDriver] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    license_number: ""
  });
  const [assignment, setAssignment] = useState({
    route_id: "",
    bus_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Fetch drivers from dedicated drivers API
      const driversRes = await fetch("/api/dashboards/admin/drivers.php");
      const driversData = await driversRes.json();
      
      // Fetch all trips for calculating driver stats
      const tripsRes = await fetch("/api/dashboards/admin/schedules.php");
      const tripsData = await tripsRes.json();
      
      // Fetch all bookings for passenger count
      const bookingsRes = await fetch("/api/dashboards/admin/bookings.php");
      const bookingsData = await bookingsRes.json();
      
      // Get today's date for filtering
      const today = new Date().toISOString().split('T')[0];
      
      // Handle different API response formats
      const driversList = driversData.drivers || driversData.data || [];
      const tripsList = tripsData.trips || tripsData.data || [];
      const bookingsList = bookingsData.bookings || bookingsData.data || [];
      
      if (driversList.length > 0) {
        // Map trip_id to schedule_id for compatibility
        const trips = tripsList.map(trip => ({
          ...trip,
          schedule_id: trip.trip_id || trip.schedule_id
        }));
        
        const bookings = bookingsList;
        
        // Calculate stats for each driver based on their assignments
        const driversWithStats = driversList.map(driver => {
          // Filter trips for this driver's assigned bus and route
          const driverTrips = trips.filter(trip => 
            String(trip.bus_id) === String(driver.assigned_bus_id) &&
            String(trip.route_id) === String(driver.assigned_route_id)
          );
          
          // Today's trips
          const todayTrips = driverTrips.filter(trip => trip.date === today);
          
          // Upcoming trips (future dates)
          const upcomingTrips = driverTrips.filter(trip => trip.date > today);
          
          // Calculate total passengers for this driver's trips
          const tripIds = driverTrips.map(t => t.schedule_id);
          const driverBookings = bookings.filter(booking => 
            tripIds.includes(String(booking.schedule_id))
          );
          
          return {
            ...driver,
            totalTrips: driverTrips.length,
            todayTrips: todayTrips.length,
            upcomingTrips: upcomingTrips.length,
            totalPassengers: driverBookings.length,
            todayTripDetails: todayTrips
          };
        });
        
        setDrivers(driversWithStats);
      } else if (driversData.message) {
        setError(driversData.message);
        setDrivers([]);
      } else {
        setDrivers([]);
      }

      // Fetch routes and buses for assignment
      const [routesRes, busesRes] = await Promise.all([
        fetch("/api/dashboards/admin/routes.php"),
        fetch("/api/dashboards/admin/buses.php")
      ]);
      
      const routesData = await routesRes.json();
      const busesData = await busesRes.json();
      
      const routesList = routesData.routes || routesData.data || [];
      const busesList = busesData.buses || busesData.data || [];
      
      if (routesList.length > 0) setRoutes(routesList);
      if (busesList.length > 0) setBuses(busesList);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load driver data. Please try again.");
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addDriver = async () => {
    if (!newDriver.username || !newDriver.email || !newDriver.password) {
      setError("Please fill in all required fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newDriver.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Password validation
    if (newDriver.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/controller/signup.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newDriver, role: "driver" }),
      });
      const data = await response.json();
      if (data.success || data.message) {
        setNewDriver({ username: "", email: "", password: "", phone: "", license_number: "" });
        setIsAddDialogOpen(false);
        fetchData();
      } else {
        setError(data.message || "Failed to add driver");
      }
    } catch (err) {
      console.error("Error adding driver:", err);
      setError("Failed to add driver");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDriver = async () => {
    if (!selectedDriver) return;

    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/dashboards/admin/drivers.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedDriver.id,
          username: selectedDriver.username,
          phone: selectedDriver.phone,
          license_number: selectedDriver.license_number || 'DL00000000',
          status: selectedDriver.status || 'active'
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsEditDialogOpen(false);
        setSelectedDriver(null);
        fetchData();
      } else {
        setError(data.message || "Failed to update driver");
      }
    } catch (err) {
      console.error("Error updating driver:", err);
      setError("Failed to update driver");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDriver = async () => {
    if (!selectedDriver) return;

    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/dashboards/admin/drivers.php?id=${selectedDriver.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setIsDeleteDialogOpen(false);
        setSelectedDriver(null);
        fetchData();
      } else {
        setError(data.message || "Failed to delete driver");
      }
    } catch (err) {
      console.error("Error deleting driver:", err);
      setError("Failed to delete driver");
    } finally {
      setIsSaving(false);
    }
  };

  const assignDriver = async () => {
    if (!selectedDriver || !assignment.route_id || !assignment.bus_id) {
      setError("Please select both route and bus");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/dashboards/admin/drivers.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedDriver.id,
          assigned_route_id: assignment.route_id,
          assigned_bus_id: assignment.bus_id,
          status: selectedDriver.status || 'active',
          license_number: selectedDriver.license_number || 'DL00000000'
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsAssignDialogOpen(false);
        setSelectedDriver(null);
        setAssignment({ route_id: "", bus_id: "" });
        fetchData();
      } else {
        setError(data.message || "Failed to assign driver");
      }
    } catch (err) {
      console.error("Error assigning driver:", err);
      setError("Failed to assign driver");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (driver) => {
    setSelectedDriver({ 
      ...driver, 
      status: driver.driver_status || driver.status || 'active' 
    });
    setError("");
    setIsEditDialogOpen(true);
  };

  const openAssignDialog = (driver) => {
    // Get route and bus details for display
    const assignedRoute = routes.find(r => String(r.id) === String(driver.assigned_route_id));
    const assignedBus = buses.find(b => String(b.id) === String(driver.assigned_bus_id));
    
    setSelectedDriver({ 
      ...driver,
      currentRoute: assignedRoute,
      currentBus: assignedBus
    });
    setAssignment({ 
      route_id: driver.assigned_route_id ? String(driver.assigned_route_id) : "", 
      bus_id: driver.assigned_bus_id ? String(driver.assigned_bus_id) : "" 
    });
    setError("");
    setIsAssignDialogOpen(true);
  };

  const openDeleteDialog = (driver) => {
    setSelectedDriver(driver);
    setError("");
    setIsDeleteDialogOpen(true);
  };

  const getRouteName = (routeId) => {
    const route = routes.find(r => String(r.id) === String(routeId));
    return route ? `${route.start_point} → ${route.end_point}` : null;
  };

  const getBusInfo = (busId) => {
    const bus = buses.find(b => String(b.id) === String(busId));
    return bus ? `${bus.bus_number} (${bus.capacity} seats)` : null;
  };

  const filteredDrivers = drivers.filter(driver => 
    driver.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "inactive": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-1">Manage your fleet drivers</p>
        </div>
        <Button onClick={() => { setError(""); setIsAddDialogOpen(true); }} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Driver
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold">{drivers.length}</p>
              </div>
              <UserCog className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold">{drivers.filter(d => (d.driver_status || d.status) === "active").length}</p>
              </div>
              <UserCog className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Trips</p>
                <p className="text-2xl font-bold">{drivers.reduce((sum, d) => sum + (d.todayTrips || 0), 0)}</p>
              </div>
              <Bus className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Passengers</p>
                <p className="text-2xl font-bold">{drivers.reduce((sum, d) => sum + (d.totalPassengers || 0), 0)}</p>
              </div>
              <UserCog className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search drivers by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full md:w-64"
        />
      </div>

      {/* Empty State */}
      {filteredDrivers.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <UserCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No drivers found" : "No drivers yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? "Try adjusting your search criteria" 
                : "Get started by adding your first driver"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add First Driver
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* Drivers Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCog className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{driver.username || driver.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(driver.driver_status || driver.status)}`}>
                      {driver.driver_status || driver.status || 'unknown'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {driver.email || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {driver.phone || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserCog className="w-4 h-4" />
                    License: {driver.license_number || 'N/A'}
                  </div>
                  {driver.assigned_route_id && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <MapPin className="w-4 h-4" />
                      Route: {getRouteName(driver.assigned_route_id)}
                    </div>
                  )}
                  {driver.assigned_bus_id && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <Bus className="w-4 h-4" />
                      Bus: {getBusInfo(driver.assigned_bus_id)}
                    </div>
                  )}
                  {driver.todayTrips > 0 && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <MapPin className="w-4 h-4" />
                      Today's Trips: {driver.todayTrips}
                    </div>
                  )}
                  {driver.upcomingTrips > 0 && (
                    <div className="flex items-center gap-2 text-sm text-indigo-600">
                      <Calendar className="w-4 h-4" />
                      Upcoming: {driver.upcomingTrips}
                    </div>
                  )}
                  {driver.totalPassengers > 0 && (
                    <div className="flex items-center gap-2 text-sm text-teal-600">
                      <UserCog className="w-4 h-4" />
                      Passengers: {driver.totalPassengers}
                    </div>
                  )}
                  {!driver.assigned_bus_id && !driver.assigned_route_id && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      Not assigned
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => openAssignDialog(driver)}>
                    <MapPin className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(driver)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => openDeleteDialog(driver)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Driver Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Full Name *</Label>
              <Input
                id="username"
                placeholder="Enter driver name"
                value={newDriver.username}
                onChange={(e) => setNewDriver({ ...newDriver, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="driver@camtransit.com"
                value={newDriver.email}
                onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={newDriver.password}
                onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+237 600 000 000"
                value={newDriver.phone}
                onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                placeholder="DL12345678"
                value={newDriver.license_number}
                onChange={(e) => setNewDriver({ ...newDriver, license_number: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={addDriver} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Driver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-4 py-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit_name">Full Name *</Label>
                <Input
                  id="edit_name"
                  value={selectedDriver.username || selectedDriver.name || ""}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  value={selectedDriver.email || ""}
                  disabled
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={selectedDriver.phone || ""}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_license">License Number</Label>
                <Input
                  id="edit_license"
                  value={selectedDriver.license_number || ""}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, license_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={selectedDriver.status || "active"}
                  onValueChange={(value) => setSelectedDriver({ ...selectedDriver, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={updateDriver} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-4 py-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-900">Driver: {selectedDriver.username || selectedDriver.name}</p>
                {selectedDriver.currentRoute && (
                  <p className="text-xs text-blue-700">Current Route: {selectedDriver.currentRoute.start_point} → {selectedDriver.currentRoute.end_point}</p>
                )}
                {selectedDriver.currentBus && (
                  <p className="text-xs text-blue-700">Current Bus: {selectedDriver.currentBus.bus_number} ({selectedDriver.currentBus.capacity} seats)</p>
                )}
                {!selectedDriver.currentRoute && !selectedDriver.currentBus && (
                  <p className="text-xs text-orange-700">Currently unassigned</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Select Route *</Label>
                <Select
                  value={assignment.route_id}
                  onValueChange={(value) => setAssignment({ ...assignment, route_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={String(route.id)}>
                        {route.start_point} → {route.end_point}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Bus *</Label>
                <Select
                  value={assignment.bus_id}
                  onValueChange={(value) => setAssignment({ ...assignment, bus_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((bus) => (
                      <SelectItem key={bus.id} value={String(bus.id)}>
                        {bus.bus_number} ({bus.capacity} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={assignDriver} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Driver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
          </AlertDialogHeader>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <p className="py-4">
            Are you sure you want to delete driver <strong>{selectedDriver?.username || selectedDriver?.name}</strong>? 
            This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDriver} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
