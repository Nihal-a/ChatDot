import "./App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, Logout } from "./Components/Redux/Slice.jsx";
import Signup from "./Components/Signup/Signup.jsx";
import Signin from "./Components/Signin/Signin.jsx";
import Home from "./Components/Landing-screen/Home.jsx";
import Cookies from "universal-cookie";
import Chat from "./Components/Chat.jsx";
import ChatRoom from "./Components/Chatroom.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import ForgotPass from "./Components/ForgotPass/ForgotPass.jsx";
import Frndrequest from "./Components/Landing-screen/modals/frndrequest.jsx";

function App() {
  const [refreshDone, setRefreshDone] = useState(false);
  const [loading, setloading] = useState(true);
  const dispatch = useDispatch();
  const cookies = new Cookies();
  const navigate = useNavigate();
  // const { isLoggedIn } = useSelector((state) => state.chatdot.user);
  const access = cookies.get("access");

  useEffect(() => {
    const refreshSession = async () => {
      if (refreshDone) return;

      try {
        const verifyRes = await fetch(
          "http://192.168.1.65:8000/api/token/verify/",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ token: access }),
          }
        );

        if (verifyRes.ok) {
          setRefreshDone(true);
          await fetchUserAndLogin(access);
        } else {
          const refreshRes = await fetch(
            "http://192.168.1.65:8000/api/token/refresh-cookie/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            cookies.set("access", data.access);
            setRefreshDone(true);
            await fetchUserAndLogin(data.access);
          } else {
            handleLogout();
          }
        }
        setloading(false);
      } catch (err) {
        console.error("Refresh/Verify failed:", err);
        handleLogout();
      }
    };

    refreshSession();
  }, [refreshDone]);

  const fetchUserAndLogin = async (token) => {
    try {
      const userRes = await fetch(
        "http://192.168.1.65:8000/api/get_userdata",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const userData = await userRes.json();
      if (userRes.ok) {
        const { id, username, name, email, profile } = userData.user;
        dispatch(
          login({
            isLoggedIn: true,
            id,
            username,
            name,
            email,
            profile: `http://192.168.1.65:8000${profile}`,
          })
        );
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error("User fetch failed:", err);
      handleLogout();
    }
  };

  const handleLogout = async () => {
    dispatch(Logout());
    try {
      await fetch("http://192.168.1.65:8000/api/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
        },
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }
    setloading(false);
    cookies.remove("access");
    navigate("/signin");
  };

  if (loading) {
    return <div>Loading session...</div>;
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/forgotpass" element={<ForgotPass />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/test" element={<Frndrequest />} />
        <Route
          path="/chatroom"
          element={
            <PrivateRoute>
              <ChatRoom />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
