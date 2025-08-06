import { useEffect, useState, useRef } from "react";
import "../../Components/Style.css";
import { Link, useNavigate } from "react-router-dom";
import { FaBullseye, FaUser } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";

const Signup = () => {
  const { isLoggedIn } = useSelector((state) => state.chatdot.user);
  const navigate = useNavigate();
  {
    isLoggedIn ? navigate("/") : navigate("/signin");
  }

  const [isEmailSubmitted, setisEmailSubmitted] = useState(false);
  const [isEmailAuthenticated, setisEmailAuthenticated] = useState(false);
  const [isUsernameValid, setisUsernameValid] = useState();
  const [showPassword, setshowPassword] = useState(false);
  const [loading, setloading] = useState(false);
  const [newotp, setnewotp] = useState(false);
  const [profilepic, setprofilepic] = useState(null);
  const [formData, setformData] = useState({
    name: "",
    email: "",
    otp: "",
    username: "",
    password: "",
    confirmpass: "",
    profile: null,
  });
  const [isOtpValid, setisOtpValid] = useState({
    valid: true,
    reason: "",
  });
  const [confirmpass, setconfirmpass] = useState(false);
  const [errors, seterrors] = useState({
    email: "",
  });
  const fileInputRef = useRef(null);

  const EmailVerfication = async (e) => {
    e.preventDefault();
    const email = formData.email.toLowerCase();
    const isValidEmail = email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    if (!isValidEmail) {
      seterrors((prev) => ({ ...prev, email: "Invalid email format" }));
      return;
    }

    setisOtpValid((prev) => ({ ...prev, valid: true, reason: "" }));
    try {
      setloading(true);
      const res = await fetch(
        "http://192.168.18.144:8000/api/email_verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, email }),
        }
      );

      const data = await res.json();

      if (res.status === 200) {
        setisEmailSubmitted(true);
        seterrors((prev) => ({ ...prev, email: "" }));
        console.log("Email verification code sent successfully");
      } else if (res.status === 400) {
        seterrors((prev) => ({ ...prev, email: data.detail }));
      } else {
        console.log("Unhandled response at email verification");
      }
    } catch (err) {
      console.log("Server Error at email verification");
    } finally {
      setloading(false);
      setnewotp(false);
    }
  };

  const otpVerification = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "http://192.168.18.144:8000/api/otp_verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (res.status == 200) {
        setisEmailAuthenticated(true);
        setisOtpValid((prev) => ({
          ...prev,
          valid: true,
        }));

        console.log(data.detail);
      } else if (res.status == 401) {
        setnewotp(true);
        setisOtpValid((prev) => ({
          ...prev,
          valid: false,
          reason: data.detail,
        }));
      } else {
        setisOtpValid((prev) => ({
          ...prev,
          valid: false,
          reason: data.detail,
        }));
        console.log(data.detail);
      }
    } catch (err) {
      console.log("Server Error at otp verification");
    }
  };

  const UserNameValidation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "http://192.168.18.144:8000/api/username_validation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (res.status == 200) {
        setisUsernameValid(true);
      } else {
        setisUsernameValid(false);
      }
    } catch (err) {
      console.log("Server Error at validating user name");
    }
  };

  const Register = async (e) => {
    e.preventDefault();

    if (formData.password != formData.confirmpass) {
      alert("password not same");
      return;
    } else if (!isUsernameValid) {
      alert(" entered username already exists");
      return;
    } else if (formData.username.length < 3) {
      alert(" entered username short");
      return;
    } else {
      setloading(true);
      try {
        console.log(formData.profile);
        const payload = new FormData();
        payload.append("profile", formData.profile);
        payload.append("name", formData.name);
        payload.append("username", formData.username);
        payload.append("email", formData.email);
        payload.append("password", formData.password);
        const res = await fetch("http://192.168.18.144:8000/api/register", {
          method: "POST",

          body: payload,
        });

        if (res.status == 200) {
          setloading(false);
          navigate("/signin");
        } else {
          setloading(false);
          console.log("Error at user registration");
        }
      } catch (err) {
        console.log("Server Error at user registration");
      }
    }
  };

  const handleFileChange = (e) => {
    setprofilepic(true);
    const file = e.target.files[0];
    if (file) {
      setprofilepic(URL.createObjectURL(file));
      setformData((prev) => ({
        ...prev,
        profile: file,
      }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <section className="h-screen w-full flex items-center justify-center">
      <div className="modal w-[65%] h-[72%] ">
        <div className="h-full w-full grid grid-cols-3 ">
          {isEmailSubmitted ? (
            <div className="h-full w-full col-span-2 flex items-center justify-center">
              <form
                className="h-full w-full flex items-center justify-center"
                onSubmit={
                  isEmailAuthenticated
                    ? (e) => Register(e)
                    : (e) => {
                        newotp ? EmailVerfication(e) : otpVerification(e);
                      }
                }
              >
                <div className="w-full h-full flex flex-col items-center justify-center border-2 rounded-l-xl border-amber-200">
                  <div className="w-full flex flex-col justify-center items-center">
                    <p className="relative text-3xl font-medium font-[poppins]">
                      {isEmailAuthenticated ? (
                        ""
                      ) : (
                        <i
                          className=" bi bi-arrow-left-square absolute bottom-[230%] -left-[0%] text-3xl"
                          onClick={() => {
                            setisEmailSubmitted(false),
                              setformData((prev) => ({ ...prev, otp: "" })),
                              setisOtpValid(true);
                          }}
                        ></i>
                      )}
                      {isEmailAuthenticated
                        ? "Claim your username and create password"
                        : "Please enter your authenticate code"}
                    </p>
                    <p className=" text-sm   font-light font-[poppins] pe-[36%]">
                      {isEmailAuthenticated
                        ? ""
                        : "code has been send to your given email id"}
                    </p>
                  </div>
                  {isEmailAuthenticated ? (
                    <div
                      className="relative w-[80px] h-[80px] rounded-full ring-1 ring-gray-300 shadow-md cursor-pointer overflow-hidden mt-4"
                      onClick={triggerFileInput}
                    >
                      {profilepic ? (
                        <img
                          src={profilepic}
                          alt="Profile"
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <FaUser className="text-2xl text-gray-500" />
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    ""
                  )}

                  <div className="w-full relative flex flex-col items-center justify-center mt-7">
                    <input
                      type="text"
                      required
                      value={
                        isEmailAuthenticated
                          ? formData.username
                          : formData.email
                      }
                      onKeyUp={isEmailAuthenticated ? UserNameValidation : ""}
                      onChange={
                        isEmailAuthenticated
                          ? (e) => {
                              setformData((prev) => ({
                                ...prev,
                                username: e.target.value.toLocaleLowerCase(),
                              }));
                            }
                          : ""
                      }
                      placeholder={
                        isEmailAuthenticated
                          ? "Enter your username"
                          : "given email"
                      }
                      disabled={!isEmailAuthenticated}
                      className={`peer w-[70%] px-2 pl-10 py-[4px] lowercase ring-1 rounded-md shadow-md text-md font-[inter] placeholder:transparent placeholder:text-sm placeholder:text-gray-400 focus:outline-none
                        ${
                          isEmailAuthenticated
                            ? formData.username.length >= 3
                              ? isUsernameValid
                                ? "ring-green-500"
                                : "ring-red-500"
                              : "ring-red-500"
                            : "ring-gray-200 focus:valid:ring-[#68479D] focus:invalid:ring-red-500"
                        }
                      `}
                    />
                    {isEmailAuthenticated ? (
                      <>
                        <label htmlFor="otp">
                          <i className="bi bi-person absolute top-[3%] left-[16%] text-2xl text-black"></i>
                        </label>
                        {formData.username.length > 0 &&
                          formData.username.length < 3 && (
                            <p className="absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] text-red-500">
                              Please enter minimum 3 characters
                            </p>
                          )}

                        {formData.username.length >= 3 && !isUsernameValid && (
                          <p className="absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] text-red-500">
                            Username already taken
                          </p>
                        )}
                      </>
                    ) : (
                      ""
                    )}
                  </div>
                  {isEmailAuthenticated ? (
                    <>
                      <div className="w-full relative flex flex-col items-center justify-center mt-10">
                        <input
                          value={formData.password}
                          required
                          onChange={(e) =>
                            setformData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          type={showPassword ? "text" : "password"}
                          minLength={8}
                          placeholder="Enter your password"
                          className="peer w-[70%] px-2 pl-10 py-[4px] ring-1 ring-gray-200 rounded-md shadow-md  text-md font-[inter] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500 placeholder:text-sm placeholder:text-gray-400 "
                        />
                        <label htmlFor="password">
                          <i className="bi bi-person-lock absolute top-[3%] left-[16%] text-xl text-black"></i>
                        </label>
                        <i
                          className={`bi ${
                            showPassword ? "bi-eye-slash" : "bi-eye"
                          } absolute top-0 right-[16%] text-xl text-black cursor-pointer`}
                          onClick={() => setshowPassword(!showPassword)}
                        ></i>
                        <p className="peer  peer-[&:not(:placeholder-shown):invalid]:visible absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] invisible text-red-500">
                          Please enter minimum 8 characters
                        </p>
                      </div>
                      <div className="w-full relative flex flex-col items-center justify-center mt-8">
                        <input
                          type={confirmpass ? "text" : "password"}
                          minLength={8}
                          required
                          value={formData.confirmpass}
                          onChange={(e) =>
                            setformData((prev) => ({
                              ...prev,
                              confirmpass: e.target.value,
                            }))
                          }
                          placeholder="Confirm your password"
                          className="peer w-[70%] px-2 pl-10 py-[4px] ring-1 ring-gray-200 rounded-md shadow-md   text-md font-[inter] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500 placeholder:text-sm placeholder:text-gray-400 "
                        />
                        <label htmlFor="password">
                          <i className="bi bi-person-fill-lock absolute top-[3%] left-[16%] text-xl text-black"></i>
                        </label>
                        <i
                          className={`bi ${
                            confirmpass ? "bi-eye-slash" : "bi-eye"
                          } absolute top-0 right-[16%] text-xl text-black cursor-pointer`}
                          onClick={() => setconfirmpass(!confirmpass)}
                        ></i>
                        <p className="peer  peer-[&:not(:placeholder-shown):invalid]:visible  absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] invisible text-red-500">
                          Entered password not same
                        </p>
                      </div>
                      <button className="relative w-[40%] py-1 flex items-center justify-center rounded-md  mt-10 ring-1 ring-[#68479D] focus:outline-0 text-white font-bold font-[inter] active:bg-[#7c62a5] bg-[#68479D]">
                        {loading ? (
                          <>
                            SUBMIT
                            <svg
                              aria-hidden="true"
                              className="absolute right-[30%] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-300 fill-white "
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
                          "SUBMIT"
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="w-full relative flex flex-col items-center justify-center mt-10">
                      <input
                        type="text"
                        value={formData.otp}
                        onChange={(e) => {
                          setformData((prev) => ({
                            ...prev,
                            otp: e.target.value,
                          }));
                          setisOtpValid(true);
                        }}
                        minLength={4}
                        placeholder="Enter your otp here"
                        className={`peer w-[70%] px-2 pl-10 py-[5px] ring-1 ${
                          isOtpValid.valid ? "ring-gray-200" : "ring-red-500"
                        }  rounded-md shadow-md  text-md font-[inter] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500 placeholder:text-sm placeholder:text-gray-400 `}
                      />
                      {isOtpValid.valid ? (
                        ""
                      ) : (
                        <p className="absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] text-red-500">
                          {isOtpValid.reason}
                        </p>
                      )}
                      <label htmlFor="otp">
                        <i className="bi bi-key absolute top-[3%] left-[16%] text-2xl text-black"></i>
                      </label>
                      <p className="peer peer-invalid:visible absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] invisible text-red-500">
                        Please enter minimum 4 digit
                      </p>
                      <button className="absolute w-[30%] bottom-[3%] right-[15%] py-1 rounded-md  mt-10 ring-1 ring-[#68479D] focus:outline-0 text-white font-bold font-[inter] active:bg-[#7c62a5] bg-[#68479D]">
                        {newotp ? "Get new otp" : " VERIFY OTP"}
                        {loading ? (
                          <>
                            <svg
                              aria-hidden="true"
                              className="absolute right-[16%] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-300 fill-white "
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
                          ""
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full w-full col-span-2 flex items-center justify-center">
              <form
                className="h-full w-full flex items-center justify-center"
                onSubmit={(e) => {
                  EmailVerfication(e);
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center rounded-l-xl border-2  border-amber-200">
                  <p className="relative text-4xl font-bold font-[poppins] mb-4.5">
                    Let’s Get Started.
                  </p>

                  <div className="w-full relative flex flex-col items-center justify-center mt-10">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setformData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      minLength={3}
                      required
                      placeholder="Enter your name"
                      className="peer w-[70%] px-2 pl-10 py-[4px] ring-1 ring-gray-200 rounded-md shadow-md   text-md font-[inter] placeholder:transparent  focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500  placeholder:text-sm placeholder:text-gray-400 "
                    />
                    <label htmlFor="name">
                      <i className="bi bi-person absolute top-[3%] left-[16%] text-2xl text-black"></i>
                    </label>
                    <p className="absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] invisible peer-[&:not(:placeholder-shown):invalid]:visible text-red-500 text-sm ">
                      Please enter minimum 3 characters
                    </p>
                  </div>
                  <div className="w-full relative flex flex-col items-center justify-center mt-10">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        seterrors((prev) => ({ ...prev, email: "" })),
                          setformData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }));
                      }}
                      placeholder="Enter your email"
                      className="peer w-[70%] px-2 pl-10 py-[4px] ring-1 ring-gray-200 rounded-md shadow-md   text-md font-[inter] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500 placeholder:text-sm placeholder:text-gray-400 "
                    />
                    <label htmlFor="email">
                      <i className="bi bi-at absolute top-[3%] left-[16%] text-2xl text-black"></i>
                    </label>
                    {errors.email && (
                      <p className="absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] text-sm text-red-500 ">
                        {errors && errors.email}
                      </p>
                    )}
                    {/* <p className="absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] invisible peer-[&:not(:placeholder-shown):invalid]:visible text-red-500 text-sm ">
                      Please enter valid email id
                    </p> */}
                  </div>
                  <button className=" relative w-[40%] py-1 flex items-center justify-center rounded-md  mt-10 ring-1 ring-[#68479D] focus:outline-0 text-white font-bold font-[inter] active:bg-[#7c62a5] bg-[#68479D]">
                    {loading ? (
                      <>
                        SUBMIT
                        <svg
                          aria-hidden="true"
                          className="absolute right-[30%] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-300 fill-white "
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
                      "SUBMIT"
                    )}
                  </button>
                  <p className="w-full text-sm font-[poppins] font-medium pt-10 text-end pr-10 ">
                    Have an account?{" "}
                    <Link to="/signin">
                      <span className="text-[#68479D] hover:underline  cursor-pointer">
                        Login
                      </span>
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          )}

          <div
            className="w-full h-full flex flex-col items-center justify-center border-2 bg-amber-200
           rounded-r-xl  border-amber-200"
          >
            <p>Color fill</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
