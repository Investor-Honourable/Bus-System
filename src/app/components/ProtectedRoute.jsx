import { Navigate, Outlet } from "react-router";

export function ProtectedRoute() {
  const currentUser = localStorage.getItem("busfare_current_user");
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
