import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout.jsx";
import { AdminLayout } from "./components/AdminLayout.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { Login } from "./pages/Login.jsx";
import { SignUp } from "./pages/SignUp.jsx";
import { ForgotPassword } from "./pages/ForgotPassword.jsx";
import { HelpSupport } from "./pages/HelpSupport.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Bookings } from "./pages/passengers/Bookings.jsx";
import { Settings } from "./pages/passengers/Settings.jsx";
import { Discover } from "./pages/Discover.jsx";
import { Tickets } from "./pages/passengers/Tickets.jsx";
import { History } from "./pages/passengers/History.jsx";
import { AdminDashboard } from "./pages/admin/Dashboard.jsx";
import { Users } from "./pages/admin/Users.jsx";
import { Buses } from "./pages/admin/Buses.jsx";
import { Drivers } from "./pages/admin/Drivers.jsx";
import { Routes } from "./pages/admin/Routes.jsx";
import { Trips } from "./pages/admin/Trips.jsx";
import { Bookings as AdminBookings } from "./pages/admin/Bookings.jsx";
import { Reports } from "./pages/admin/Reports.jsx";
import DriverDashboard from "./pages/drivers/Dashboard.jsx";
import DriverTrips from "./pages/drivers/Trips.jsx";
import DriverTripDetails from "./pages/drivers/TripDetails.jsx";
import DriverPassengers from "./pages/drivers/Passengers.jsx";
import DriverScanTicket from "./pages/drivers/ScanTicket.jsx";
import DriverProfile from "./pages/drivers/Profile.jsx";
import DriverNotifications from "./pages/drivers/Notifications.jsx";
import DriverSettings from "./pages/drivers/Settings.jsx";
import { DriverLayout } from "./components/DriverLayout.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/help-support",
    element: <HelpSupport />,
  },
  {
    path: "/tickets",
    element: <ProtectedRoute />,
    children: [
      {
        path: "",
        element: <Layout />,
        children: [
          { index: true, element: <Tickets /> },
        ],
      },
    ],
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "bookings", element: <Bookings /> },
          { path: "settings", element: <Settings /> },
          { path: "discover", element: <Discover /> },
          { path: "tickets", element: <Tickets /> },
          { path: "history", element: <History /> },
        ],
      },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "users", element: <Users /> },
          { path: "buses", element: <Buses /> },
          { path: "drivers", element: <Drivers /> },
          { path: "routes", element: <Routes /> },
          { path: "trips", element: <Trips /> },
          { path: "bookings", element: <AdminBookings /> },
          { path: "reports", element: <Reports /> },
        ],
      },
      {
        path: "driver",
        element: <DriverLayout />,
        children: [
          { index: true, element: <DriverDashboard /> },
          { path: "trips", element: <DriverTrips /> },
          { path: "trips/:id", element: <DriverTripDetails /> },
          { path: "passengers", element: <DriverPassengers /> },
          { path: "scan", element: <DriverScanTicket /> },
          { path: "notifications", element: <DriverNotifications /> },
          { path: "profile", element: <DriverProfile /> },
          { path: "settings", element: <DriverSettings /> },
        ],
      },
    ],
  },
]);
