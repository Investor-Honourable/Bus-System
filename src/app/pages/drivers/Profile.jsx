import { useState, useEffect } from "react";
import { User, Phone, Bus, Mail, Shield, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";

export default function DriverProfile() {
  const [driverData, setDriverData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const fetchDriverProfile = async () => {
    setIsLoading(true);
    try {
      const user = localStorage.getItem("busfare_current_user");
      if (user) {
        const userData = JSON.parse(user);
        setCurrentUser(userData);
        
        // Fetch driver profile from API
        const response = await fetch("http://localhost/Bus_system/api/dashboards/drivers/profile.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userData.id, action: "view" })
        });
        const data = await response.json();
        
        if (data.status === "success" && data.data) {
          setDriverData(data.data);
          setFormData({
            name: data.data.name || "",
            email: data.data.email || "",
            phone: data.data.phone || "",
          });
        } else {
          // Fallback to localStorage data
          setFormData({
            name: userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching driver profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const user = localStorage.getItem("busfare_current_user");
      const userData = user ? JSON.parse(user) : {};
      
      // Call API to update profile
      const response = await fetch("http://localhost/Bus_system/api/dashboards/drivers/profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.id,
          action: "update",
          name: formData.name,
          phone: formData.phone
        })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        // Update localStorage with new data
        const updatedUser = {
          ...userData,
          name: formData.name,
          phone: formData.phone,
        };
        localStorage.setItem("busfare_current_user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setDriverData(data.data);
        
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const displayUser = driverData || currentUser;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Driver Profile</h1>
        <p className="text-gray-600 mt-1">View and manage your personal information</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-orange-700">
                {(displayUser?.name || "Driver").charAt(0)}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{displayUser?.name || "Driver"}</h2>
              <p className="text-gray-500">{displayUser?.email}</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                Driver
              </div>
              {driverData?.license_number && (
                <p className="mt-1 text-sm text-gray-500">License: {driverData.license_number}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <CardDescription>
            Update your personal details. Click "Edit" to make changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === "success" ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled={true}
                  className="pl-10 bg-gray-50"
                  placeholder="Email cannot be changed"
                />
              </div>
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Role (Read only) */}
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                <Shield className="w-5 h-5 text-orange-600" />
                <span className="font-medium">Driver</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-orange-500 hover:bg-orange-600">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: currentUser.name || "",
                        email: currentUser.email || "",
                        phone: currentUser.phone || "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-mono font-medium">#{displayUser?.id}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="font-medium">Driver</p>
            </div>
            {driverData?.total_trips !== null && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Trips</p>
                <p className="font-medium">{driverData.total_trips}</p>
              </div>
            )}
            {driverData?.rating && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Rating</p>
                <p className="font-medium">{driverData.rating} / 5.0</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
