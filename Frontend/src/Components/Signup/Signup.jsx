import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { useSelector } from "react-redux";
import "../../Components/Style.css";
import { InputOtp } from "primereact/inputotp";

const Signup = () => {
  const [confirmpass, setconfirmpass] = useState(false);
  const [isEmailSubmitted, setisEmailSubmitted] = useState(false);
  const [isEmailAuthenticated, setisEmailAuthenticated] = useState(false);
  const [isUsernameValid, setisUsernameValid] = useState();
  const [showPassword, setshowPassword] = useState(false);
  const [loading, setloading] = useState(false);
  const [newotp, setnewotp] = useState(false);
  const [profilepic, setprofilepic] = useState(null);
  const [token, setTokens] = useState();
  const [errors, seterrors] = useState({
    email: "",
  });
  const [isOtpValid, setisOtpValid] = useState({
    valid: true,
    reason: "",
  });
  const [formData, setformData] = useState({
    name: "",
    email: "",
    otp: "",
    username: "",
    password: "",
    confirmpass: "",
    profile: null,
  });

  const { isLoggedIn } = useSelector((state) => state.chatdot.user);
  const navigate = useNavigate();
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

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <section className="h-screen w-full flex items-center justify-center bg-[#f8f3ff]">
      <div className=" md:w-[25%] ">
        <div className=" w-full ">
          {isEmailSubmitted ? (
            <div className=" h-full w-full flex items-center justify-between ">
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
                <div
                  className={`w-full p-15 flex flex-col items-center justify-center rounded-xl shadow-xl bg-white ${
                    isEmailAuthenticated ? "mb-0" : "mb-4"
                  }`}
                >
                  <div
                    className={`w-full relative flex flex-col justify-center items-center${
                      isEmailAuthenticated ? "mt-2 mb-0" : "mt-2 mb-5"
                    } `}
                  >
                    <p
                      className={`w-full  font-normal font-[poppins] flex flex-col ${
                        isEmailAuthenticated
                          ? "items-center  md:text-2xl"
                          : "md:text-xl"
                      }`}
                    >
                      {isEmailAuthenticated ? (
                        <span className="">
                          Complete Your{" "}
                          <span className="text-[#68479D] font-semibold">
                            Profile
                          </span>{" "}
                        </span>
                      ) : (
                        <>
                          Please Enter Your{" "}
                          <span className=" font-semibold">
                            Authentication Code
                          </span>
                        </>
                      )}
                    </p>
                    <p
                      className={`w-full text-sm font-normal font-[poppins]  mt-2 text-start break-words `}
                    >
                      {isEmailAuthenticated ? (
                        <p className="w-full text-[14px] font-normal font-[poppins]  break-words">
                          Complete your profile to continue with our services.
                        </p>
                      ) : (
                        <span className="w-full text-[14px] font-normal font-[poppins] mt-2 mb-5  text-start break-words">
                          Code has been sent to your given email id :{" "}
                          <span className="font-bold">{formData.email}</span>
                          {formData.email && (
                            <span
                              className=" cursor-pointer text-[#68479D] font-normal hover:underline"
                              onClick={() => {
                                setisEmailSubmitted(false),
                                  setformData((prev) => ({ ...prev, otp: "" })),
                                  setisOtpValid(true);
                              }}
                            >
                              {". "} change email?
                            </span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                  {isEmailAuthenticated ? (
                    <div
                      className="relative w-[80px] h-[80px] rounded-full ring-1 ring-gray-300 shadow-md cursor-popoppins overflow-hidden my-5 cursor-pointer"
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
                  {isEmailAuthenticated && (
                    <div className="w-full relative flex flex-col items-center justify-center ">
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onKeyUp={UserNameValidation}
                        onChange={(e) => {
                          setformData((prev) => ({
                            ...prev,
                            username: e.target.value.toLocaleLowerCase(),
                          }));
                        }}
                        placeholder={"Enter your username"}
                        className={`peer w-full px-2 py-[5px] lowercase ring-1 pl-10 rounded-md text-[14px] font-[poppins] placeholder:transparent placeholder:text-[14px] placeholder:text-gray-400 focus:outline-none
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
                          <i className="bi bi-person absolute left-[10px] top-[50%] translate-y-[-50%] text-[18px] text-black"></i>

                          {formData.username.length > 0 &&
                            formData.username.length < 3 && (
                              <p className="absolute -bottom-[70%] right-1 text-[12px] font-light font-[poppins] text-red-500">
                                Please enter minimum 3 characters
                              </p>
                            )}

                          {formData.username.length >= 3 &&
                            !isUsernameValid && (
                              <p className="absolute -bottom-[70%] right-1 text-[12px] font-light font-[poppins] text-red-500">
                                Username already taken
                              </p>
                            )}
                        </>
                      ) : (
                        ""
                      )}
                    </div>
                  )}
                  {isEmailAuthenticated ? (
                    <>
                      <div className="w-full relative flex flex-col items-center justify-center mt-6">
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
                          className="peer w-full px-2 pl-10 py-[5px] ring-1 ring-gray-200 rounded-md  text-[13px] font-[poppins] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500 placeholder:text-[13px] placeholder:text-gray-400 "
                        />
                        <i className="bi bi-person-lock absolute left-[10px] top-[50%] translate-y-[-50%] text-[18px] text-black"></i>

                        <i
                          className={`bi ${
                            showPassword ? "bi-eye-slash" : "bi-eye"
                          } absolute top-[50%] translate-y-[-50%]  right-[10px] text-[18px] text-black cursor-popoppins`}
                          onClick={() => setshowPassword(!showPassword)}
                        ></i>
                        <p className="peer  peer-[&:not(:placeholder-shown):invalid]:visible absolute -bottom-[70%] right-1 text-[12px] font-light font-[poppins] invisible text-red-500">
                          Please enter minimum 8 characters
                        </p>
                      </div>
                      <div className="w-full relative flex flex-col items-center justify-center mt-6">
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
                          className="peer w-full px-2 pl-10 py-[5px] ring-1 ring-gray-200 rounded-md  text-[13px] font-[poppins] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500 placeholder:text-[13px] placeholder:text-gray-400 "
                        />
                        <i className="bi bi-person-fill-lock  absolute left-[10px] top-[50%] translate-y-[-50%] text-[18px] text-blac"></i>

                        <i
                          className={`bi ${
                            confirmpass ? "bi-eye-slash" : "bi-eye"
                          } absolute top-0 right-[10px] text-xl text-black cursor-popoppins`}
                          onClick={() => setconfirmpass(!confirmpass)}
                        ></i>
                        <p className="peer  peer-[&:not(:placeholder-shown):invalid]:visible  absolute -bottom-[70%] right-1 text-[12px] font-light font-[poppins] invisible text-red-500">
                          Entered password not same
                        </p>
                      </div>
                      <button className="relative w-full py-1 flex items-center justify-center rounded-md  mt-10 ring-1 ring-[#68479D] focus:outline-0 text-white font-bold font-[poppins] active:bg-[#7c62a5] bg-[#68479D]">
                        {loading ? (
                          <>
                            <p className="text-[14px] font-[poppins]">SUBMIT</p>
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
                          <p className="text-[14px] font-[poppins]">SUBMIT</p>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className=" relative w-full  flex flex-col items-center justify-center ">
                      <div className=" w-full flex items-center justify-center mb-5">
                        <InputOtp
                          value={formData.otp}
                          onChange={(e) => {
                            setformData((prev) => ({
                              ...prev,
                              otp: e.value,
                            }));
                            setisOtpValid(true);
                          }}
                          integerOnly
                          min={4}
                          className="peer [&>.p-inputotp-input]:border-gray-300
                          [&>.p-inputotp-input:focus]:border-[#68479D]
                           [&>.p-inputotp-input:focus]:ring-1
                           [&>.p-inputotp-input:focus]:ring-[#68479D]"
                        />
                        <p className="peer peer-invalid:visible absolute  md:bottom-8  right-1 text-[12px]  font-light font-[poppins] text-sm text-red-500 invisible">
                          Please enter minimum 4 digit
                        </p>
                        {isOtpValid.valid ? (
                          ""
                        ) : (
                          <p className="absolute md:bottom-8  right-1 text-[12px] font-light font-[poppins] text-red-500">
                            {isOtpValid.reason}
                          </p>
                        )}
                      </div>
                      {/* <input
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
                        className={`peer w-full px-2 pl-10 py-[5px] ring-1 ${
                          isOtpValid.valid ? "ring-gray-200" : "ring-red-500"
                        }  rounded-md text-md font-[poppins] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500 placeholder:text-sm placeholder:text-gray-400 `}
                      /> */}
                      {/* <i className="bi bi-key  absolute left-[10px] top-[50%] translate-y-[-50%] text-[18px] text-black"></i> */}

                      <button className=" md:text-[14px] md:w-full h-full  py-1 rounded-md ring-1 ring-[#68479D] focus:outline-0 text-white md:font-bold font-medium font-[poppins] active:bg-[#7c62a5] bg-[#68479D] mt-2">
                        <p className="text-[14px] font-[poppins]">
                          {newotp ? "Get new otp" : " VERIFY OTP"}
                        </p>
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
            <div className="  flex items-center justify-center">
              <form
                className=" w-full flex items-center justify-center "
                onSubmit={(e) => {
                  EmailVerfication(e);
                }}
              >
                <div className="w-full  p-15  flex flex-col items-center justify-center  rounded-xl shadow-xl bg-white mb-4">
                  <div className="flex flex-col items-center justify-center ">
                    <p className=" md:text-2xl text-2xl font-bold font-[poppins]  ">
                      Let's Get Started.
                    </p>
                    <p className=" text-sm font-normal font-[poppins] text-center mt-2 mb-7">
                      Hey, Please enter your credentials to get signup <br /> to
                      your account
                    </p>
                  </div>

                  <div className="w-full relative flex flex-col items-center justify-center">
                    <div className="w-full relative">
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
                        className="peer w-full px-2 pl-10 py-[5px] md:placeholder:text-[13px] placeholder:text-[13px] ring-1 ring-gray-200 rounded-md   text-md font-[poppins] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500   placeholder:text-gray-400 "
                      />
                      <i className="bi bi-person absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black"></i>
                      <p className="absolute -bottom-[80%] right-1 text-[12px] font-light font-[poppins] text-sm  invisible peer-[&:not(:placeholder-shown):invalid]:visible text-red-500 ">
                        Please enter minimum 3 characters
                      </p>
                    </div>
                  </div>
                  <div className="w-full relative flex flex-col items-center justify-center md:mt-4 mt-8 ">
                    <div className="w-full relative">
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
                        className="peer w-full px-2 pl-10 py-[5px] md:placeholder:text-[13px] placeholder:text-[13px] ring-1 ring-gray-200 rounded-md   text-md font-[poppins] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500   placeholder:text-gray-400 "
                      />
                      <i className="bi bi-at absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black"></i>

                      {errors.email && (
                        <p className="absolute -bottom-[80%] right-1 text-[12px] font-light font-[poppins] text-sm   text-red-500">
                          {errors && errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <button className="relative w-full mt-5 py-1 rounded-md  ring-1 ring-[#68479D] focus:outline-0 text-white font-bold font-[poppins] active:bg-[#7c62a5] bg-[#68479D] disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                        <p className="text-[14px] font-[poppins]">SUBMIT</p>
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
                      <p className="text-[14px] font-[poppins]">SUBMIT</p>
                    )}
                  </button>
                  <p className="w-full md:text-sm text-[14px] font-[poppins] md:font-medium mt-5 text-center  ">
                    Have an account?{" "}
                    <Link to="/signin">
                      <span className="text-[#68479D] hover:underline  cursor-popoppins">
                        Login
                      </span>
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Signup;
