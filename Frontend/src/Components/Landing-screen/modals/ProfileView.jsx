import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithAuth } from "../../../utils";
import DeleteConfirmModal from "./DeleteConfirmModal";
import AccountDelConfimModal from "./AccountDelConfimModal";

const ProfileView = ({ isOpen, onClose, Seluser }) => {
  const [isSameUser, setisSameUser] = useState(false);
  const modalRef = useRef();
  const [formData, setformData] = useState({});
  const fileInputRef = useRef(null);
  const [profilepic, setprofilepic] = useState(null);
  const [isEdit, setisEdit] = useState({
    name: false,
    about: false,
    profile: false,
  });
  const { user } = useSelector((state) => state.chatdot);
  const [ModalMsg, setModalMsg] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setselectedUser] = useState(null);
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

  const RemoveProfile = () => {
    setformData((prev) => ({
      ...prev,
      profile: "remove",
    }));
  };

  const openDeleteModal = () => {
    setModalMsg("confirm delete");
    setShowDeleteModal(true);
  };

  const DeleteAccount = () => {};

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
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        console.log("Clicked outside modal, closing...");
        setisEdit((prev) => ({
          name: false,
          about: false,
          profile: false,
        }));
        setShowDeleteModal(false);
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

  const handleProfileEdit = async (e) => {
    e.preventDefault();
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

      if (profilepic) {
        payload.append("profile", formData.profile);
      }
      console.log(profilepic);
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
      } else if (res.status === 400 || res.status === 401) {
        console.log(data.detail || "profile edit failed.");
        console.log("Error at profile edit");
      }
    } catch (err) {
      console.log("Server Error at profile edit:", err);
    }
  };

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
            className="bg-white dark:bg-white p-6 rounded-lg w-[25%] h-[65%] shadow-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <form action="submit" onSubmit={handleProfileEdit}>
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
              </div>
              <div className="flex   text-black mt-11">
                <div className="flex flex-col  w-[100%]">
                  <p
                    className="font-medium text-md font-[inter] w-full text-center cursor-pointer text-[#68479D]"
                    onClick={() => {
                      triggerFileInput();
                      setisEdit((prev) => ({
                        ...prev,
                        profile: true,
                      }));
                    }}
                  >
                    Edit
                  </p>
                </div>
              </div>
              <div className="flex   text-black mt-">
                <div className="flex   w-[100%]">
                  <p
                    className="font-medium text-md font-[inter] w-full text-center cursor-pointer text-red-600"
                    onClick={() => {
                      RemoveProfile();
                      setisEdit((prev) => ({
                        ...prev,
                        profile: true,
                      }));
                    }}
                  >
                    Remove Profile
                  </p>
                  <p
                    className="font-medium text-md font-[inter] w-full text-center cursor-pointer text-red-600"
                    onClick={() => {
                      openDeleteModal();
                    }}
                  >
                    Delete Account
                  </p>
                </div>
              </div>
              <div className="flex gap-2 p-2 text-black">
                <div className="flex flex-col gap-1 w-full">
                  <div className="font-medium text-2xl font-[inter] w-full text-center flex items-center gap-1">
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
                      className={`transition-all duration-300 ease-in-out text-center rounded-md focus:outline-none font-[inter]
                    ${
                      isEdit.name
                        ? "bg-black/10 px-2 py-1 w-full"
                        : "bg-transparent w-fit cursor-default"
                    }`}
                    />
                    <i
                      className="bi bi-pencil text-sm cursor-pointer"
                      onClick={() =>
                        setisEdit((prev) => ({
                          ...prev,
                          name: true,
                        }))
                      }
                    ></i>
                  </div>

                  <p className="font-medium text-md font-[inter] flex items-center gap-1.5 pt-3">
                    <i className="bi bi-person"></i> {formData.username}
                  </p>
                  <p className="font-medium text-md font-[inter] flex items-center gap-1.5 pt-1.5">
                    <i className="bi bi-envelope"></i> {formData.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1 p-2 w-[100%] pt-5">
                <p className="font-medium text-xl font-[poppins] border-b pl-1.5 flex items-center gap-2">
                  About
                  <i
                    class="bi bi-pencil text-sm  cursor-pointer"
                    onClick={() =>
                      setisEdit((prev) => ({
                        ...prev,
                        about: true,
                      }))
                    }
                  ></i>
                </p>
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
                    isEdit.about ? "bg-black/10 focus:bg-black/10 p-1" : ""
                  } mt-1 font-medium text-md font-[inter] pl-2 focus:outline-0  rounded-md min-w-full min-h-[50px] resize-none overflow-y-auto `}
                />
              </div>
              <button
                className={`${
                  isEdit.about || isEdit.name || isEdit.profile ? "" : "hidden"
                } px-3 py-0.5 rounded-md font-medium ring-1 ring-[#68479D] focus:outline-0 text-white font-[poppins] active:bg-[#7c62a5] bg-[#68479D]`}
                onClick={() => {
                  setisEdit((prev) => ({
                    ...prev,
                    name: false,
                    about: false,
                    profile: false,
                  }));
                }}
              >
                Save
              </button>
            </form>
          </div>
          <AccountDelConfimModal
            userid={user?.id}
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onDelete={DeleteAccount}
            showMsg={ModalMsg}
          />
        </div>
      ) : (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()} // Close when clicking backdrop
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-white p-6 rounded-lg w-[25%] h-[65%] shadow-lg flex flex-col"
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
                {Seluser?.about}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileView;
