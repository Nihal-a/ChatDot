import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { fetchWithAuth } from "../../../utils";
import AccountDelConfimModal from "./AccountDelConfimModal";
import { PiPencilSimpleLineDuotone } from "react-icons/pi";

const ProfileView = ({ isOpen, onClose, Seluser }) => {
  if (!isOpen || !Seluser) return null;

  const [isSameUser, setisSameUser] = useState(false);
  const [formData, setformData] = useState({});
  const [profilepic, setprofilepic] = useState(null);
  const { user } = useSelector((state) => state.chatdot);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEdit, setisEdit] = useState({
    name: false,
    about: false,
    profile: false,
  });

  const fileInputRef = useRef(null);
  const modalRef = useRef();

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setprofilepic(URL.createObjectURL(file));
      setformData((prev) => ({
        ...prev,
        profile: file,
      }));
    }
  };

  const handleProfileEdit = async (e) => {
    // e.preventDefault();
    if (formData.name.trim().length < 3) {
      alert("Name must be at least 3 characters long.");
      setformData((prev) => ({
        ...prev,
        name: user.name,
      }));
      return;
    }
    try {
      const payload = new FormData();

      payload.append("id", user.id);
      payload.append("name", formData.name);
      payload.append("about", formData.about);

      console.log("formData.profile:", formData.profile);
      console.log("profilepic:", profilepic);

      // Fixed operation logic
      if (formData.profile === null) {
        // User wants to remove profile picture
        payload.append("profile", "");
        payload.append("operation", "remove");
      } else if (profilepic === null && formData.profile !== null) {
        // No new image selected, keep existing
        payload.append("operation", "nochange");
      } else if (profilepic !== null) {
        // New image selected
        payload.append("operation", "change");
        payload.append("profile", formData.profile);
      } else {
        // Default case - no change
        payload.append("operation", "nochange");
      }

      console.log("Operation:", payload.get("operation"));

      const res = await fetchWithAuth(
        "http://192.168.18.144:8000/api/profile_edit",
        {
          method: "POST",
          credentials: "include",
          body: payload,
        }
      );

      const data = res;
      console.log(res);

      if (res.status === 200) {
        console.log("profile edit success");
        // Reset edit states after successful update
        setisEdit({
          name: false,
          about: false,
          profile: false,
        });
        // Clear the preview image

      } else if (res.status === 400 || res.status === 401) {
        console.log(data.detail || "profile edit failed.");
        console.log("Error at profile edit");
      }
    } catch (err) {
      console.log("Server Error at profile edit:", err);
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    console.log("Close button clicked");
    onClose();
  };
  useEffect(() => {
    if (Seluser && Seluser.username == user.username) {
      setisSameUser(true);
      // setprofilepic(formData.profile);
    }
    setformData(() => ({
      name: user.name,
      email: user.email,
      username: user.username,
      profile: user.profile,
      about: user.about,
    }));
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") {
        console.log("Escape pressed, closing modal...");
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <>
      {isSameUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-[#f8f3ff] p-7 rounded-lg md:w-[25%] w-[90%]  shadow-lg flex flex-col "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 mb-4 flex-shrink-0">
              <h3 className="text-[16px] font-semibold text-gray-900 dark:text-black">
                PROFILE
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                type="button"
              >
                <i className="bi bi-x text-xl text-black"></i>
              </button>
            </div>

            <div className="w-full  flex items-center rounded-t-lg bg-white  p-5  ">
              <div className="  w-[85px]  h-[85px] ring-1 outline-5 outline-white flex items-center justify-center bg-amber-100 text-xl font-bold rounded-full overflow-hidden">
                {formData?.profile ? (
                  <img
                    src={
                      isSameUser
                        ? profilepic != null
                          ? profilepic
                          : `http://192.168.18.144:8000${formData.profile}`
                        : `http://192.168.18.144:8000${formData.profile}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <span>
                    {formData?.name?.[0]?.toUpperCase() ||
                      formData?.username?.[0]?.toUpperCase() ||
                      "?"}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className="flex flex-col ml-5 ">
                {" "}
                <div
                  className="w-fit ring-1 ring-gray-200 rounded-xl py-1 px-2 cursor-pointer "
                  onClick={() => {
                    if (isEdit.profile) {
                      setisEdit((prev) => ({
                        ...prev,
                        name: false,
                        about: false,
                        profile: false,
                      }));
                      handleProfileEdit();
                    } else {
                      triggerFileInput();
                      setisEdit((prev) => ({
                        ...prev,
                        profile: true,
                      }));
                    }
                  }}
                >
                  <p className="text-[14px] font-[poppins] font-normal">
                    {profilepic && isEdit.profile ? (
                      "Save new photo"
                    ) : (
                      <>Upload new photo</>
                    )}
                  </p>
                </div>
                <div className="text-[12px] text-gray-500">
                  <p className="text-[12px] font-[poppins] font-normal ml-2 mt-1">
                    This photo will be used to, <br /> identify you
                  </p>{" "}
                </div>
              </div>
            </div>
            <div className="w-full  flex flex-col items-center  bg-white  p-5 mt-0.5 ">
              <div className="w-full flex items-center justify-between text-[14px] font-[poppins]">
                <p className="font-semibold">Personal info</p>
                {/* <div className="ring-1 ring-gray-200 rounded-2xl py-1 px-2"></div> */}
                <></>
              </div>
              <div className="w-full flex flex-col  items-center justify-between mt-3">
                <div className="w-full flex ">
                  <div className="w-1/2 flex flex-col text-[14px]  font-[poppins]">
                    <div className="flex gap-4 place-items-end ">
                      <p className="text-gray-500 font-normal">Full Name</p>
                      <div className="ring-1 ring-gray-200 rounded-2xl py-0.5 px-2 ">
                        <p
                          className="cursor-pointer flex items-center gap-1 text-[12px]"
                          onClick={() =>
                            isEdit.name
                              ? (() => {
                                  setisEdit((prev) => ({
                                    ...prev,
                                    name: false,
                                  }));
                                  handleProfileEdit();
                                })()
                              : setisEdit((prev) => ({
                                  ...prev,
                                  name: true,
                                }))
                          }
                        >
                          {isEdit.name ? (
                            "Save"
                          ) : (
                            <>
                              <PiPencilSimpleLineDuotone /> Edit
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      disabled={!isEdit.name}
                      minLength={3}
                      onChange={(e) => {
                        if (isEdit.name) {
                          setformData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }));
                        }
                      }}
                      className={`transition-all duration-300 text-start  ease-in-out  rounded-md focus:outline-none font-[poppins] mt-2
                    ${
                      isEdit.name
                        ? "bg-black/10 py-1 w-full px-2 "
                        : "bg-transparent w-fit cursor-default  "
                    }`}
                    />
                  </div>{" "}
                  <div className="w-1/2 flex flex-col text-[14px]  font-[poppins] ">
                    <p className="text-gray-500 font-normal mb-2">Username</p>
                    <p>{formData.username}</p>
                  </div>
                </div>
                <div className="w-full flex mt-3">
                  <div className="w-1/3 flex flex-col text-[14px]  font-[poppins]">
                    <p className="text-gray-500 font-normal">Email</p>
                    <p>{formData.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full  flex flex-col items-center  bg-white  p-5 mt-0.5 ">
              <div className="w-full flex items-center justify-between text-[14px] font-[poppins]">
                <p className="font-semibold">About</p>
                <div
                  className="ring-1 ring-gray-200 rounded-2xl py-1 px-2"
                  onClick={() =>
                    isEdit.about
                      ? (() => {
                          setisEdit((prev) => ({
                            ...prev,
                            about: false,
                          }));
                          handleProfileEdit();
                        })()
                      : setisEdit((prev) => ({
                          ...prev,
                          about: true,
                        }))
                  }
                >
                  <p className="cursor-pointer flex items-center gap-1">
                    {isEdit.about ? (
                      "Save"
                    ) : (
                      <>
                        <PiPencilSimpleLineDuotone /> Edit
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="w-full flex flex-col  items-center justify-between mt-3">
                {" "}
                <textarea
                  type="text"
                  value={formData.about}
                  disabled={isEdit.about ? false : true}
                  onChange={(e) => {
                    isEdit.about
                      ? setformData((prev) => ({
                          ...prev,
                          about: e.target.value,
                        }))
                      : "";
                  }}
                  className={`${
                    isEdit.about ? "bg-black/10 focus:bg-black/10 p-2" : ""
                  } mt-1 font-normal text-[14px] font-[poppins] pl-2 focus:outline-0  rounded-md min-w-full min-h-[40px] resize-none overflow-y-auto `}
                />
              </div>
            </div>
            <div className="w-full  flex flex-col items-center  bg-white rounded-b-lg  p-3 mt-0.5 ">
              <div className="w-full flex items-center justify-between text-[14px] font-[poppins] gap-2 ">
                <button
                  className="w-1/2 rounded-lg ring-1 ring-gray-200 p-2 cursor-pointer text-red-700 bg-[#f8f3ff] "
                  onClick={async () => {
                    setprofilepic(null);
                    setformData((prev) => ({
                      ...prev,
                      profile: null,
                    }));

                    const tempFormData = {
                      ...formData,
                      profile: null,
                    };

                    try {
                      const payload = new FormData();
                      payload.append("id", user.id);
                      payload.append("name", tempFormData.name);
                      payload.append("about", tempFormData.about);
                      payload.append("profile", "");
                      payload.append("operation", "remove");

                      const res = await fetchWithAuth(
                        "http://192.168.18.144:8000/api/profile_edit",
                        {
                          method: "POST",
                          credentials: "include",
                          body: payload,
                        }
                      );

                      if (res.status === 200) {
                        console.log("Profile removed successfully");
                      } else {
                        console.log("Failed to remove profile");
                      }
                    } catch (err) {
                      console.log("Error removing profile:", err);
                    }
                  }}
                >
                  Remove Profile
                </button>
                <button
                  className="w-1/2 rounded-lg ring-1 ring-gray-200 p-2 cursor-pointer text-red-700 bg-[#f8f3ff] "
                  onClick={() => {
                    setShowDeleteModal(true);
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
          <AccountDelConfimModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
          />
        </div>
      ) : (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()} // Close when clicking backdrop
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-[#f8f3ff] p-7 rounded-lg md:w-[25%] w-[90%]  shadow-lg flex flex-col "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 mb-4 flex-shrink-0">
              <h3 className="text-[16px] font-semibold text-gray-900 dark:text-black">
                PROFILE
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                type="button"
              >
                <i className="bi bi-x text-xl text-black"></i>
              </button>
            </div>

            <div className="w-full  flex items-center rounded-t-lg bg-white  p-5 gap-5">
              <div className="  w-[85px]  h-[85px] ring-1 outline-5 outline-white flex items-center justify-center bg-amber-100 text-xl font-bold rounded-full overflow-hidden">
                {Seluser?.profile ? (
                  <img
                    src={`http://192.168.18.144:8000${Seluser.profile}`}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {Seluser?.name?.[0]?.toUpperCase() ||
                      Seluser?.username?.[0]?.toUpperCase() ||
                      "?"}
                  </span>
                )}
              </div>
              <div className=" flex flex-col  items-center justify-between mt-3">
                <div className="w-full flex ">
                  <div className="w-2/3 flex flex-col text-[14px]  font-[poppins] ">
                    <p className="text-gray-500 font-normal ">Full Name</p>
                    <p>{formData.name}</p>
                  </div>
                  <div className="w-1/3 flex flex-col text-[14px]  font-[poppins] ">
                    <p className="text-gray-500 font-normal ">Username</p>
                    <p>{formData.username}</p>
                  </div>
                </div>
                <div className="w-full flex mt-3">
                  <div className="w-1/3 flex flex-col text-[14px]  font-[poppins]">
                    <p className="text-gray-500 font-normal">Email</p>
                    <p>{formData.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col items-start justify-between text-[14px] font-[poppins] mt-4 px-5">
              <p className="font-semibold ">About</p>
              <p className="w-full">{formData.about}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileView;
