import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useSelector((state) => state.chatdot.user);
  const location = useLocation();

  if (!isLoggedIn) {
    // Redirect to signin with the current location
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;