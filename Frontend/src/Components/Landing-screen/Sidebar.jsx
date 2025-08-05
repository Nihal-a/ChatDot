import React, { useRef } from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchWithAuth } from "../../utils";
import { format } from "date-fns";
import Cookies from "universal-cookie";

const Sidebar = ({ onselectUser, latestMsg, onSidebarUpdate }) => {
  const [search, setSearch] = useState("");
  const [allusers, setAllUsers] = useState([]);
  const [isSelected, setisSelected] = useState();
  const [imageError, setImageError] = useState(false);
  const { user } = useSelector((state) => state.chatdot);
  const cookies = new Cookies();
  const access = cookies.get("access");

  // Remove WebSocket logic from here - it's now in Home component

  const handleselectedUser = (user) => {
    onselectUser(user);
    setisSelected(user.name);
  };

  // Handle latestMsg updates
  useEffect(() => {
    if (!latestMsg || !Array.isArray(latestMsg)) return;

    setAllUsers((prevList) => {
      let updatedList = [...prevList];

      latestMsg.forEach((newItem) => {
        const existingIndex = updatedList.findIndex(
          (item) => item.username === newItem.username
        );

        let formattedTime = "";
        if (newItem.last_message_time) {
          const msgDate = new Date(newItem.last_message_time);
          const now = new Date();

          const isToday =
            msgDate.getDate() === now.getDate() &&
            msgDate.getMonth() === now.getMonth() &&
            msgDate.getFullYear() === now.getFullYear();

          formattedTime = isToday
            ? format(msgDate, "hh:mm a")
            : format(msgDate, "dd MMM");
        }

        const enhancedItem = {
          ...newItem,
          formattedTime,
        };

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

  // Initial fetch of users
  useEffect(() => {
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
          setAllUsers(filteredUsers);
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

    if (access && user?.username) {
      fetchUsers();
    }
  }, [access, user?.username]);


  const profileUrl = user?.profile
    ? `http://192.168.18.144:8000${user.profile}`
    : "";

  // Filter users based on search
  const filteredUsers = allusers.filter(user =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

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
            className="w-full py-2 pl-10 pr-4 text-sm rounded-md ring-1 ring-gray-300 focus:ring-0 focus:outline-none"
          />
          <i className="bi bi-search absolute left-3 top-2.5 text-gray-500 text-md"></i>
        </div>
      </div>
      <div
        className="flex-grow overflow-y-auto scrollbar-hide px-4 pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {filteredUsers.map((user) => (
          <div
            className={`flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer ${
              isSelected === user.name ? "bg-gray-100" : ""
            }`}
            key={user.id}
            onClick={() => handleselectedUser(user)}
          >
            <div className="w-[60px] h-[50px] flex items-center justify-center bg-amber-100 text-xl font-bold rounded-full overflow-hidden">
              {!imageError && user?.profile ? (
                <img
                  src={`http://192.168.18.144:8000${user.profile}`}
                  alt="profile"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.username?.[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-col ">
                <p className="font-medium pb-1">{user.username} </p>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                  {user.last_message || "No messages yet"}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <p className="text-xs text-gray-400">{user.formattedTime}</p>
                {user.unseen_count > 0 && (
                  <span className="text-xs font-semibold text-white bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                    {user.unseen_count}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Sidebar;