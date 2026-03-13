import { useState, useEffect } from "react";
import { Bus as BusIcon, Plus, Search, Edit, Trash2, BusFront, Star } from "lucide-react";
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

export function Buses() {
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [newBus, setNewBus] = useState({ bus_number: "", capacity: "", type: "standard" });

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboards/admin/buses.php");
      const data = await response.json();
      if (data.data) setBuses(data.data);
    } catch (error) {
      console.error("Error fetching buses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBus = async () => {
    if (!newBus.bus_number || !newBus.capacity) return;
    try {
      const response = await fetch("/api/dashboards/admin/buses.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBus),
      });
      const data = await response.json();
      if (data.message) {
        setNewBus({ bus_number: "", capacity: "", type: "standard" });
        setIsAddDialogOpen(false);
        fetchBuses();
      }
    } catch (error) {
      console.error("Error creating bus:", error);
    }
  };

  const updateBus = async () => {
    if (!selectedBus) return;
    try {
      const response = await fetch("/api/dashboards/admin/buses.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBus.id,
          bus_number: selectedBus.bus_number,
          capacity: selectedBus.capacity,
          type: selectedBus.type
        }),
      });
      const data = await response.json();
      if (data.message) {
        setIsEditDialogOpen(false);
        setSelectedBus(null);
        fetchBuses();
      }
    } catch (error) {
      console.error("Error updating bus:", error);
    }
  };

  const deleteBus = async () => {
    if (!selectedBus) return;
    try {
      const response = await fetch("/api/dashboards/admin/buses.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedBus.id }),
      });
      const data = await response.json();
      if (data.message) {
        setIsDeleteDialogOpen(false);
        setSelectedBus(null);
        fetchBuses();
      }
    } catch (error) {
      console.error("Error deleting bus:", error);
    }
  };

  const openEditDialog = (bus) => {
    setSelectedBus({ ...bus });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (bus) => {
    setSelectedBus(bus);
    setIsDeleteDialogOpen(true);
  };

  const filteredBuses = buses.filter(bus => 
    bus.bus_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBusTypeColor = (type) => {
    switch (type) {
      case "vip": return "bg-purple-100 text-purple-700 border-purple-200";
      case "standard": return "bg-blue-100 text-blue-700 border-blue-200";
      case "luxury": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
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
          <h1 className="text-3xl font-bold text-gray-900">Buses</h1>
          <p className="text-gray-600 mt-1">Manage your fleet of buses</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Bus
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Buses</p>
                <p className="text-2xl font-bold">{buses.length}</p>
              </div>
              <BusIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Seats</p>
                <p className="text-2xl font-bold">{buses.reduce((sum, bus) => sum + (parseInt(bus.capacity) || 0), 0)}</p>
              </div>
              <BusFront className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">VIP Buses</p>
                <p className="text-2xl font-bold">{buses.filter(b => b.type === "vip").length}</p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Standard</p>
                <p className="text-2xl font-bold">{buses.filter(b => b.type === "standard").length}</p>
              </div>
              <BusIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Buses</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search buses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Bus Number</th>
                  <th className="text-left py-3 px-4 font-medium">Capacity</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuses.map((bus) => (
                  <tr key={bus.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{bus.id}</td>
                    <td className="py-3 px-4 font-medium">{bus.bus_number}</td>
                    <td className="py-3 px-4">{bus.capacity} seats</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getBusTypeColor(bus.type)}`}>
                        {bus.type || "standard"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {bus.created_at ? new Date(bus.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openEditDialog(bus)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500"
                          onClick={() => openDeleteDialog(bus)}
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

      {/* Add Bus Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Bus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bus_number">Bus Number</Label>
              <Input
                id="bus_number"
                placeholder="e.g. BUS-001"
                value={newBus.bus_number}
                onChange={(e) => setNewBus({ ...newBus, bus_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="e.g. 50"
                value={newBus.capacity}
                onChange={(e) => setNewBus({ ...newBus, capacity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Bus Type</Label>
              <select
                id="type"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={newBus.type}
                onChange={(e) => setNewBus({ ...newBus, type: e.target.value })}
              >
                <option value="standard">Standard</option>
                <option value="vip">VIP</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={createBus}>Add Bus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bus Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bus</DialogTitle>
          </DialogHeader>
          {selectedBus && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_bus_number">Bus Number</Label>
                <Input
                  id="edit_bus_number"
                  value={selectedBus.bus_number}
                  onChange={(e) => setSelectedBus({ ...selectedBus, bus_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_capacity">Capacity</Label>
                <Input
                  id="edit_capacity"
                  type="number"
                  value={selectedBus.capacity}
                  onChange={(e) => setSelectedBus({ ...selectedBus, capacity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_type">Bus Type</Label>
                <select
                  id="edit_type"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={selectedBus.type || "standard"}
                  onChange={(e) => setSelectedBus({ ...selectedBus, type: e.target.value })}
                >
                  <option value="standard">Standard</option>
                  <option value="vip">VIP</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={updateBus}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bus Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bus</DialogTitle>
          </DialogHeader>
          {selectedBus && (
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to delete the bus <strong>{selectedBus.bus_number}</strong>? 
                This action cannot be undone.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteBus}>Delete Bus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
