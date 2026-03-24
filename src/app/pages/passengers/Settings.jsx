import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Globe, 
  Lock, 
  Camera, 
  Save, 
  Trash2, 
  Download, 
  LogOut,
  Smartphone,
  Mail,
  Check,
  X,
  Loader2,
  Info,
  Calendar,
  Hash,
  UserCog,
  Ticket,
  Wallet,
  MapPin
} from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Switch } from "../../components/ui/switch.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog.jsx";
import { useTranslation } from "../../i18n/LanguageContext.jsx";

// API base URL
const API_URL = "/api";

// Get user from localStorage
const getStoredUser = () => {
  const userStr = localStorage.getItem("busfare_current_user");
  return userStr ? JSON.parse(userStr) : null;
};

export function Settings() {
  const { t, language, changeLanguage, languages: availableLanguages } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data from API
  const [userData, setUserData] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    username: "",
    gender: "",
    role: "",
    created_at: ""
  });
  
  const [stats, setStats] = useState({
    active_tickets: 0,
    total_bookings: 0,
    total_spent: 0,
    completed_bookings: 0
  });
  
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    booking_confirmations: true,
    trip_reminders: true,
    promotions: false,
    two_factor_enabled: false,
    language: "en"
  });
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loginActivity, setLoginActivity] = useState([]);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: ""
  });
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    type: "mobile_money",
    provider: "",
    account_number: ""
  });

  // Fetch data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = getStoredUser();
      if (!user || !user.id) {
        navigate("/login");
        return;
      }
      
      const response = await fetch(`${API_URL}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", user_id: user.id })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setUserData(data.data.user);
        setStats({
          active_tickets: data.data.stats?.active_tickets || 0,
          total_bookings: data.data.stats?.total_bookings || 0,
          total_spent: data.data.stats?.total_spent || 0,
          completed_bookings: data.data.stats?.completed_bookings || 0
        });
        setProfileForm({
          name: data.data.user.name,
          email: data.data.user.email,
          phone: data.data.user.phone || ""
        });
        setSettings({
          email_notifications: data.data.settings.email_notifications,
          sms_notifications: data.data.settings.sms_notifications,
          booking_confirmations: data.data.settings.booking_confirmations,
          trip_reminders: data.data.settings.trip_reminders,
          promotions: data.data.settings.promotions,
          two_factor_enabled: data.data.settings.two_factor_enabled,
          language: data.data.settings.language
        });
        setPaymentMethods(data.data.payment_methods);
        setLoginActivity(data.data.login_activity);
      } else if (data.status === "error" && (data.message === "Not authenticated" || data.message === "User not authenticated")) {
        navigate("/login");
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setError("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (message, isError = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(""), 5000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Profile handlers
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    
    try {
      const response = await fetch(`${API_URL}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          user_id: getStoredUser()?.id,
          ...profileForm
        })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setUserData(prev => ({ ...prev, ...profileForm }));
        // Update localStorage with new user data
        const currentUser = JSON.parse(localStorage.getItem("busfare_current_user") || "{}");
        localStorage.setItem("busfare_current_user", JSON.stringify({
          ...currentUser,
          name: profileForm.name,
          email: profileForm.email
        }));
        // Dispatch event to notify Layout of profile update
        window.dispatchEvent(new Event('user-profile-updated'));
        showMessage("Profile updated successfully!");
      } else {
        showMessage(data.message, true);
      }
    } catch (err) {
      showMessage("Failed to update profile", true);
    } finally {
      setIsSaving(false);
    }
  };

  // Password change handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showMessage("New passwords do not match", true);
      return;
    }
    
    if (passwordForm.new_password.length < 6) {
      showMessage("Password must be at least 6 characters", true);
      return;
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`${API_URL}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          user_id: getStoredUser()?.id,
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        showMessage("Password changed successfully!");
        setPasswordDialogOpen(false);
        setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      } else {
        showMessage(data.message, true);
      }
    } catch (err) {
      showMessage("Failed to change password", true);
    } finally {
      setIsSaving(false);
    }
  };

  // Notification handlers
  const handleNotificationToggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    
    try {
      await fetch(`${API_URL}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_notifications",
          ...newSettings
        })
      });
    } catch (err) {
      console.error("Failed to update notifications");
    }
  };

  // Security handlers
  const handleTwoFactorToggle = async () => {
    const newValue = !settings.two_factor_enabled;
    setSettings(prev => ({ ...prev, two_factor_enabled: newValue }));
    
    try {
      await fetch(`${API_URL}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_security",
          two_factor_enabled: newValue
        })
      });
    } catch (err) {
      console.error("Failed to update security settings");
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm("Are you sure you want to logout from all devices?")) return;
    
    try {
      await fetch(`${API_URL}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "logout_all" })
      });
      navigate("/login");
    } catch (err) {
      showMessage("Failed to logout", true);
    }
  };

  // Language handler - use translation context
  const handleLanguageChange = async (lang) => {
    setSettings(prev => ({ ...prev, language: lang }));
    
    // Use the translation context to change language and persist
    await changeLanguage(lang);
  };

  // Payment handlers
  const handleAddPayment = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await fetch(`${API_URL}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_payment",
          user_id: getStoredUser()?.id,
          ...newPayment
        })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        showMessage("Payment method added!");
        setAddPaymentOpen(false);
        setNewPayment({ type: "mobile_money", provider: "", account_number: "" });
        fetchUserData(); // Refresh payment methods
      } else {
        showMessage(data.message, true);
      }
    } catch (err) {
      showMessage("Failed to add payment method", true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePayment = async (id) => {
    if (!window.confirm("Are you sure you want to remove this payment method?")) return;
    
    try {
      const response = await fetch(`${API_URL}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_payment",
          user_id: getStoredUser()?.id,
          payment_id: id
        })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        showMessage("Payment method removed");
        fetchUserData();
      } else {
        showMessage(data.message, true);
      }
    } catch (err) {
      showMessage("Failed to remove payment method", true);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await fetch(`${API_URL}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_default_payment",
          user_id: getStoredUser()?.id,
          payment_id: id
        })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        showMessage("Default payment method updated");
        fetchUserData();
      } else {
        showMessage(data.message, true);
      }
    } catch (err) {
      showMessage("Failed to update default", true);
    }
  };

  // Privacy handlers
  const handleDeleteAccount = async () => {
    const confirmMessage = "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.";
    if (!window.confirm(confirmMessage)) return;
    if (!window.confirm("This is your final warning. Your account will be deleted forever. Continue?")) return;
    
    try {
      const response = await fetch(`${API_URL}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_account", user_id: getStoredUser()?.id })
      });
      const data = await response.json();
      
      if (data.status === "success") {
        navigate("/login");
      } else {
        showMessage(data.message, true);
      }
    } catch (err) {
      showMessage("Failed to delete account", true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const settingsTabs = [
    { id: "info", label: "My Info", icon: Info },
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payment", label: "Payment Methods", icon: CreditCard },
    { id: "language", label: "Language", icon: Globe },
    { id: "privacy", label: "Privacy", icon: Lock }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Error/Success Messages */}
      {error && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-blue-100">Manage your account preferences and settings</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <nav className="p-2">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* My Info Tab */}
            {activeTab === "info" && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">My Information</h2>
                <p className="text-gray-600 mb-8">View all your account information in one place</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Picture Display */}
                  <div className="col-span-full flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-40 h-40 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                        {userData.name ? userData.name.split(" ").map(n => n[0]).join("").toUpperCase() : "?"}
                      </div>
                      {userData.id && (
                        <div className="absolute bottom-2 right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white"></div>
                      )}
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Hash className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-500">User ID</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800"> #{userData.id || "-"}</p>
                  </div>

                  {/* Username */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <UserCog className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-500">Username</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">{userData.username || "-"}</p>
                  </div>

                  {/* Full Name */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-500">Full Name</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">{userData.name || "-"}</p>
                  </div>

                  {/* Email */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-500">Email Address</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">{userData.email || "-"}</p>
                  </div>

                  {/* Phone */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-500">Phone Number</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">{userData.phone || "-"}</p>
                  </div>

                  {/* Gender */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-500">Gender</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800 capitalize">{userData.gender || "-"}</p>
                  </div>

                  {/* Account Type/Role */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-500">Account Type</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800 capitalize">{userData.role || "-"}</p>
                  </div>

                  {/* Member Since */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-500">Member Since</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {userData.created_at ? new Date(userData.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      }) : "-"}
                    </p>
                  </div>
                </div>

                {/* Account Status Badge */}
                {userData.id && (
                  <div className="mt-8 flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Active Account</span>
                    </div>
                  </div>
                )}

                {/* Travel Stats Section */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Travel Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Active Tickets */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Ticket className="w-5 h-5" />
                        <span className="text-sm opacity-90">Active Tickets</span>
                      </div>
                      <p className="text-3xl font-bold">{stats.active_tickets || 0}</p>
                    </div>

                    {/* Total Bookings */}
                    <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5" />
                        <span className="text-sm opacity-90">Total Bookings</span>
                      </div>
                      <p className="text-3xl font-bold">{stats.total_bookings || 0}</p>
                    </div>

                    {/* Completed Trips */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-5 h-5" />
                        <span className="text-sm opacity-90">Completed Trips</span>
                      </div>
                      <p className="text-3xl font-bold">{stats.completed_bookings || 0}</p>
                    </div>

                    {/* Total Spent */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-5 h-5" />
                        <span className="text-sm opacity-90">Total Spent</span>
                      </div>
                      <p className="text-3xl font-bold">XAF {Number(stats.total_spent || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>
                
                <form onSubmit={handleProfileSave} className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {userData.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <button
                        type="button"
                        className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Profile Picture</p>
                      <p className="text-sm text-gray-500">JPG, PNG or GIF. Max 2MB.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    
                    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" type="button">
                          <Lock className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>
                            Enter your current password and choose a new one.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input 
                              id="currentPassword" 
                              type="password"
                              value={passwordForm.current_password}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input 
                              id="newPassword" 
                              type="password"
                              value={passwordForm.new_password}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input 
                              id="confirmPassword" 
                              type="password"
                              value={passwordForm.confirm_password}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-600" disabled={isSaving}>
                              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Update Password
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </form>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Security Settings</h2>
                  
                  {/* Change Password */}
                  <div className="mb-8 pb-8 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" type="button">
                          <Lock className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword2">Current Password</Label>
                            <Input 
                              id="currentPassword2" 
                              type="password"
                              value={passwordForm.current_password}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword2">New Password</Label>
                            <Input 
                              id="newPassword2" 
                              type="password"
                              value={passwordForm.new_password}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword2">Confirm New Password</Label>
                            <Input 
                              id="confirmPassword2" 
                              type="password"
                              value={passwordForm.confirm_password}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-600" disabled={isSaving}>
                              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Update Password
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="mb-8 pb-8 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Switch 
                        checked={settings.two_factor_enabled}
                        onCheckedChange={handleTwoFactorToggle}
                      />
                    </div>
                  </div>

                  {/* Logout from all devices */}
                  <div className="mb-8 pb-8 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Logout from all devices</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      This will sign you out from all devices except this one.
                    </p>
                    <Button variant="outline" onClick={handleLogoutAll}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout Everywhere
                    </Button>
                  </div>

                  {/* Recent Login Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Login Activity</h3>
                    {loginActivity.length === 0 ? (
                      <p className="text-gray-500">No login activity recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {loginActivity.map((activity, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center justify-between p-4 rounded-lg ${
                              activity.is_current ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <Smartphone className="w-5 h-5 text-gray-600" />
                              <div>
                                <p className="font-medium text-gray-800">
                                  {activity.device || "Unknown Device"}
                                  {activity.is_current === 1 && (
                                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                      Current
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500">{activity.location || "Unknown location"}</p>
                              </div>
                            </div>
                            <span className="text-sm text-gray-400">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification Settings</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex items-center gap-4">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.email_notifications}
                      onCheckedChange={() => handleNotificationToggle("email_notifications")}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex items-center gap-4">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.sms_notifications}
                      onCheckedChange={() => handleNotificationToggle("sms_notifications")}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b">
                    <div>
                      <p className="font-medium text-gray-800">Booking Confirmations</p>
                      <p className="text-sm text-gray-500">Get notified when your booking is confirmed</p>
                    </div>
                    <Switch 
                      checked={settings.booking_confirmations}
                      onCheckedChange={() => handleNotificationToggle("booking_confirmations")}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b">
                    <div>
                      <p className="font-medium text-gray-800">Trip Reminders</p>
                      <p className="text-sm text-gray-500">Receive reminders before your scheduled trips</p>
                    </div>
                    <Switch 
                      checked={settings.trip_reminders}
                      onCheckedChange={() => handleNotificationToggle("trip_reminders")}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-gray-800">Promotions</p>
                      <p className="text-sm text-gray-500">Receive promotional offers and discounts</p>
                    </div>
                    <Switch 
                      checked={settings.promotions}
                      onCheckedChange={() => handleNotificationToggle("promotions")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {activeTab === "payment" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Payment Methods</h2>
                    <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Add New
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Payment Method</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddPayment} className="space-y-4">
                          <div>
                            <Label>Type</Label>
                            <select 
                              className="w-full p-2 border rounded-md"
                              value={newPayment.type}
                              onChange={(e) => setNewPayment(prev => ({ ...prev, type: e.target.value }))}
                            >
                              <option value="mobile_money">Mobile Money</option>
                              <option value="card">Card</option>
                            </select>
                          </div>
                          <div>
                            <Label>Provider</Label>
                            <Input 
                              placeholder={newPayment.type === "mobile_money" ? "MTN or Orange" : "Visa, MasterCard"}
                              value={newPayment.provider}
                              onChange={(e) => setNewPayment(prev => ({ ...prev, provider: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Account/Card Number</Label>
                            <Input 
                              placeholder="Phone number or card number"
                              value={newPayment.account_number}
                              onChange={(e) => setNewPayment(prev => ({ ...prev, account_number: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setAddPaymentOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-600" disabled={isSaving}>
                              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Add
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No payment methods added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentMethods.map((pm) => (
                        <div 
                          key={pm.id} 
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            pm.is_default ? "border-blue-500 bg-blue-50" : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              pm.type === "mobile_money" ? "bg-yellow-100" : "bg-blue-100"
                            }`}>
                              {pm.type === "mobile_money" ? (
                                <Smartphone className="w-6 h-6 text-yellow-600" />
                              ) : (
                                <CreditCard className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {pm.provider || (pm.type === "mobile_money" ? "Mobile Money" : "Card")}
                                {pm.is_default === 1 && (
                                  <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">••••{pm.account_number}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {pm.is_default !== 1 && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSetDefault(pm.id)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemovePayment(pm.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Language Settings */}
            {activeTab === "language" && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('settings.language')}</h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">
                    {t('settings.selectLanguage')}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all ${
                          settings.language === lang.code 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{lang.flag}</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-800">{lang.nativeName}</p>
                            <p className="text-sm text-gray-500">{lang.name}</p>
                          </div>
                        </div>
                        {settings.language === lang.code && (
                          <Check className="w-6 h-6 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Privacy Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <p className="font-medium text-gray-800">Download My Data</p>
                        <p className="text-sm text-gray-500">Get a copy of all your data stored in our system</p>
                      </div>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <p className="font-medium text-gray-800">View Privacy Policy</p>
                        <p className="text-sm text-gray-500">Read our privacy policy</p>
                      </div>
                      <Button variant="outline" onClick={() => navigate("/help-support")}>
                        View Policy
                      </Button>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <p className="font-medium text-gray-800">View Terms & Conditions</p>
                        <p className="text-sm text-gray-500">Read our terms of service</p>
                      </div>
                      <Button variant="outline" onClick={() => navigate("/help-support")}>
                        View Terms
                      </Button>
                    </div>

                    <div className="py-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Delete Account</h3>
                        <p className="text-sm text-red-600 mb-4">
                          Once you delete your account, there is no going back. Please be certain.
                          All your data will be permanently removed.
                        </p>
                        <Button 
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete My Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
