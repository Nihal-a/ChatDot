import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSelector } from "react-redux";
import { fetchWithAuth } from "../../utils";
import { format } from "date-fns";
import Cookies from "universal-cookie";
import ProfileView from "./modals/ProfileView";
import UnfriendModal from "./modals/UnfriendModal";
import Frndrequest from "./modals/Frndrequest";
import ClearChatModal from "./modals/ClearChatModal";

const Sidebar = forwardRef(
  (
    { onselectUser, latestMsg, onBlock, onunBlock, onClearChat, callgetUsers },
    ref
  ) => {
    const [search, setSearch] = useState("");
    const [allusers, setAllUsers] = useState([]);
    const [isSelected, setisSelected] = useState();
    const [imageError, setImageError] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState("bottom");
    const [showProfileView, setshowProfileView] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [showUnfriendModal, setshowUnfriendModal] = useState(false);
    const [showClearChatModal, setshowClearChatModal] = useState(false);
    const [unFriendUser, setunFriendUser] = useState(null);
    const [clearChatUser, setClearChatUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOptionMenu, setisOptionMenu] = useState({
      userid: null,
      open: false,
      user: null,
    });

    const { user } = useSelector((state) => state.chatdot);
    const useralterdropdownRef = useRef(null);
    const cookies = new Cookies();
    const access = cookies.get("access");

    const handleBlockClick = (chatuser) => {
      onBlock(chatuser.username);
      fetchUsers();
    };

    const handleunBlockClick = (chatuser) => {
      onunBlock(chatuser.username);
      fetchUsers();
    };

    const handleClearChat = () => {
      setshowClearChatModal(false);
      onClearChat(clearChatUser.username);
      const userdetails = allusers.find(
        (item) => item.username === clearChatUser.username
      );

      console.log(userdetails);
      if (userdetails) {
        userdetails.last_message = "";
        userdetails.last_message_time = "";
        userdetails.unseen_count = 0;
        userdetails.formattedTime = "";
      }
    };

    const handleselectedUser = (u) => {
      const userdetails = allusers.find((item) => item.username === u.username);
      const selectedUser = userdetails || u;

      // Ensure we have all required properties
      const completeUser = {
        ...selectedUser,
        username: selectedUser.username,
        name: selectedUser.name || selectedUser.username,
        id: selectedUser.id || selectedUser.username,
        last_message: selectedUser.last_message || "",
        last_message_time: selectedUser.last_message_time || "",
        unseen_count: 0, // Reset unseen count when selected
      };

      onselectUser(completeUser);
      setisSelected(u.username);
    };

    useImperativeHandle(ref, () => ({
      fetchUsers,
    }));

    const fetchUsers = async () => {
      try {
        const res = await fetchWithAuth(
          "http://192.168.18.144:8000/api/get_users",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${access}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();

        if (res.status === 200) {
          const filteredUsers = data.connections.filter(
            (u) => u.username !== user.username
          );
          const formattedUsers = formatUserList(filteredUsers);
          setAllUsers(formattedUsers);
        } else {
          console.error(
            "Failed to fetch users:",
            data.detail || res.statusText
          );
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const formatUserList = (users) => {
      return users.map((u) => {
        let formattedTime = "";
        if (u.last_message_time) {
          try {
            const msgDate = new Date(u.last_message_time);
            if (!isNaN(msgDate.getTime())) {
              // Check if date is valid
              const now = new Date();
              const isToday =
                msgDate.getDate() === now.getDate() &&
                msgDate.getMonth() === now.getMonth() &&
                msgDate.getFullYear() === now.getFullYear();

              formattedTime = isToday
                ? format(msgDate, "hh:mm a")
                : format(msgDate, "dd MMM");
            }
          } catch (error) {
            console.error("Error formatting date:", error, u.last_message_time);
          }
        }

        return {
          ...u,
          formattedTime,
          last_message: u.last_message || "",
          unseen_count: u.unseen_count || 0,
          id: u.id || u.username,
        };
      });
    };

    const handleShowProfile = (e, u) => {
      e.stopPropagation();
      setProfileUser(u);
      setshowProfileView(true);
      setisOptionMenu({
        open: false,
        userid: null,
        user: null,
      });
    };

    const handleCloseProfile = () => {
      setshowProfileView(false);
      setProfileUser(null);
    };

    const filteredUsers = allusers.filter(
      (u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleOptionMenu = async (e, u) => {
      e.preventDefault();
      e.stopPropagation();
      setisOptionMenu((prev) => ({
        ...prev,
        open: true,
        userid: u.id,
        user: u,
      }));

      setTimeout(() => {
        const userElement = document.getElementById(`user-${u.id}`);
        if (userElement) {
          const rect = userElement.getBoundingClientRect();
          const screenHeight = window.innerHeight;

          if (rect.top > screenHeight * 0.65) {
            setDropdownPosition("top");
          } else {
            setDropdownPosition("bottom");
          }
        }
      }, 0);
    };

    const handleUnfriend = (chatuser) => {
      setshowUnfriendModal(true);
      setunFriendUser(chatuser);
    };

    useEffect(() => {
      function handleClickOutside(e) {
        if (
          useralterdropdownRef.current &&
          !useralterdropdownRef.current.contains(e.target)
        ) {
          setisOptionMenu({
            open: false,
            userid: null,
            user: null,
          });
        }
      }

      if (isOptionMenu.open) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOptionMenu.open]);

    useEffect(() => {
      if (!latestMsg || !Array.isArray(latestMsg)) return;

      setAllUsers((prevList) => {
        let updatedList = [...prevList];

        latestMsg.forEach((newItem) => {
          const idx = updatedList.findIndex(
            (it) => it.username === newItem.username
          );

          if (idx !== -1) {
            // Update existing user
            const existingUser = updatedList[idx];
            const updatedUser = {
              ...existingUser,
              last_message:
                newItem.last_message || existingUser.last_message || "",
              last_message_time:
                newItem.last_message_time ||
                existingUser.last_message_time ||
                "",
              unseen_count:
                newItem.unseen_count !== undefined
                  ? newItem.unseen_count
                  : existingUser.unseen_count || 0,
            };

            const formattedUser = formatUserList([updatedUser])[0];
            updatedList[idx] = formattedUser;

            if (
              newItem.last_message &&
              newItem.last_message !== existingUser.last_message
            ) {
              const [moved] = updatedList.splice(idx, 1);
              updatedList.unshift(moved);
            }
          } else {
            if (newItem.username) {
              const newUser = {
                username: newItem.username,
                name: newItem.name || newItem.username,
                id: newItem.id || newItem.username,
                last_message: newItem.last_message || "",
                last_message_time: newItem.last_message_time || "",
                unseen_count: newItem.unseen_count || 0,
                profile: newItem.profile || null,
                is_blocked_by: newItem.is_blocked_by || [],
              };

              const formattedUser = formatUserList([newUser])[0];
              updatedList.unshift(formattedUser);
            }
          }
        });

        return updatedList;
      });
    }, [latestMsg]);

    useEffect(() => {
      if (access && user?.username) {
        fetchUsers();
      }
    }, [access, user?.username]);

    return (
      <section className="w-full  h-full  border-gray-200 flex flex-col p-5 bg-[#f8f3ff]">
        <div className="h-[10%] flex items-center justify-between px-4 w-full bg-white rounded-t-xl">
          <p className="text-2xl font-bold">ChatDot</p>{" "}
          {user.notfication_count > 0 && (
            <div className="md:w-[15px] md:h-[15px] absolute rounded-full p-1 top-1.5 right-16.5 ring-1 z-10 bg-white ring-green-700 flex items-center justify-center">
              <p className="text-[10px] font-normal font-[poppins]">
                {user.notfication_count}
              </p>
            </div>
          )}
          <div
            className={`relative w-[40px] h-[40px] rounded-full bg-white  ${
              user.notfication_count > 0
                ? "ring-green-700 ring-2"
                : "ring-[#68479D] ring-1"
            } overflow-hidden cursor-pointer flex items-center justify-center`}
            onClick={() => setIsModalOpen(true)}
          >
            <i className="absolute  bi bi-person-fill-add text-2xl text-[#68479D]"></i>
          </div>
        </div>
        <div className="h-[6%] px-4 bg-white">
          <div className="relative w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or start new chat"
              className="w-full py-2 md:pl-8 pl-2 pr-4 text-sm rounded-md ring-1 ring-gray-300  focus:outline-none"
            />
            <i className="bi bi-search hidden md:block absolute left-[10px] top-[50%] translate-y-[-50%] text-[14px] text-black"></i>
          </div>
        </div>
        <div
          className="flex-grow overflow-y-auto scrollbar-hide px-4 pb-4 overflow-hidden bg-white rounded-b-xl"
          style={{ scrollbarWidth: "none" }}
        >
          {filteredUsers.map((chatuser) => (
            <div
              id={`user-${chatuser.id}`}
              className={`relative flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full ${
                isSelected === chatuser.username ? "bg-gray-100" : ""
              }`}
              key={chatuser.id ?? chatuser.username}
              onClick={() => handleselectedUser(chatuser)}
              onContextMenu={(e) => {
                handleOptionMenu(e, chatuser);
              }}
            >
              <div className="hidden min-w-[40px] h-[40px] md:flex md:items-center md:justify-center bg-[#f8f3ff] text-xl font-bold rounded-full overflow-hidden">
                {!imageError && chatuser?.profile ? (
                  <img
                    src={`http://192.168.18.144:8000${chatuser.profile}`}
                    alt="profile"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{chatuser?.username?.[0]?.toUpperCase() || "?"}</span>
                )}
              </div>
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col w-[80%]">
                  <p className="font-medium text-[14px]">{chatuser.username}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-[13px] text-gray-500 truncate ">
                      {chatuser.last_message &&
                      chatuser.last_message.trim() !== ""
                        ? chatuser.last_message
                        : "No messages yet"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-[20%]">
                  {chatuser.unseen_count > 0 && (
                    <span className="text-xs font-semibold text-white bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                      {chatuser.unseen_count}
                    </span>
                  )}
                  <p className="md:text-[10px] hidden md:block text-gray-400">
                    {chatuser.formattedTime}
                  </p>
                </div>
              </div>

              {isOptionMenu.open && isOptionMenu.userid === chatuser.id && (
                <div
                  ref={useralterdropdownRef}
                  className={`absolute w-full -bottom-2.5 right-7 flex justify-end z-10 cursor-default ${
                    dropdownPosition === "top"
                      ? "top-0 mt-0 left-2"
                      : "top-14 right-7"
                  }`}
                >
                  <div className="min-w-[43%] rounded-lg ring-1 min-h-[155px] bg-white  px-2 shadow-lg py-2">
                    <div
                      className="w-full flex gap-2 items-center text-black cursor-pointer py-1 p-2  rounded-md "
                      onClick={(e) => handleShowProfile(e, chatuser)}
                    >
                      <i className="bi bi-person-circle"></i>
                      <p className="text-black text-sm">Show Profile</p>
                    </div>
                    <div
                      className="w-full flex gap-2 items-center text-black cursor-pointer py-1  p-2  rounded-md "
                      onClick={(e) => {
                        e.stopPropagation();
                        chatuser.is_blocked_by?.includes(user.username)
                          ? handleunBlockClick(chatuser)
                          : handleBlockClick(chatuser);
                        setisOptionMenu({
                          open: false,
                          userid: null,
                          user: null,
                        });
                      }}
                    >
                      {chatuser.is_blocked_by?.includes(user.username) ? (
                        <>
                          <i className="bi bi-ban"></i>
                          <p className="text-black text-sm">Unblock</p>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-ban"></i>
                          <p className="text-black text-sm">Block</p>
                        </>
                      )}
                    </div>
                    <div
                      className="w-full flex gap-2 items-center text-black cursor-pointer py-1  p-2  rounded-md "
                      onClick={(e) => {
                        e.stopPropagation();
                        // handleClearChat(chatuser);
                        setshowClearChatModal(true);
                        setClearChatUser(chatuser);
                        setisOptionMenu({
                          open: false,
                          userid: null,
                          user: null,
                        });
                      }}
                    >
                      <i className="bi bi-envelope-x"></i>
                      <p className="text-black text-sm">Clear Chat</p>
                    </div>
                    <div
                      className="w-full flex gap-2 items-center text-black cursor-pointer py-1  p-2  rounded-md "
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnfriend(chatuser);
                        setisOptionMenu({
                          open: false,
                          userid: null,
                          user: null,
                        });
                      }}
                    >
                      <i className="bi bi-person-fill-slash"></i>
                      <p className="text-black text-sm">Unfriend</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <ProfileView
          onClose={handleCloseProfile}
          isOpen={showProfileView}
          Seluser={profileUser}
        />

        <ClearChatModal
          isOpen={showClearChatModal}
          onClose={() => {
            setshowClearChatModal(false);
            setClearChatUser(null);
          }}
          clearchat={handleClearChat}
          clearChatUser={clearChatUser}
        />
        <UnfriendModal
          isOpen={showUnfriendModal}
          unfrienduser={unFriendUser}
          onClose={() => {
            setshowUnfriendModal(false);
            setunFriendUser(null);
          }}
          refetch={fetchUsers}
        />
        <Frndrequest
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAccept={callgetUsers}
        />
      </section>
    );
  }
);

export default Sidebar;
