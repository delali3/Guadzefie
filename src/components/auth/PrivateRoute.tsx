import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
  allowedRoles?: ('consumer' | 'farm' | 'admin')[];
}

// Helper function to get the current user from localStorage
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    console.log("PrivateRoute - checking localStorage for user:", !!userStr);
    
    if (!userStr) {
      return null;
    }
    
    const user = JSON.parse(userStr);
    console.log("PrivateRoute - user found:", {
      id: user.id,
      email: user.email,
      is_farm: user.is_farm,
      is_admin: user.is_admin
    });
    
    return user;
  } catch (error) {
    console.error("PrivateRoute - error getting user from localStorage:", error);
    return null;
  }
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles = [] }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Get user from localStorage
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    console.log("PrivateRoute - redirecting to login, no user found");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Get user role from user data
  const getUserRole = () => {
    // Check for user.is_admin (new field)
    if (user.is_admin === true) {
      return 'admin';
    }
    
    // Check for user.is_farm
    if (user.is_farm === true) {
      return 'farm';
    }
    
    // Default to consumer role
    return 'consumer';
  };

  // Role check if allowedRoles is provided
  if (allowedRoles.length > 0) {
    const userRole = getUserRole();
    console.log("PrivateRoute - checking role:", { 
      userRole, 
      allowedRoles, 
      hasAccess: allowedRoles.includes(userRole) 
    });
    
    if (!allowedRoles.includes(userRole)) {
      // Redirect to the appropriate dashboard based on role
      let redirectPath = '/consumer/dashboard';
      if (userRole === 'admin') {
        redirectPath = '/admin';
      } else if (userRole === 'farm') {
        redirectPath = '/farm/dashboard';
      }
      
      console.log("PrivateRoute - redirecting to role-specific dashboard:", redirectPath);
      return <Navigate to={redirectPath} replace />;
    }
  }

  // If logged in and role check passes (if any), render the protected content
  console.log("PrivateRoute - access granted");
  return <Outlet />;
};

export default PrivateRoute;