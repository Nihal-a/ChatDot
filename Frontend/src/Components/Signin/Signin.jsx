import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { login } from "../Redux/Slice";
import Cookies from "universal-cookie";
import "../../Components/Style.css";

const Signin = () => {
  const [showPassword, setshowPassword] = useState(false);
  const [errors, seterrors] = useState("");
  const [loading, setloading] = useState(false);
  const [formData, setformData] = useState({
    username: "",
    password: "",
  });

  const { isLoggedIn } = useSelector((state) => state.chatdot.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cookie = new Cookies();

  const Login = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      seterrors("Password must be at least 8 characters long");
      return;
    }

    try {
      setloading(true);
      seterrors("");

      const res = await fetch("http://192.168.18.144:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log(data.user);
      if (res.status === 200) {
        cookie.set("access", data.access, { path: "/" });
        dispatch(
          login({
            isLoggedIn: true,
            id: data.user.id,
            username: data.user.username,
            name: data.user.name,
            email: data.user.email,
            profile: data.user.profile,
            about: data.user.about,
            notification_count: data.user.notfication_count,
          })
        );
      } else if (res.status === 400 || res.status === 401) {
        seterrors(
          data.detail || "Login failed. Please check your credentials."
        );
        console.log("Error at login");
      }
    } catch (err) {
      console.log("Server Error at login:", err);
      seterrors("Server error. Please try again later.");
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <section className=" h-screen  flex items-center justify-center bg-[#f8f3ff]">
      <div className=" md:w-[25%] md:h-[60%]  ">
        <div className="h-full w-full">
          <div className="h-full w-full flex items-center justify-between ">
            <div className="w-full  p-15  flex flex-col items-center justify-center  rounded-xl shadow-xl bg-white mb-4">
              <div className="flex flex-col items-center justify-center ">
                <p className=" md:text-2xl text-2xl font-bold font-[poppins]  ">
                  Welcome Back!
                </p>
                <p className=" text-sm font-normal font-[poppins] text-center mt-2 mb-7">
                  Hey, Please enter your credentials to get signin <br /> to
                  your account
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  if (!loading) Login(e);
                }}
                className="flex flex-col w-full items-center justify-center"
              >
                <div className="w-full relative flex flex-col items-center justify-center ">
                  <div className="w-full relative">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setformData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      placeholder="Enter your username or email"
                      className="md:placeholder:text-[13px] placeholder:text-[13px] w-full px-2  pl-10 py-[5px] ring-1 ring-gray-200 rounded-md text-[14px] font-[poppins] placeholder:transparent  focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500   placeholder:text-gray-400 "
                      disabled={loading}
                    />
                    <i className="bi bi-person absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black"></i>
                  </div>
                </div>
                <div className="w-full relative flex flex-col items-center justify-center md:mt-4 mt-8">
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        seterrors("");
                        setformData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }));
                      }}
                      minLength={8}
                      placeholder="Enter your password"
                      className="peer w-full px-2 pl-10 py-[5px] md:placeholder:text-[13px] placeholder:text-[13px] ring-1 ring-gray-200 rounded-md   text-md font-[poppins] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500   placeholder:text-gray-400 "
                      disabled={loading}
                    />
                    <i className="bi bi-person-lock absolute left-[10px] top-[50%] translate-y-[-50%] text-[18px] text-black"></i>
                    <i
                      className={`bi ${
                        showPassword ? "bi-eye-slash" : "bi-eye"
                      } absolute top-[50%] translate-y-[-50%] right-[10px]  text-[18px] text-black cursor-pointer`}
                      onClick={() => setshowPassword(!showPassword)}
                    ></i>
                  </div>

                  {errors && (
                    <p className="absolute -bottom-[80%] right-1 text-[12px] font-light font-[poppins] text-sm text-red-500 ">
                      {errors}
                    </p>
                  )}
                  <p className="peer peer-invalid:visible absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[poppins] invisible text-red-500">
                    Please enter minimum 8 character
                  </p>
                </div>
                <Link to="/forgotpass" className="w-full text-left">
                  <p className="text-[14px] font-[poppins] font-medium my-4 text-[#68479D] hover:underline cursor-pointer ">
                    Forgot Password?
                  </p>
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-1 rounded-md mt- ring-1 ring-[#68479D] focus:outline-0 text-white font-bold font-[poppins] active:bg-[#7c62a5] bg-[#68479D] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <p className="text-[14px] font-[poppins]">LOGIN</p>
                      <svg
                        aria-hidden="true"
                        className="absolute right-[32%] bottom-[1%] -translate-y-1/2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-300 fill-white "
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"
                        />
                      </svg>
                    </>
                  ) : (
                    <p className="text-[14px] font-[poppins]">LOGIN</p>
                  )}
                </button>
              </form>
              <p className="w-full md:text-sm text-[14px] font-[poppins] md:font-medium mt-5 text-center ">
                Don't have an account?{" "}
                <Link to="/signup">
                  <span className="text-[#68479D] hover:underline cursor-pointer ">
                    Register
                  </span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signin;
