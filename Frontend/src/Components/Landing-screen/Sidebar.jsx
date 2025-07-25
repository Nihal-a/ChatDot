import React, { use } from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchWithAuth } from "../../utils";

const Sidebar = ({ onselectUser}) => {
  const [search, setSearch] = useState("");
  const [allusers, setAllUsers] = useState([]);
  const [isSelected, setisSelected] = useState();
  const [imageError, setImageError] = useState(false);

  const { user } = useSelector((state) => state.chatdot);

  const handleselectedUser = (user) => {
    onselectUser(user);
    setisSelected(user.name);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetchWithAuth(
          "http://192.168.18.144:8000/api/get_users",
          {
            method: "GET",
          }
        );
        const data = await res.json();

        if (res.status === 200) {
          const filteredUsers = data.users.filter(
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

    fetchUsers();
  }, []);

  const profileUrl = user?.profile
    ? `http://192.168.18.144:8000${user.profile}`
    : "";

  const handleImageError = () => {
    setImageError(true);
  };

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
        {allusers.map((user) => (
          <div
            className={`flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer ${
              isSelected === user.name ? "bg-gray-100" : ""
            }`}
            key={user.name}
            onClick={() => handleselectedUser(user)}
          >
            <div className="w-[60px] h-[50px] flex items-center justify-center bg-amber-100 text-xl font-bold rounded-full overflow-hidden">
              {!imageError && user?.profile ? (
                <img
                  src={profileUrl}
                  alt="profile"
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.username?.[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-col">
                <p className="font-medium">{user.username} </p>
                <p className="text-xs text-gray-500">Last message</p>
              </div>
              <p className="text-xs text-gray-400">12:00</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
