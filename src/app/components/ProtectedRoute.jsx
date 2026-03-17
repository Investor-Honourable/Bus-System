import { Navigate, Outlet } from "react-router";

export function ProtectedRoute({ allowedRoles = [] }) {
  const currentUserStr = localStorage.getItem("busfare_current_user");
  
  if (!currentUserStr) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const currentUser = JSON.parse(currentUserStr);
    
    // If no role specified, just check if logged in
    if (allowedRoles.length === 0) {
      return <Outlet />;
    }
    
    // Check if user's role is in allowed roles
    const userRole = currentUser.role?.toLowerCase() || "";
    const allowed = allowedRoles.map(r => r.toLowerCase());
    
    if (!allowed.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      switch (userRole) {
        case "admin":
        case "super_admin":
          return <Navigate to="/dashboard/admin" replace />;
        case "driver":
          return <Navigate to="/dashboard/driver" replace />;
        case "passenger":
        default:
          return <Navigate to="/dashboard" replace />;
      }
    }
    
    return <Outlet />;
  } catch (e) {
    console.error("Error parsing user:", e);
    return <Navigate to="/login" replace />;
  }
}
