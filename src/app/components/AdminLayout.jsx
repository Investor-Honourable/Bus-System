import { Outlet, NavLink, useNavigate } from "react-router";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { 
  LayoutDashboard, 
  Users, 
  Bus, 
  UserCog, 
  Route, 
  Calendar, 
  Ticket, 
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell
} from "lucide-react";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "./ui/use-mobile.js";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet.jsx";
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

export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Get current admin user info
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem("busfare_current_user") || "{}"));
  
  // Real notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(`/api/notifications.php?action=list&user_id=${currentUser.id}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoadingNotifs(false);
    }
  }, [currentUser?.id]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch("/api/notifications.php", {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: "mark_read", notification_id: notificationId, user_id: currentUser.id })
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications.php", {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: "mark_all_read", user_id: currentUser.id })
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Fetch notifications when user changes
  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
      
      // Poll every 30 seconds for real-time updates
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, fetchNotifications]);

  // Listen for notification refresh events from other pages
  useEffect(() => {
    const handleNotificationRefresh = () => {
      fetchNotifications();
    };
    
    window.addEventListener('refresh-notifications', handleNotificationRefresh);
    return () => window.removeEventListener('refresh-notifications', handleNotificationRefresh);
  }, [fetchNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("busfare_current_user");
    localStorage.removeItem("busfare_remember");
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard/admin", icon: LayoutDashboard, label: t('admin.dashboard'), end: true },
    { to: "/dashboard/admin/users", icon: Users, label: t('admin.users'), end: false },
    { to: "/dashboard/admin/buses", icon: Bus, label: t('admin.buses'), end: false },
    { to: "/dashboard/admin/drivers", icon: UserCog, label: t('admin.drivers'), end: false },
    { to: "/dashboard/admin/routes", icon: Route, label: t('admin.routes'), end: false },
    { to: "/dashboard/admin/trips", icon: Calendar, label: t('admin.trips'), end: false },
    { to: "/dashboard/admin/passengers", icon: Users, label: t('admin.passengers') || 'Passengers', end: false },
    { to: "/dashboard/admin/bookings", icon: Ticket, label: t('admin.bookings'), end: false },
    { to: "/dashboard/admin/reports", icon: FileText, label: t('admin.reports'), end: false },
  ];

  // Handle sidebar toggle - use drawer on mobile
  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileDrawerOpen(true);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  // Navigation item click handler
  const handleNavClick = () => {
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex ${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/CamTransit.png" 
              alt="CamTransit Logo" 
              className="w-16 h-16 object-contain flex-shrink-0"
            />
            {isSidebarOpen && (
              <span className="text-lg font-bold whitespace-nowrap">{t('common.appName')} Admin</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-700 space-y-1">
          <button className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}>
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">{t('nav.settings')}</span>}
          </button>
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">{t('common.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sheet */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-slate-900">
          <SheetHeader className="border-b border-slate-700 p-4">
            <SheetTitle className="text-lg font-bold text-white">
              {t('common.appName')} Admin
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="px-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors touch-manipulation min-h-[48px] ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSidebarToggle}
                className="touch-manipulation min-h-[44px] min-w-[44px] md:hidden flex"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSidebarToggle}
                className="touch-manipulation min-h-[44px] min-w-[44px] hidden md:flex"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <span className="text-lg font-semibold text-gray-900 md:hidden">{t('common.appName')}</span>
            </div>

            {/* Search bar */}
            <div className="flex-1 max-w-md mx-2 sm:mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder={t('nav.search')}
                  className="pl-10 bg-gray-50 border-gray-200 text-sm h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-lg relative touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{unreadCount}</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">{t('nav.notifications')}</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {isLoadingNotifs ? (
                      <div className="p-4 text-center text-gray-500">{t('common.loading')}</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No notifications</div>
                    ) : (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <span className="text-xs text-gray-500">{notification.created_at}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t">
                    <Button 
                      variant="ghost" 
                      className="w-full text-sm"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      Mark all as read
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* User dropdown */}
              <div className="border-l border-gray-200 pl-2 sm:pl-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 rounded-lg px-1 py-1 transition-colors touch-manipulation">
                      <div className="w-9 h-9 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {(currentUser.name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden sm:block text-sm text-left">
                        <p className="font-semibold text-gray-900">{currentUser.name || 'Admin'}</p>
                        <p className="text-xs text-gray-500">{currentUser.email || 'admin@camtransit.com'}</p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate("/dashboard/admin")}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <UserCog className="w-4 h-4 mr-2" />
                      View as Passenger
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
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
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
