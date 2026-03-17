import { useState, useEffect } from "react";
import { Calendar, Plus, Search, Edit, Trash2, Users, Eye, XCircle, Clock, MapPin, Bus, UserPlus } from "lucide-react";
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

export function Trips() {
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPassengersDialogOpen, setIsPassengersDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripPassengers, setTripPassengers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isAssignDriverDialogOpen, setIsAssignDriverDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [newSchedule, setNewSchedule] = useState({
    route_id: "",
    bus_id: "",
    date: "",
    departure_time: "",
    arrival_time: "",
    price: "",
    status: "scheduled"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [schedulesRes, routesRes, busesRes] = await Promise.all([
        fetch("/api/dashboards/admin/schedules.php"),
        fetch("/api/dashboards/admin/routes.php"),
        fetch("/api/dashboards/admin/buses.php"),
      ]);
      
      const schedulesData = await schedulesRes.json();
      const routesData = await routesRes.json();
      const busesData = await busesRes.json();
      
      if (schedulesData.data) {
        // Map trip_id to schedule_id for compatibility
        const mappedData = schedulesData.data.map(trip => ({
          ...trip,
          schedule_id: trip.trip_id || trip.schedule_id
        }));
        setSchedules(mappedData);
      }
      if (routesData.data) setRoutes(routesData.data);
      if (busesData.data) setBuses(busesData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSchedule = async () => {
    console.log("Current form state:", newSchedule);
    
    // Validation with user feedback
    const missingFields = [];
    if (!newSchedule.route_id) missingFields.push("Route");
    if (!newSchedule.bus_id) missingFields.push("Bus");
    if (!newSchedule.date) missingFields.push("Date");
    if (!newSchedule.departure_time) missingFields.push("Departure Time");
    if (!newSchedule.arrival_time) missingFields.push("Arrival Time");
    if (!newSchedule.price) missingFields.push("Price");
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following fields: ${missingFields.join(", ")}`);
      return;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(newSchedule.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      alert("Cannot create trips with past dates. Please select today or a future date.");
      return;
    }
    
    // Validate arrival time is after departure time (if same day)
    if (newSchedule.departure_time && newSchedule.arrival_time) {
      const depMinutes = parseInt(newSchedule.departure_time.split(":")[0]) * 60 + parseInt(newSchedule.departure_time.split(":")[1]);
      const arrMinutes = parseInt(newSchedule.arrival_time.split(":")[0]) * 60 + parseInt(newSchedule.arrival_time.split(":")[1]);
      if (arrMinutes <= depMinutes) {
        alert("Arrival time must be after departure time.");
        return;
      }
    }
    
    // Validate price is positive
    const priceValue = parseFloat(newSchedule.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      alert("Please enter a valid price greater than 0.");
      return;
    }
    
    try {
      console.log("Sending trip data:", JSON.stringify(newSchedule));
      
      const response = await fetch("/api/dashboards/admin/schedules.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSchedule),
      });
      
      console.log("Response status:", response.status);
      
      // Check if response is OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        alert(`Failed to create trip: ${response.status} - ${errorData.error || 'Server error'}${errorData.details ? ' - ' + errorData.details : ''}`);
        return;
      }
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (data.message || data.success) {
        setNewSchedule({ route_id: "", bus_id: "", date: "", departure_time: "", arrival_time: "", price: "", status: "scheduled" });
        setIsAddDialogOpen(false);
        fetchData();
        alert("Trip created successfully!");
        
        // Get route name for notification
        const routeName = routes.find(r => r.id === parseInt(newSchedule.route_id))?.origin + ' - ' + 
                         routes.find(r => r.id === parseInt(newSchedule.route_id))?.destination || 'New route';
        
        // Create notification for admin (API already handles this)
        toast.success("Trip created successfully!");
        toast.info("Passengers will be notified of the new trip");
        
        // Refresh notifications
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
      } else if (data.error) {
        alert(`Failed to create trip: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      
      // More detailed error message
      let errorMessage = "Failed to create trip. ";
      if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
        errorMessage += "Could not connect to server. Make sure XAMPP Apache is running.";
      } else if (error.message.includes("not valid JSON")) {
        // The server returned HTML instead of JSON - likely a PHP error
        errorMessage += "Server returned an error. Please check the browser console network tab for details.";
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    }
  };

  const updateSchedule = async () => {
    if (!selectedTrip) return;
    try {
      const response = await fetch("/api/dashboards/admin/schedules.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedTrip),
      });
      const data = await response.json();
      if (data.message) {
        setIsEditDialogOpen(false);
        setSelectedTrip(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
    }
  };

  const cancelTrip = async () => {
    if (!selectedTrip) return;
    try {
      const response = await fetch("/api/dashboards/admin/schedules.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_id: selectedTrip.trip_id || selectedTrip.schedule_id, status: "cancelled" }),
      });
      const data = await response.json();
      if (data.message) {
        setIsCancelDialogOpen(false);
        setSelectedTrip(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error cancelling trip:", error);
    }
  };

  const deleteTrip = async () => {
    if (!selectedTrip) return;
    try {
      const tripId = selectedTrip.trip_id || selectedTrip.schedule_id;
      const response = await fetch("/api/dashboards/admin/schedules.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_id: tripId }),
      });
      const data = await response.json();
      if (data.message || data.success) {
        setIsDeleteDialogOpen(false);
        setSelectedTrip(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  const fetchTripPassengers = async (trip) => {
    setSelectedTrip(trip);
    try {
      const response = await fetch(`/api/dashboards/drivers/trip_passengers.php?schedule_id=${trip.schedule_id}`);
      const data = await response.json();
      if (data.data) {
        setTripPassengers(data.data);
      } else {
        setTripPassengers([]);
      }
    } catch (error) {
      console.error("Error fetching passengers:", error);
      setTripPassengers([]);
    }
    setIsPassengersDialogOpen(true);
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch("/api/dashboards/admin/assign_driver.php");
      const data = await response.json();
      if (data.data) {
        setDrivers(data.data);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const openAssignDriverDialog = async (trip) => {
    setSelectedTrip(trip);
    await fetchDrivers();
    setIsAssignDriverDialogOpen(true);
  };

  const assignDriver = async () => {
    if (!selectedTrip || !selectedDriver) return;
    try {
      const tripId = selectedTrip.trip_id || selectedTrip.schedule_id;
      const response = await fetch("/api/dashboards/admin/assign_driver.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          driver_id: selectedDriver, 
          trip_id: tripId 
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setIsAssignDriverDialogOpen(false);
        setSelectedDriver("");
        fetchData();
      } else {
        alert(data.message || "Failed to assign driver");
      }
    } catch (error) {
      console.error("Error assigning driver:", error);
      alert("Failed to assign driver");
    }
  };

  const openEditDialog = (trip) => {
    setSelectedTrip({ ...trip });
    setIsEditDialogOpen(true);
  };

  const openCancelDialog = (trip) => {
    setSelectedTrip(trip);
    setIsCancelDialogOpen(true);
  };

  const openDeleteDialog = (trip) => {
    setSelectedTrip(trip);
    setIsDeleteDialogOpen(true);
  };

  const filteredTrips = schedules.filter(trip => 
    trip.start_point?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.end_point?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.bus_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-700";
      case "completed": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      case "in-progress": return "bg-yellow-100 text-yellow-700";
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
          <h1 className="text-3xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-600 mt-1">Manage trip schedules and view passengers</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Trip
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold">{schedules.filter(t => t.status === "scheduled").length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{schedules.filter(t => t.status === "completed").length}</p>
              </div>
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold">{schedules.filter(t => t.status === "cancelled").length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search trips..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full md:w-64"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Trips</CardTitle>
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
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((trip) => (
                  <tr key={trip.schedule_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">#{trip.schedule_id}</td>
                    <td className="py-3 px-4">{trip.start_point} → {trip.end_point}</td>
                    <td className="py-3 px-4">{trip.bus_number}</td>
                    <td className="py-3 px-4">{trip.date}</td>
                    <td className="py-3 px-4">{trip.departure_time}</td>
                    <td className="py-3 px-4">{trip.arrival_time}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => fetchTripPassengers(trip)}
                          title="View Passengers"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-green-600"
                          onClick={() => openAssignDriverDialog(trip)}
                          title="Assign Driver"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openEditDialog(trip)}
                          title="Edit Trip"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {trip.status !== "cancelled" && trip.status !== "completed" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500"
                            onClick={() => openCancelDialog(trip)}
                            title="Cancel Trip"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-800"
                          onClick={() => openDeleteDialog(trip)}
                          title="Delete Trip"
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

      {/* Create Trip Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Route</Label>
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
              <Label>Bus</Label>
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
              <Label>Date</Label>
              <Input
                type="date"
                value={newSchedule.date}
                onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departure Time</Label>
                <Input
                  type="time"
                  value={newSchedule.departure_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, departure_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Arrival Time</Label>
                <Input
                  type="time"
                  value={newSchedule.arrival_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, arrival_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Price (XAF)</Label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={newSchedule.price}
                onChange={(e) => setNewSchedule({ ...newSchedule, price: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={createSchedule}>Create Trip</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Trip Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <Input value={`${selectedTrip.start_point} → ${selectedTrip.end_point}`} disabled />
              </div>
              <div className="space-y-2">
                <Label>Bus</Label>
                <Input value={selectedTrip.bus_number} disabled />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedTrip.date}
                  onChange={(e) => setSelectedTrip({ ...selectedTrip, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure</Label>
                  <Input
                    type="time"
                    value={selectedTrip.departure_time}
                    onChange={(e) => setSelectedTrip({ ...selectedTrip, departure_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arrival</Label>
                  <Input
                    type="time"
                    value={selectedTrip.arrival_time}
                    onChange={(e) => setSelectedTrip({ ...selectedTrip, arrival_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedTrip.status}
                  onValueChange={(value) => setSelectedTrip({ ...selectedTrip, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={updateSchedule}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Trip Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Trip</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to cancel the trip from <strong>{selectedTrip.start_point}</strong> to <strong>{selectedTrip.end_point}</strong> on <strong>{selectedTrip.date}</strong>?
              </p>
              <p className="text-red-500 mt-2">This action cannot be undone. All passengers will be notified.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>Keep Trip</Button>
            <Button variant="destructive" onClick={cancelTrip}>Cancel Trip</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Trip Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trip</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to delete the trip from <strong>{selectedTrip.start_point}</strong> to <strong>{selectedTrip.end_point}</strong> on <strong>{selectedTrip.date}</strong>?
              </p>
              <p className="text-red-500 mt-2">This action cannot be undone.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteTrip}>Delete Trip</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Passengers Dialog */}
      <Dialog open={isPassengersDialogOpen} onOpenChange={setIsPassengersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trip Passengers</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="py-4">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {selectedTrip.start_point} → {selectedTrip.end_point}
                </p>
                <p className="text-xs text-blue-700">
                  {selectedTrip.date} | {selectedTrip.departure_time} - {selectedTrip.arrival_time}
                </p>
              </div>
              <div className="space-y-3">
                {tripPassengers.length > 0 ? (
                  tripPassengers.map((passenger) => (
                    <div key={passenger.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{passenger.passenger_name}</p>
                          <p className="text-xs text-gray-500">{passenger.seats_booked} seat(s)</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {passenger.booking_status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No passengers booked for this trip</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Passengers:</span>
                  <span className="font-medium">{tripPassengers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Seats Booked:</span>
                  <span className="font-medium">{tripPassengers.reduce((sum, p) => sum + p.seats_booked, 0)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPassengersDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={isAssignDriverDialogOpen} onOpenChange={setIsAssignDriverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver to Trip</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Trip</p>
                <p className="font-medium">{selectedTrip.start_point} → {selectedTrip.end_point}</p>
                <p className="text-sm text-gray-500">{selectedTrip.date} at {selectedTrip.departure_time}</p>
              </div>
              <div className="space-y-2">
                <Label>Select Driver</Label>
                <Select
                  value={selectedDriver}
                  onValueChange={setSelectedDriver}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} {driver.license_number ? `(${driver.license_number})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDriverDialogOpen(false)}>Cancel</Button>
            <Button onClick={assignDriver} disabled={!selectedDriver}>Assign Driver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
