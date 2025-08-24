import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../Components/Style.css";
import { InputOtp } from "primereact/inputotp";

const ForgotPass = () => {
  const [errors, seterrors] = useState();
  const [inputShow, setinputShow] = useState(false);
  const [isOtpSend, setisOtpSend] = useState(null);
  const [isUserverified, setisUserverified] = useState(false);
  const [showPassword, setshowPassword] = useState(false);
  const [confirmpass, setconfirmpass] = useState(false);
  const [formData, setformData] = useState({
    username: "",
    otp: "",
    password: "",
    confirmpass: "",
    email: "",
    operation: "passwordreset",
  });
  const [loading, setloading] = useState({
    otpsend: false,
    otpverfication: false,
    changepass: false,
  });
  const navigate = useNavigate();
  console.log(isOtpSend);
  console.log(loading);
  console.log(isUserverified);
  const handleGetOtp = async (e) => {
    e.preventDefault();

    if (formData.username.length < 3) {
      seterrors("Invalid ");
      return;
    }

    try {
      setisOtpSend(null);
      setloading((prev) => ({ ...prev, otpsend: true }));
      const res = await fetch(
        "http://192.168.18.144:8000/api/otpfor_resetpass",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",

          body: JSON.stringify(formData),
        }
      );
      const data = await res.json();
      console.log(data);

      if (res.status == 200) {
        setinputShow(true);
        setisOtpSend(data.detail);
        setformData((prev) => ({
          ...prev,
          email: data.email,
        }));
      } else if (res.status == 400 || res.status == 401) {
        seterrors(data.detail);
        setinputShow(false);
      }
    } catch (err) {
      console.log("Server Error at otp sending");
    } finally {
      setloading((prev) => ({ ...prev, otpsend: false }));
    }
  };

  const otpverification = async (e) => {
    e.preventDefault();

    if (formData.otp.length < 4) {
      seterrors("Please Enter minimum 4 digit");
      return;
    }

    try {
      setisOtpSend(null);
      setloading((prev) => ({ ...prev, otpverfication: true }));
      const res = await fetch(
        "http://192.168.18.144:8000/api/otp_verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",

          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (res.status == 200) {
        setisOtpSend(null);
        setisUserverified(true);
      } else if (res.status == 400 || res.status == 401) {
        seterrors(data.detail);
        console.log("Error at otp verification");
      }
    } catch (err) {
      console.log("Error at otp verification");
    } finally {
      setloading((prev) => ({ ...prev, otpverfication: false }));
    }
  };

  const handlechangepassword = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmpass) {
      seterrors("Passwords do not match");
      return;
    }

    try {
      setloading((prev) => ({ ...prev, changepass: true }));

      const res = await fetch(
        "http://192.168.18.144:8000/api/change_password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (res.status === 200) {
        setisUserverified(false);
        setformData((prev) => ({
          ...prev,
          username: "",
          otp: "",
          password: "",
          confirmpass: "",
          email: "",
          operation: "passwordreset",
        }));
        console.log("Password changed successfully");
        navigate("/signin");
      } else {
        seterrors(data.detail || "Unexpected error occurred");
      }
    } catch (err) {
      console.error("Network or server error:", err); // ✅ Add this
      seterrors("Something went wrong. Please try again.");
    } finally {
      setloading((prev) => ({ ...prev, changepass: false }));
    }
  };

  return (
    <section className=" h-screen w-full flex items-center justify-center bg-[#f8f3ff]">
      <div className=" md:w-[25%] md:h-[72%] ">
        <div className="h-full w-full ">
          <div className="h-full w-full  flex items-center justify-center ">
            <div className="w-full  p-15  flex flex-col items-center justify-center  rounded-xl shadow-xl bg-white mb-4">
              <div className="flex flex-col items-center justify-center ">
                <p className="  md:text-2xl text-2xl font-bold font-[poppins]  ">
                  RESET PASSWORD
                </p>
                <p className=" text-sm font-normal font-[poppins] text-center mt-2 mb-7">
                  {isUserverified
                    ? "Enter your new password to continue!"
                    : "No worries, we’ve got you!"}
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  isUserverified ? handlechangepassword(e) : handleGetOtp(e);
                }}
                className="w-full flex flex-col  items-center justify-center"
              >
                {isUserverified ? (
                  <>
                    <div className="w-full  flex flex-col items-center justify-center ">
                      <div className="w-full relative">
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
                          className="peer md:placeholder:text-[13px] placeholder:text-[13px] w-full px-2  pl-10 py-[5px] ring-1 ring-gray-200 rounded-md text-[14px] font-[poppins] placeholder:transparent  focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500   placeholder:text-gray-400 "
                        />

                        <i className="bi bi-person-lock absolute left-[10px] top-[50%] translate-y-[-50%] text-[18px] text-black"></i>

                        <i
                          className={`bi ${
                            showPassword ? "bi-eye-slash" : "bi-eye"
                          } absolute top-[50%] translate-y-[-50%] right-[10px]  text-[18px] text-black cursor-pointer`}
                          onClick={() => setshowPassword(!showPassword)}
                        ></i>
                        <p className="peer  peer-[&:not(:placeholder-shown):invalid]:visible absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] invisible text-red-500">
                          Please enter minimum 8 characters
                        </p>
                      </div>
                    </div>
                    <div className="w-full relative flex flex-col items-center justify-center mt-4">
                      <div className="w-full relative">
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
                          className="peer w-full px-2 md:pl-10 pl-7 py-[4px] ring-1 ring-gray-200 rounded-md shadow-md   text-md font-[inter] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500 placeholder:text-sm placeholder:text-gray-400 "
                        />
                        <i className="bi bi-person-fill-lock absolute left-[10px] top-[50%] translate-y-[-50%] text-[18px] text-black"></i>

                        <i
                          className={`bi ${
                            confirmpass ? "bi-eye-slash" : "bi-eye"
                          } absolute top-[50%] translate-y-[-50%] right-[10px]  text-[18px] text-black cursor-pointer`}
                          onClick={() => setconfirmpass(!confirmpass)}
                        ></i>

                        {errors && (
                          <p className="absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] text-sm text-red-500 ">
                            {errors}
                          </p>
                        )}
                      </div>
                    </div>
                    <button className="relative w-full py-1 rounded-md  mt-10 ring-1 ring-[#68479D] focus:outline-0 text-white font-bold  active:bg-[#7c62a5] bg-[#68479D]">
                      {loading.changepass ? (
                        <>
                          <p className="text-[14px] font-[poppins]">RESET</p>
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
                        <p className="text-[14px] font-[poppins]">RESET</p>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="w-full relative flex flex-col items-center justify-center mt-4">
                    <div className="w-full relative">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => {
                          setformData((prev) => ({
                            ...prev,
                            username: e.target.value,
                          })),
                            seterrors("");
                        }}
                        placeholder="Enter your username or email"
                        className=" w-full px-2 pl-10 py-[5px] md:placeholder:text-[13px] placeholder:text-[13px] ring-1 ring-gray-200 rounded-md   text-md font-[poppins] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500   placeholder:text-gray-400  "
                      />
                      <i className="bi bi-person absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black"></i>
                      {isUserverified ? (
                        ""
                      ) : (
                        <button className="absolute h-full  top-[50%] translate-y-[-50%] right-0  text-[14px]   md:w-[30%] w-[25%] py-1 rounded-md ring-1 ring-[#68479D] focus:outline-0 text-white font-bold font-[poppins] active:bg-[#7c62a5] bg-[#68479D] cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                          {loading.otpsend ? (
                            <>
                              <p className="text-[14px] font-[poppins]">
                                GET OTP
                              </p>
                              <svg
                                aria-hidden="true"
                                className="absolute right-[8%] bottom-[1%] -translate-y-1/2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-300 fill-white "
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
                            <p className="text-[14px] font-[poppins]">
                              <p className="text-[14px] font-[poppins]">
                                GET OTP
                              </p>
                            </p>
                          )}
                        </button>
                      )}
                      {isOtpSend && (
                        <p className="absolute w-full -bottom-[70%] -right-6 text-[13px] font-light font-[poppins] text-green-500 ">
                          {isOtpSend}
                        </p>
                      )}{" "}
                      {!inputShow && (
                        <p className="absolute -bottom-[80%] left-1 text-[13px] font-light font-[inter] text-sm text-red-500 ">
                          {errors}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </form>
              {isUserverified ? (
                ""
              ) : (
                <form
                  className="relative flex flex-col w-full items-center justify-center"
                  onSubmit={(e) => otpverification(e)}
                >
                  <div
                    className={`w-full relative  flex-col items-center justify-center mt-8 ${
                      inputShow ? "" : "hidden"
                    }`}
                  >
                    <div className="w-full relative flex items-center justify-center ">
                      <InputOtp
                        value={formData.otp}
                        onChange={(e) => {
                          seterrors(""),
                            setformData((prev) => ({
                              ...prev,
                              otp: e.target.value,
                            }));
                        }}
                        integerOnly
                        min={4}
                        className="peer [&>.p-inputotp-input]:border-gray-300
                          [&>.p-inputotp-input:focus]:border-[#68479D]
                           [&>.p-inputotp-input:focus]:ring-1
                           [&>.p-inputotp-input:focus]:ring-[#68479D]"
                      />
                      {/* <input
                        type="text"
                        value={formData.otp}
                        onChange={(e) => {
                          seterrors(""),
                            setformData((prev) => ({
                              ...prev,
                              otp: e.target.value,
                            }));
                        }}
                        placeholder="Enter your Otp"
                        className="peer w-full px-2 pl-10 py-[5px] md:placeholder:text-[13px] placeholder:text-[13px] ring-1 ring-gray-200 rounded-md   text-md font-[poppins] placeholder:transparent focus:outline-none focus:ring-1 focus:valid:ring-[#68479D] focus:invalid:ring-red-500   placeholder:text-gray-400  "
                      /> */}
                      {/* <i className="bi bi-person-lock absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black "></i> */}

                      <p className="peer peer-invalid:visible absolute -bottom-[80%] left-[17%] text-[13px] font-light font-[inter] invisible text-red-500">
                        Please enter minimum 8 character
                      </p>
                      {inputShow && (
                        <p className="absolute -bottom-[80%] left-1 text-[13px] font-light font-[inter] text-sm text-red-500 ">
                          {errors}
                        </p>
                      )}
                    </div>
                    <button className="relative  w-full py-1 rounded-md   mt-8 ring-1 ring-[#68479D] focus:outline-0 text-white font-bold font-[inter] active:bg-[#7c62a5] bg-[#68479D]">
                      {loading.otpverfication ? (
                        <>
                          <p className="text-[14px] font-[poppins]">RESET</p>
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
                        <p className="text-[14px] font-[poppins]">RESET</p>
                      )}
                    </button>
                  </div>{" "}
                </form>
              )}
              {isUserverified ? (
                ""
              ) : (
                <p className="w-full md:text-sm text-[14px] font-[poppins] md:font-medium mt-5 text-center ">
                  Back to
                  <Link to="/signin">
                    {" "}
                    <span className="text-[#68479D] hover:underline cursor-pointer ">
                      Login?
                    </span>
                  </Link>{" "}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPass;
