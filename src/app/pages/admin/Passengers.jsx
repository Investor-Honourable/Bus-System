import { useState, useEffect } from "react";
import { Users, Plus, Search, Edit, Trash2, UserPlus, MapPin, Bus, AlertCircle, Loader2, Calendar, Eye } from "lucide-react";
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

export function Passengers() {
  const [passengers, setPassengers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignment, setAssignment] = useState({
    passenger_id: "",
    trip_id: "",
    driver_id: "",
    seat_number: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [passengersRes, tripsRes, driversRes] = await Promise.all([
        fetch("/api/dashboards/admin/assign_passenger.php"),
        fetch("/api/dashboards/admin/schedules.php"),
        fetch("/api/dashboards/admin/drivers.php")
      ]);
      
      const passengersData = await passengersRes.json();
      const tripsData = await tripsRes.json();
      const driversData = await driversRes.json();
      
      const passengersList = passengersData.passengers || passengersData.data || [];
      const tripsList = tripsData.trips || tripsData.data || [];
      const driversList = driversData.drivers || driversData.data || [];
      
      if (passengersList.length > 0) setPassengers(passengersList);
      if (tripsList.length > 0) setTrips(tripsList);
      if (driversList.length > 0) setDrivers(driversList);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const assignPassenger = async () => {
    if (!assignment.passenger_id || !assignment.trip_id) {
      setError("Please select both passenger and trip");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/dashboards/admin/assign_passenger.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passenger_id: assignment.passenger_id,
          trip_id: assignment.trip_id,
          driver_id: assignment.driver_id || null,
          seat_number: assignment.seat_number || null
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSuccess(data.message || "Passenger assigned successfully");
        setAssignment({ passenger_id: "", trip_id: "", driver_id: "", seat_number: "" });
        setIsAssignDialogOpen(false);
        fetchData();
      } else {
        setError(data.message || "Failed to assign passenger");
      }
    } catch (err) {
      console.error("Error assigning passenger:", err);
      setError("Failed to assign passenger");
    } finally {
      setIsSaving(false);
    }
  };

  const updateAssignment = async () => {
    if (!selectedBooking) return;

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/dashboards/admin/assign_passenger.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          trip_id: selectedBooking.trip_id,
          driver_id: selectedBooking.driver_id || null,
          seat_number: selectedBooking.seat_number || null,
          status: selectedBooking.booking_status || 'confirmed'
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSuccess(data.message || "Assignment updated successfully");
        setIsEditDialogOpen(false);
        setSelectedBooking(null);
        fetchData();
      } else {
        setError(data.message || "Failed to update assignment");
      }
    } catch (err) {
      console.error("Error updating assignment:", err);
      setError("Failed to update assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const removePassenger = async () => {
    if (!selectedBooking) return;

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/dashboards/admin/assign_passenger.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: selectedBooking.id }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSuccess(data.message || "Passenger removed successfully");
        setIsDeleteDialogOpen(false);
        setSelectedBooking(null);
        fetchData();
      } else {
        setError(data.message || "Failed to remove passenger");
      }
    } catch (err) {
      console.error("Error removing passenger:", err);
      setError("Failed to remove passenger");
    } finally {
      setIsSaving(false);
    }
  };

  const openAssignDialog = () => {
    setAssignment({ passenger_id: "", trip_id: "", driver_id: "", seat_number: "" });
    setError("");
    setIsAssignDialogOpen(true);
  };

  const openEditDialog = (booking) => {
    setSelectedBooking({ ...booking });
    setError("");
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (booking) => {
    setSelectedBooking(booking);
    setError("");
    setIsDeleteDialogOpen(true);
  };

  const filteredPassengers = passengers.filter(passenger => 
    passenger.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    passenger.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    passenger.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTripInfo = (tripId) => {
    const trip = trips.find(t => String(t.id) === String(tripId));
    return trip ? `${trip.start_point || trip.origin} → ${trip.end_point || trip.destination} (${trip.date || trip.departure_date})` : 'N/A';
  };

  const getDriverInfo = (driverId) => {
    const driver = drivers.find(d => String(d.id) === String(driverId));
    return driver ? `${driver.name || driver.username}` : 'N/A';
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
          <h1 className="text-3xl font-bold text-gray-900">Passengers</h1>
          <p className="text-gray-600 mt-1">Manage passenger assignments to trips and drivers</p>
        </div>
        <Button onClick={openAssignDialog} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Assign Passenger
        </Button>
      </div>

      {/* Error/Success Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <AlertCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Passengers</p>
                <p className="text-2xl font-bold">{passengers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Trips</p>
                <p className="text-2xl font-bold">{trips.filter(t => t.status === 'scheduled').slice(0, 50).length}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Drivers</p>
                <p className="text-2xl font-bold">{drivers.filter(d => d.status === 'active').length}</p>
              </div>
              <Bus className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{passengers.reduce((sum, p) => sum + (p.total_bookings || 0), 0)}</p>
              </div>
              <MapPin className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search passengers by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full md:w-64"
        />
      </div>

      {/* Passengers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Passengers</CardTitle>
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
                  <th className="text-left py-3 px-4 font-medium">Gender</th>
                  <th className="text-left py-3 px-4 font-medium">Bookings</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPassengers.map((passenger) => (
                  <tr key={passenger.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{passenger.id}</td>
                    <td className="py-3 px-4 font-medium">{passenger.name || "-"}</td>
                    <td className="py-3 px-4">{passenger.email}</td>
                    <td className="py-3 px-4">{passenger.phone || "-"}</td>
                    <td className="py-3 px-4">{passenger.gender || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {passenger.total_bookings || 0} bookings
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        passenger.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {passenger.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setAssignment({ ...assignment, passenger_id: String(passenger.id) });
                            setIsAssignDialogOpen(true);
                          }}
                          title="Assign to Trip"
                        >
                          <UserPlus className="w-4 h-4" />
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

      {/* Assign Passenger Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Passenger to Trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Passenger *</Label>
                <Select
                  value={assignment.passenger_id}
                  onValueChange={(value) => setAssignment({ ...assignment, passenger_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a passenger" />
                  </SelectTrigger>
                  <SelectContent>
                    {passengers.map((passenger) => (
                      <SelectItem key={passenger.id} value={String(passenger.id)}>
                        {passenger.name} ({passenger.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Trip *</Label>
                <Select
                  value={assignment.trip_id}
                  onValueChange={(value) => setAssignment({ ...assignment, trip_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a trip" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.filter(t => t.status === 'scheduled' && t.available_seats > 0).slice(0, 50).map((trip) => (
                      <SelectItem key={trip.id} value={String(trip.id)}>
                        {trip.start_point || trip.origin} → {trip.end_point || trip.destination} ({trip.date || trip.departure_date}) - {trip.available_seats} seats
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assign Driver (Optional)</Label>
                <Select
                  value={assignment.driver_id}
                  onValueChange={(value) => setAssignment({ ...assignment, driver_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.filter(d => d.status === 'active').map((driver) => (
                      <SelectItem key={driver.id} value={String(driver.id)}>
                        {driver.name || driver.username} - {driver.license_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Seat Number (Optional)</Label>
                <Input
                  placeholder="e.g. S1, A12"
                  value={assignment.seat_number}
                  onChange={(e) => setAssignment({ ...assignment, seat_number: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={assignPassenger} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Passenger"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>Passenger</Label>
                <Input value={selectedBooking.passenger_name || selectedBooking.user_name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Trip</Label>
                <Input value={getTripInfo(selectedBooking.trip_id)} disabled />
              </div>
              <div className="space-y-2">
                <Label>Seat Number</Label>
                <Input
                  placeholder="e.g. S1, A12"
                  value={selectedBooking.seat_number || ""}
                  onChange={(e) => setSelectedBooking({ ...selectedBooking, seat_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedBooking.booking_status || "confirmed"}
                  onValueChange={(value) => setSelectedBooking({ ...selectedBooking, booking_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={updateAssignment} disabled={isSaving}>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Passenger</AlertDialogTitle>
          </AlertDialogHeader>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <p className="py-4">
            Are you sure you want to remove <strong>{selectedBooking?.passenger_name || selectedBooking?.user_name}</strong> from this trip? 
            This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removePassenger} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
