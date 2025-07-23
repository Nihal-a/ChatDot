import React, { useEffect, useState } from "react";
import "../../Components/Style.css";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../Redux/Slice";
import { useSelector, useDispatch } from "react-redux";
import Cookies from "universal-cookie";

const Signin = () => {
  const [showPassword, setshowPassword] = useState(false);
  const [errors, seterrors] = useState();
  const [loading, setloading] = useState(false);
  const [formData, setformData] = useState({
    username: "",
    password: "",
  });
  const cookie = new Cookies();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const Login = async (e) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      return;
    }
    try {
      setloading(true);
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",

        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.status == 200) {
        cookie.set("access", data.access);
        dispatch(
          login({
            isLoggedIn: true,
            id: data.user.id,
            username: data.user.username,
            name: data.user.name,
            email: data.user.email,
            profile: `http:/127.0.0.1:8000${data.user.profile}`,
          })
        );
        navigate("/");
        dispatch(login());
      } else if (res.status == 400 || res.status == 401) {
        seterrors(data.detail);
        console.log("Error at login ");
      }
    } catch (err) {
      console.log("Server Error at login");
    } finally {
      setloading(false);
    }
  };

  return (
    <section className="container h-screen w-full flex items-center justify-center">
      <div className=" w-[65%] h-[72%] ">
        <div className="h-full w-full grid grid-cols-3 ">
          <div
            className="w-full h-full flex flex-col items-center justify-center border-2 bg-amber-200
           rounded-l-xl  border-amber-200"
          >
            <p>Color fill</p>
          </div>
          <div className="h-full w-full col-span-2 flex items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center border-2 rounded-r-xl border-amber-200">
              <p className=" text-4xl font-bold font-[poppins]">
                Welcome back!
              </p>
              <p className=" text-sm font-light font-[poppins]">
                Please enter your credentials to continue
              </p>
              <form
                onSubmit={(e) => Login(e)}
                className="flex flex-col w-full items-center justify-center"
              >
                <div className="w-full relative flex flex-col items-center justify-center mt-10">
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
                    className=" w-[70%] px-2 pl-10 py-[4px] ring-1 ring-gray-200 rounded-md shadow-md  text-md font-[inter] placeholder:transparent  focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500  placeholder:text-sm placeholder:text-gray-400 "
                  />
                  <label htmlFor="username">
                    <i className="bi bi-person absolute top-[3%] left-[16%] text-2xl text-black"></i>
                  </label>
                </div>
                <div className="w-full relative flex flex-col items-center justify-center mt-10">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      seterrors(""),
                        setformData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }));
                    }}
                    minLength={8}
                    placeholder="Enter your password"
                    className="peer w-[70%] px-2 pl-10 py-[4px] ring-1 ring-gray-200 rounded-md shadow-md   text-md font-[inter] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500 placeholder:text-sm placeholder:text-gray-400 "
                  />
                  <label htmlFor="password">
                    <i className="bi bi-person-lock absolute top-0 left-[16%] text-2xl text-black"></i>
                  </label>
                  <label htmlFor="password">
                    <i
                      className={`bi ${
                        showPassword ? "bi-eye-slash" : "bi-eye"
                      } absolute top-0 right-[16%] text-xl text-black cursor-pointer`}
                      onClick={() => setshowPassword(!showPassword)}
                    ></i>
                  </label>
                  {errors && (
                    <p className="absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] text-sm text-red-500 ">
                      {errors}
                    </p>
                  )}
                  <p className="peer peer-invalid:visible absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] invisible text-red-500">
                    Please enter minimum 8 charcter
                  </p>
                </div>
                <button className="relative  w-[40%] py-1 rounded-md   mt-10 ring-1 ring-[#68479D] focus:outline-0 text-white font-bold font-[inter] active:bg-[#7c62a5] bg-[#68479D]">
                  {loading ? (
                    <>
                      LOGIN
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
                    "LOG IN"
                  )}
                </button>
              </form>
              <p className="w-full text-sm font-[poppins] font-medium pt-10 text-end pr-10 ">
                Don’t have an account?
                <Link to="/signup">
                  {" "}
                  <span className="text-[#68479D] hover:underline cursor-pointer ">
                    Register
                  </span>
                </Link>{" "}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signin;
