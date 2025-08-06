import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

const ProfileView = ({ isOpen, onClose, Seluser }) => {
  const [isSameUser, setisSameUser] = useState(false);
  const modalRef = useRef();
  const [formData, setformData] = useState({});

  const { user } = useSelector((state) => state.chatdot);
  useEffect(() => {
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        console.log("Clicked outside modal, closing...");
        onClose();
      }
    }

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

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

  useEffect(() => {
    if (Seluser && Seluser.username == user.username) {
      setisSameUser(true);
    }
    setformData(() => ({
      name: user.name,
      email: user.email,
      username: user.username,
      profile: user.profile,
      about: user.about,
    }));
  }, [isOpen]);
  console.log(isSameUser);
  console.log(formData);

  if (!isOpen || !Seluser) return null;

  const handleClose = (e) => {
    e.stopPropagation();
    console.log("Close button clicked");
    onClose();
  };

  return (
    <>
      {isSameUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-white p-6 rounded-lg w-[25%] h-[90%] shadow-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 mb-4 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-black">
                Profile
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full h-[120px] ring-1 ring-black bg-black rounded-md">
              <div className="absolute left-1/2 top-full -translate-y-1/2 -translate-x-1/2 w-[85px] h-[85px] outline-5 outline-white flex items-center justify-center bg-amber-100 text-xl font-bold rounded-full overflow-hidden ">
                {formData?.profile ? (
                  <img
                    src={`http://192.168.18.144:8000${formData.profile}`}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {formData?.name?.[0]?.toUpperCase() ||
                      formData?.username?.[0]?.toUpperCase() ||
                      "?"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 p-1 text-black mt-9">
              <div className="flex flex-col gap-1 p-2 w-[100%]">
                <p className="font-medium text-2xl font-[inter] w-full text-center">
                  {Seluser.name
                    ? formData.name.charAt(0).toUpperCase() +
                      formData.name.slice(1)
                    : formData.username}
                </p>
                <p className="font-medium text-md font-[inter] flex items-center gap-1.5 mt-3 ">
                  <i className="bi bi-person"></i> {formData.username}
                </p>
                <p className="font-medium text-md font-[inter] flex items-center gap-1.5">
                  <i className="bi bi-envelope"></i> {formData.email}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-2 w-[100%]">
              <p className="font-medium text-xl font-[poppins] border-b pl-1.5">
                About
              </p>
              <p className="font-medium text-md font-[inter] pl-2">
                {formData?.about ? formData.about : "Hey there, lets connect"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()} // Close when clicking backdrop
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-white p-6 rounded-lg w-[25%] h-[90%] shadow-lg flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent event bubbling
          >
            <div className="flex justify-between items-center pb-2 mb-4 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-black">
                Profile 
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full h-[120px] ring-1 ring-black bg-black rounded-md">
              <div className="absolute left-1/2 top-full -translate-y-1/2 -translate-x-1/2 w-[85px] h-[85px] outline-5 outline-white flex items-center justify-center bg-amber-100 text-xl font-bold rounded-full overflow-hidden">
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
            </div>

            <div className="flex gap-2 p-1 text-black mt-9">
              <div className="flex flex-col gap-1 p-2 w-[100%]">
                <p className="font-medium text-2xl font-[inter] w-full text-center">
                  {Seluser.name
                    ? Seluser.name.charAt(0).toUpperCase() +
                      Seluser.name.slice(1)
                    : Seluser.username}
                </p>
                <p className="font-medium text-md font-[inter] flex items-center gap-1.5 mt-3 ">
                  <i className="bi bi-person"></i> {Seluser.username}
                </p>
                <p className="font-medium text-md font-[inter] flex items-center gap-1.5">
                  <i className="bi bi-envelope"></i> {Seluser.email}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-2 w-[100%]">
              <p className="font-medium text-xl font-[poppins] border-b pl-1.5">
                About
              </p>
              <p className="font-medium text-md font-[inter] pl-2">
                {Seluser?.about ? Seluser.about : "Hey there, lets connect"}
              </p>
            </div>
          </div>
        </div>
      )}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()} // Close when clicking backdrop
      >
        <div
          ref={modalRef}
          className="bg-white dark:bg-white p-6 rounded-lg w-[25%] h-[90%] shadow-lg flex flex-col"
          onClick={(e) => e.stopPropagation()} // Prevent event bubbling
        >
          <div className="flex justify-between items-center pb-2 mb-4 flex-shrink-0">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-black">
              Profile
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="relative w-full h-[120px] ring-1 ring-black bg-black rounded-md">
            <div className="absolute left-1/2 top-full -translate-y-1/2 -translate-x-1/2 w-[85px] h-[85px] outline-5 outline-white flex items-center justify-center bg-amber-100 text-xl font-bold rounded-full overflow-hidden">
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
          </div>

          <div className="flex gap-2 p-1 text-black mt-9">
            <div className="flex flex-col gap-1 p-2 w-[100%]">
              <p className="font-medium text-2xl font-[inter] w-full text-center">
                {Seluser.name
                  ? Seluser.name.charAt(0).toUpperCase() + Seluser.name.slice(1)
                  : Seluser.username}
              </p>
              <p className="font-medium text-md font-[inter] flex items-center gap-1.5 mt-3 ">
                <i className="bi bi-person"></i> {Seluser.username}
              </p>
              <p className="font-medium text-md font-[inter] flex items-center gap-1.5">
                <i className="bi bi-envelope"></i> {Seluser.email}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 p-2 w-[100%]">
            <p className="font-medium text-xl font-[poppins] border-b pl-1.5">
              About
            </p>
            <p className="font-medium text-md font-[inter] pl-2">
              {Seluser?.about ? Seluser.about : "Hey there, lets connect"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileView;
