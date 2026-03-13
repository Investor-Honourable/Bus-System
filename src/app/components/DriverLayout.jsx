import { Outlet, NavLink, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  Bus, 
  Users, 
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Search,
  Ticket,
  QrCode,
  User,
  Clock,
  AlertCircle
} from "lucide-react";
import { Button } from "./ui/button.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.jsx";
import { useState, useEffect } from "react";

export function DriverLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const user = localStorage.getItem("busfare_current_user");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("busfare_current_user");
    localStorage.removeItem("busfare_token");
    localStorage.removeItem("busfare_remember");
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard/driver", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/dashboard/driver/trips", icon: Bus, label: "My Trips", end: false },
    { to: "/dashboard/driver/passengers", icon: Users, label: "Passengers", end: false },
    { to: "/dashboard/driver/scan", icon: QrCode, label: "Scan Ticket", end: false },
    { to: "/dashboard/driver/notifications", icon: Bell, label: "Notifications", end: false },
    { to: "/dashboard/driver/profile", icon: User, label: "Profile", end: false },
    { to: "/dashboard/driver/settings", icon: Settings, label: "Settings", end: false },
  ];

  // Mobile sidebar content
  const SidebarContent = ({ onItemClick }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <img 
            src="/src/assets/CamTransit.png" 
            alt="CamTransit Logo" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-bold text-gray-900">CamTransit</span>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-orange-100 text-orange-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 sm:p-6 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="lg:hidden absolute top-4 right-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <SidebarContent onItemClick={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Search */}
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
                <Search className="w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search trips..." 
                  className="bg-transparent border-none outline-none text-sm w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/dashboard/driver/notifications")}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
              </Button>

              {/* User menu */}
              <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-700">
                        {currentUser?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {currentUser?.name || "User"}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{currentUser?.name || "User"}</p>
                      <p className="text-xs text-gray-500">{currentUser?.email || ""}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard/driver")}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/driver/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/driver/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
