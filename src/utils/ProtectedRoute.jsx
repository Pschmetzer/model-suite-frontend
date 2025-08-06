import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ allowedRole }) => {
  const { user, token, isAuthenticated, permissions } = useSelector(
    (state) => state.auth,
  );
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  // Add a small delay to ensure Redux state is fully updated
  useEffect(() => {
    console.log("ProtectedRoute state:", {
      user: !!user,
      token: !!token,
      isAuthenticated,
      role: user?.role,
      allowedRole,
      currentPath: location.pathname,
      fullUser: user,
    });
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [user, token, isAuthenticated, allowedRole, location.pathname]);

  // Show loading while waiting for state to stabilize
  if (!isReady) {
    return <div>Loading...</div>;
  }

  // Not logged in → redirect to login
  if (!isAuthenticated || !token || !user) {
    console.log("ProtectedRoute: Not authenticated, redirecting to home");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to correct dashboard
  const isEmployeeAccessingAgency =
    user.role === "employee" && allowedRole === "agency";
  const hasCorrectRole = user.role === allowedRole;

  console.log("ProtectedRoute role check:", {
    userRole: user.role,
    allowedRole,
    hasCorrectRole,
    isEmployeeAccessingAgency,
    shouldAllow: hasCorrectRole || isEmployeeAccessingAgency,
  });

  if (!hasCorrectRole && !isEmployeeAccessingAgency) {
    const redirectMap = {
      agency: "/agency/dashboard",
      model: "/model/dashboard",
      employee: "/agency/employee/dashboard",
    };
    const redirectTo = redirectMap[user.role] || "/";
    console.log(`ProtectedRoute: Wrong role, redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  // ✅ Authorized → render route
  return <Outlet />;
};

export default ProtectedRoute;
