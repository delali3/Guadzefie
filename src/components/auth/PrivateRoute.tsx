import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
  allowedRoles?: ('consumer' | 'farm' | 'admin')[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles = [] }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check for user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check if allowedRoles is provided
  if (allowedRoles.length > 0) {
    const userRole = user.is_farm ? 'farm' : user.user_metadata?.role === 'admin' ? 'admin' : 'consumer';
    if (!allowedRoles.includes(userRole)) {
      // Redirect to the appropriate dashboard based on role
      return <Navigate to={user.is_farm ? '/farm/dashboard' : user.user_metadata?.role === 'admin' ? '/admin' : '/consumer/dashboard'} replace />;
    }
  }

  // If logged in and role check passes (if any), render the protected content
  return <Outlet />;
};

export default PrivateRoute;