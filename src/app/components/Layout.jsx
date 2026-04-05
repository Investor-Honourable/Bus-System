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
  LogOut,
  Shield,
  Menu
} from "lucide-react";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover.jsx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet.jsx";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "./ui/use-mobile.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

export function Layout() {
  const { t, language, changeLanguage, languages: availableLanguages, currentLanguage } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/notifications.php?action=list&user_id=${currentUser.id}`, {
        headers: { 
          "Content-Type": "application/json" 
        },
      });
      const data = await res.json();
      console.log('Notification API response:', data);
      if (data.status === "success") {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoadingNotifs(false);
    }
  }, [currentUser?.id]);

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "mark_read", notification_id: notificationId, user_id: currentUser.id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "mark_all_read", user_id: currentUser.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("busfare_current_user");
    if (userStr) setCurrentUser(JSON.parse(userStr));

    const handleProfileUpdate = () => {
      const userStr = localStorage.getItem("busfare_current_user");
      if (userStr) setCurrentUser(JSON.parse(userStr));
    };

    const handleNotificationRefresh = () => fetchNotifications();

    window.addEventListener("user-profile-updated", handleProfileUpdate);
    window.addEventListener("refresh-notifications", handleNotificationRefresh);

    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdate);
      window.removeEventListener("refresh-notifications", handleNotificationRefresh);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, fetchNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("busfare_current_user");
    localStorage.removeItem("busfare_remember");
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("nav.home"), end: true },
    { to: "/dashboard/discover", icon: Compass, label: t("nav.discover"), end: false },
    { to: "/dashboard/tickets", icon: Ticket, label: t("nav.tickets"), end: false },
    { to: "/dashboard/bookings", icon: BookOpen, label: t("nav.bookings"), end: false },
    { to: "/dashboard/history", icon: History, label: t("nav.history"), end: false },
    { to: "/dashboard/notifications", icon: Bell, label: t("nav.notifications"), end: false },
  ];

  if (currentUser?.role === "admin") navItems.push({ to: "/dashboard/admin", icon: Shield, label: t("nav.admin"), end: false });
  if (currentUser?.role === "driver") navItems.push({ to: "/dashboard/driver", icon: Bus, label: t("nav.driver"), end: false });

  const SidebarContent = ({ onItemClick }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <img src="/src/assets/CamTransit.png" alt="CamTransit Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold text-gray-900">{t("common.appName")}</span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 sm:py-3 rounded-lg transition-colors ${
                  isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-gray-200 flex-col flex-shrink-0">
        <SidebarContent onItemClick={() => {}} />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <img src="/src/assets/CamTransit.png" alt="CamTransit Logo" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold">{t("common.appName")}</span>
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100%-60px)]">
            <SidebarContent onItemClick={() => setSidebarOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder={t("nav.search")} className="pl-8 bg-gray-50 border-gray-200 w-full" />
            </div>
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b font-semibold">{t("nav.notifications")}</div>
                <div className="max-h-80 overflow-y-auto">
                  {isLoadingNotifs ? (
                    <div className="p-4 text-center text-gray-500">{t("common.loading")}</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">{t("messages.noResults")}</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.is_read ? "bg-blue-50" : ""}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm">{notif.title}</p>
                          <span className="text-xs text-gray-500">{notif.created_at}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t">
                  <Button variant="ghost" className="w-full text-sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                    {t("nav.markAllAsRead")}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Add funds */}
            <Button className="hidden md:flex gap-2 bg-blue-600 hover:bg-blue-700 h-8 text-xs md:text-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">+ 500pr</span>
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="w-4 h-4 mr-2" /> Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/help-support")}>
                  <HelpCircle className="w-4 h-4 mr-2" /> Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}