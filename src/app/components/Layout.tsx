import { Outlet, NavLink, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  BookOpen, 
  Compass, 
  Ticket, 
  History,
  Settings,
  HelpCircle,
  Search,
  Plus,
  Bell,
  ChevronDown,
  Bus,
  LogOut
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useState, useEffect } from "react";

export function Layout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("busfare_current_user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("busfare_current_user");
    localStorage.removeItem("busfare_remember");
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home", end: true },
    { to: "/dashboard/discover", icon: Compass, label: "Book Trip", end: false },
    { to: "/dashboard/tickets", icon: Ticket, label: "My Tickets", end: false },
    { to: "/dashboard/bookings", icon: BookOpen, label: "My Bookings", end: false },
    { to: "/dashboard/history", icon: History, label: "Trip History", end: false },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
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
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Upgrade Card */}
        <div className="mx-4 mt-auto mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <div className="relative">
              <Bus className="w-12 h-12 mb-3 opacity-90" />
              <p className="text-sm font-medium mb-1">Visiting new rides</p>
              <p className="text-xs opacity-90 mb-3">Premium</p>
              <Button size="sm" className="w-full bg-white text-blue-600 hover:bg-gray-100">
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="border-t border-gray-200 p-4 space-y-1">
          <button className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg w-full transition-colors">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Help & support</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg w-full transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search or type a command"
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                + 500pr
              </Button>
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
              </button>
              <div className="pl-3 border-l border-gray-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {currentUser?.name.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="text-sm text-left">
                        <p className="font-semibold text-gray-900">{currentUser?.name || "User"}</p>
                        <p className="text-xs text-gray-500">{currentUser?.email || ""}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}