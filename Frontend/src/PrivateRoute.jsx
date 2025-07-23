import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useSelector((state) => state.chatdot.user);
  return isLoggedIn ? children : <Navigate to="/Signin" />;
};

export default PrivateRoute;
