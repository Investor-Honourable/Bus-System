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
  Menu,
  X,
  Globe
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
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch("/api/notifications.php?action=list", {
        headers: { 'User-ID': currentUser.id }
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
      await fetch("/api/notifications.php?action=mark_read", {
        method: 'PUT',
        headers: { 
          'User-ID': currentUser.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: notificationId })
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
      await fetch("/api/notifications.php?action=mark_all_read", {
        method: 'PUT',
        headers: { 
          'User-ID': currentUser.id,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("busfare_current_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
    
    // Listen for profile updates from Settings page
    const handleProfileUpdate = () => {
      const userStr = localStorage.getItem("busfare_current_user");
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    };
    
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, []);

  // Fetch notifications when user changes
  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
      
      // Poll every 30 seconds for real-time updates
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
    { to: "/dashboard", icon: LayoutDashboard, label: t('nav.home'), end: true },
    { to: "/dashboard/discover", icon: Compass, label: t('nav.discover'), end: false },
    { to: "/dashboard/tickets", icon: Ticket, label: t('nav.tickets'), end: false },
    { to: "/dashboard/bookings", icon: BookOpen, label: t('nav.bookings'), end: false },
    { to: "/dashboard/history", icon: History, label: t('nav.history'), end: false },
  ];

  // Add admin link if user is admin
  if (currentUser?.role === "admin") {
    navItems.push({ to: "/dashboard/admin", icon: Shield, label: "Admin", end: false });
  }

  // Add driver link if user is driver
  if (currentUser?.role === "driver") {
    navItems.push({ to: "/dashboard/driver", icon: Bus, label: "Driver", end: false });
  }

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
          <span className="text-xl font-bold text-gray-900">{t('common.appName')}</span>
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

      {/* Upgrade Card - hidden on mobile */}
      <div className="hidden sm:block mx-4 mt-auto mb-6">
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
      <div className="border-t border-gray-200 p-3 sm:p-4 space-y-1 mt-auto">
        <button 
          onClick={() => { navigate("/help-support"); onItemClick(); }}
          className="flex items-center gap-3 px-4 py-2 sm:py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg w-full transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Help & support</span>
        </button>
        <button 
          onClick={() => { navigate("/dashboard/settings"); onItemClick(); }}
          className="flex items-center gap-3 px-4 py-2 sm:py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg w-full transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <SidebarContent onItemClick={() => {}} />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <img 
                src="/src/assets/CamTransit.png" 
                alt="CamTransit Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold">{t('common.appName')}</span>
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100%-60px)]">
            <SidebarContent onItemClick={() => setSidebarOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Mobile menu button */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Search bar - visible on all screens */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl mx-2 sm:mx-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder={t('nav.search')}
                  className="pl-10 bg-gray-50 border-gray-200 text-sm h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              {/* Add funds button - hidden on mobile */}
              <Button className="hidden sm:flex gap-2 bg-blue-600 hover:bg-blue-700 h-10">
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">+ 500pr</span>
              </Button>
              
              {/* Mobile add button */}
              <button className="sm:hidden p-2 bg-blue-600 text-white rounded-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </button>

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
                      <div className="p-4 text-center text-gray-500">{t('messages.noResults')}</div>
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

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <span className="text-lg">{currentLanguage.flag}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                    {t('settings.languagePreference')}
                  </div>
                  <DropdownMenuSeparator />
                  {availableLanguages.map((lang) => (
                    <DropdownMenuItem 
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`flex items-center gap-2 ${language === lang.code ? 'bg-blue-50' : ''}`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                      {language === lang.code && (
                        <span className="ml-auto text-blue-600">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* User dropdown */}
              <div className="border-l border-gray-200 pl-2 sm:pl-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 rounded-lg px-1 py-1 transition-colors touch-manipulation">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="hidden sm:block text-sm text-left">
                        <p className="font-semibold text-gray-900">{currentUser?.name || "User"}</p>
                        <p className="text-xs text-gray-500">{currentUser?.email || ""}</p>
                      </div>
                      <ChevronDown className="hidden sm:block w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/help-support")}>
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
