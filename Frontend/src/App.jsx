import "./App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, Logout } from "./Components/Redux/Slice.jsx";
import Signup from "./Components/Signup/Signup.jsx";
import Signin from "./Components/Signin/Signin.jsx";
import Home from "./Components/Landing-screen/Home.jsx";
import Cookies from "universal-cookie";
import PrivateRoute from "./PrivateRoute.jsx";
import ForgotPass from "./Components/ForgotPass/ForgotPass.jsx";

function App() {
  const [refreshDone, setRefreshDone] = useState(false);
  const [loading, setloading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cookies = new Cookies();
  const access = cookies.get("access");

  const { isLoggedIn } = useSelector((state) => state.chatdot.user);

  const fetchUserAndLogin = async (token) => {
    try {
      const userRes = await fetch(
        "http://192.168.18.144:8000/api/get_userdata",
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
        const { id, username, name, email, profile, about, notfication_count } =
          userData.user;
        dispatch(
          login({
            isLoggedIn: true,
            id,
            username,
            name,
            email,
            about,
            notfication_count,
            profile: profile,
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
    console.log("Logging out user...");
    dispatch(Logout());
    const currentAccess = cookies.get("access");

    try {
      if (currentAccess) {
        await fetch("http://192.168.18.144:8000/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentAccess}`,
          },
          credentials: "include",
        });
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    }

    cookies.remove("access", { path: "/" });
    setloading(false);
    setRefreshDone(true);

    navigate("/signin", { replace: true });
  };

  useEffect(() => {
    const refreshSession = async () => {
      if (!access) {
        setloading(false);
        setRefreshDone(true);
        return;
      }

      if (refreshDone) return;

      try {
        const verifyRes = await fetch(
          "http://192.168.18.144:8000/api/token/verify/",
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
            "http://192.168.18.144:8000/api/token/refresh-cookie/",
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
  }, [refreshDone, access]);

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
      </Routes>
    </>
  );
}

export default App;
