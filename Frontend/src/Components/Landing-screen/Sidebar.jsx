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

const Sidebar = forwardRef(
  ({ onselectUser, latestMsg, onBlock, onunBlock, onClearChat }, ref) => {
    const [search, setSearch] = useState("");
    const [allusers, setAllUsers] = useState([]);
    const [isSelected, setisSelected] = useState();
    const [imageError, setImageError] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState("bottom");
    const [showProfileView, setshowProfileView] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [showUnfriendModal, setshowUnfriendModal] = useState(false);
    const [unFriendUser, setunFriendUser] = useState(null);
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

    const handleClearChat = (chatuser) => {
      onClearChat(chatuser.username);
    };

    const handleselectedUser = (user) => {
      onselectUser(user);
      setisSelected(user.name);
    };

    useImperativeHandle(ref, () => fetchUsers);

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
      return users.map((user) => {
        let formattedTime = "";
        if (user.last_message_time) {
          const msgDate = new Date(user.last_message_time);
          const now = new Date();

          const isToday =
            msgDate.getDate() === now.getDate() &&
            msgDate.getMonth() === now.getMonth() &&
            msgDate.getFullYear() === now.getFullYear();

          formattedTime = isToday
            ? format(msgDate, "hh:mm a")
            : format(msgDate, "dd MMM");
        }

        return {
          ...user,
          formattedTime,
        };
      });
    };

    // Handle latestMsg updates

    const handleShowProfile = (e, user) => {
      e.stopPropagation();
      setProfileUser(user);
      setshowProfileView(true);
      setisOptionMenu({
        open: false,
        userid: null,
        user: null,
      });
    };

    // Handle profile modal closing
    const handleCloseProfile = () => {
      console.log("Closing profile modal");
      setshowProfileView(false);
      setProfileUser(null);
    };

    const filteredUsers = allusers.filter(
      (user) =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleOptionMenu = async (e, user) => {
      e.preventDefault();
      e.stopPropagation();
      setisOptionMenu((prev) => ({
        ...prev,
        open: true,
        userid: user.id,
        user: user,
      }));

      setTimeout(() => {
        const userElement = document.getElementById(`user-${user.id}`);
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
          const existingIndex = updatedList.findIndex(
            (item) => item.username === newItem.username
          );

          const enhancedItem = formatUserList([newItem])[0];

          if (existingIndex !== -1) {
            updatedList[existingIndex] = {
              ...updatedList[existingIndex],
              ...enhancedItem,
            };
          } else {
            updatedList.unshift(enhancedItem);
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
      <>
        <div className="h-[10%] flex items-center px-4">
          <p className="text-2xl font-bold">ChatDot</p>
        </div>
        <div className="h-[10%] px-4">
          <div className="relative w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or start new chat"
              className="w-full py-2 md:pl-10 pl-2 pr-4 text-sm rounded-md ring-1 ring-gray-300 focus:ring-0 focus:outline-none"
            />
            <i className="bi bi-search hidden md:block absolute left-3 top-2.5 text-gray-500 text-md"></i>
          </div>
        </div>
        <div
          className="flex-grow overflow-y-auto scrollbar-hide px-4 pb-4 overflow-hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {filteredUsers.map((chatuser) => (
            <div
              id={`user-${chatuser.id}`}
              className={`relative flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer  w-full  ${
                isSelected === chatuser.name ? "bg-gray-100" : ""
              }`}
              key={chatuser.id}
              onClick={() => handleselectedUser(chatuser)}
              onContextMenu={(e) => {
                handleOptionMenu(e, chatuser);
              }}
            >
              <div className="hidden  min-w-[40px] h-[40px] md:flex md:items-center md:justify-center bg-amber-100 text-xl font-bold rounded-full overflow-hidden">
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
                  <p className="font-medium pb-1">{chatuser.username}</p>
                  <div className="flex justify-between items-center">
                    {" "}
                    <p className="text-xs text-gray-500 truncate max-w-[50px] ">
                      {chatuser.last_message || "No messages yet"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5  w-[20%]">
                  {chatuser.unseen_count > 0 && (
                    <span className="text-xs font-semibold text-white bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                      {chatuser.unseen_count}
                    </span>
                  )}
                  <p className="md:text-[8px] hidden md:block text-gray-400">
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
                  <div className="min-w-[43%] rounded-sm ring-1 min-h-[170px] bg-white py-1.5 px-2 shadow-lg">
                    <div
                      className="w-full flex gap-2 items-center text-black cursor-pointer py-1 bg-amber-100 p-2 mt-1.5 rounded-md hover:bg-amber-200"
                      onClick={(e) => handleShowProfile(e, chatuser)}
                    >
                      <i className="bi bi-person-circle"></i>
                      <p className="text-black text-sm">Show Profile</p>
                    </div>
                    <div
                      className="w-full flex gap-2 items-center text-black cursor-pointer py-1 bg-amber-100 p-2 mt-1.5 rounded-md hover:bg-amber-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        chatuser.is_blocked_by.includes(user.username)
                          ? handleunBlockClick(chatuser)
                          : handleBlockClick(chatuser);
                        setisOptionMenu({
                          open: false,
                          userid: null,
                          user: null,
                        });
                      }}
                    >
                      {chatuser.is_blocked_by.includes(user.username) ? (
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
                      className="w-full flex gap-2 items-center text-black cursor-pointer py-1 bg-amber-100 p-2 mt-1.5 rounded-md hover:bg-amber-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearChat(chatuser);
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
                      className="w-full flex gap-2 items-center text-black cursor-pointer py-1 bg-amber-100 p-2 mt-1.5 rounded-md hover:bg-amber-200"
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
                      <i class="bi bi-person-fill-slash"></i>
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
        <UnfriendModal
          isOpen={showUnfriendModal}
          unfrienduser={unFriendUser}
          onClose={() => {
            setshowUnfriendModal(false), setunFriendUser(null);
          }}
          refetch={fetchUsers}
        />
      </>
    );
  }
);

export default Sidebar;
