import { useState, useRef, useEffect } from "react";
import { Settings, Lock, User, Bell, Save, Eye, EyeOff, Camera, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { toast } from "sonner";

export default function DriverSettings() {
  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem("busfare_current_user");
    return user ? JSON.parse(user) : null;
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    notify_trips: true,
    notify_passengers: true,
    notify_changes: true
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Profile picture state
  const [profileImage, setProfileImage] = useState(() => {
    const stored = localStorage.getItem("busfare_driver_profile_image");
    return stored || null;
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Load notification settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser?.id) return;
      
      try {
        const response = await fetch(
          `http://localhost/Bus_system/api/dashboards/drivers/settings.php?user_id=${currentUser.id}`
        );
        const data = await response.json();
        
        if (data.status === "success" && data.data) {
          setNotificationSettings({
            notify_trips: data.data.notify_trips ?? true,
            notify_passengers: data.data.notify_passengers ?? true,
            notify_changes: data.data.notify_changes ?? true
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    
    loadSettings();
  }, [currentUser?.id]);

  // Handle notification toggle change
  const handleNotificationToggle = (key) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save notification settings
  const handleSaveNotificationSettings = async () => {
    if (!currentUser?.id) return;
    
    setIsSavingSettings(true);
    
    try {
      const response = await fetch("http://localhost/Bus_system/api/dashboards/drivers/settings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          settings: notificationSettings
        })
      });
      
      const data = await response.json();
      
      if (data.status === "success") {
        toast.success("Notification settings saved!");
      } else {
        toast.error(data.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle profile picture upload
  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      toast.error("Please upload a valid image (JPG, PNG, or GIF)");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Convert to base64 and store in localStorage (for demo purposes)
      // In production, you would upload to a server
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const base64 = event.target?.result;
        if (base64) {
          // Store in localStorage
          localStorage.setItem("busfare_driver_profile_image", base64);
          setProfileImage(base64);
          toast.success("Profile picture updated!");
        }
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        toast.error("Failed to read image");
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading profile:", error);
      toast.error("Failed to upload profile picture");
      setIsUploading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const handleSavePassword = async () => {
    // Validation
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setMessage({ type: "error", text: "Please fill in all password fields" });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwords.new.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setIsSavingPassword(true);
    setMessage({ type: "", text: "" });

    try {
      const user = localStorage.getItem("busfare_current_user");
      const userData = user ? JSON.parse(user) : {};
      
      const response = await fetch("http://localhost/Bus_system/api/dashboards/drivers/change_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.id,
          current_password: passwords.current,
          new_password: passwords.new,
          confirm_password: passwords.confirm
        })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setMessage({ type: "success", text: "Password updated successfully!" });
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update password" });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage({ type: "error", text: "Failed to update password. Please try again." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
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
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <div className="relative">
                <Input
                  id="current"
                  name="current"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <div className="relative">
                <Input
                  id="new"
                  name="new"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  name="confirm"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              onClick={handleSavePassword}
              disabled={isSavingPassword}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSavingPassword ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Picture
          </CardTitle>
          <CardDescription>
            Update your profile photo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center relative overflow-hidden">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-orange-700">
                  {currentUser?.name?.charAt(0) || "U"}
                </span>
              )}
              <div 
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleProfileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload New Photo
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: "notify_trips", label: "New trip assignments", description: "Get notified when you're assigned a new trip" },
              { id: "notify_passengers", label: "Passenger updates", description: "Get notified when passengers book or cancel" },
              { id: "notify_changes", label: "Schedule changes", description: "Get notified about trip time or route changes" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings[item.id] ?? true}
                    onChange={() => handleNotificationToggle(item.id)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            ))}
            
            <Button 
              onClick={handleSaveNotificationSettings}
              disabled={isSavingSettings}
              className="bg-orange-500 hover:bg-orange-600 mt-4"
            >
              {isSavingSettings ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{currentUser?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">User ID</p>
              <p className="font-mono">#{currentUser?.id || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Account Type</p>
              <p className="font-medium">Driver</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="font-medium">Just now</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
