import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { fetchWithAuth } from "../../../utils";

const Frndrequest = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  const [search, setsearch] = useState("");
  const [searchResults, setsearchResults] = useState([]);
  const [friendRequests, setfriendRequests] = useState([]);
  const { user } = useSelector((state) => state.chatdot);

  const handleaddfriend = async (to_id) => {
    try {
      const res = await fetchWithAuth(
        "http://192.168.18.144:8000/api/add_friend",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from: user.id, to: to_id }),
        }
      );

      if (res.status === 200) {
        setsearchResults((prev) =>
          prev.map((user) =>
            user.id === to_id ? { ...user, is_already_requested: true } : user
          )
        );
      } else {
        console.error("Failed to add friends:", data.detail || res.statusText);
      }
    } catch (error) {
      console.error("Error add friend:", error);
    }
  };

  const handleCancelRequest = async (to_id) => {
    try {
      const res = await fetchWithAuth(
        "http://192.168.18.144:8000/api/cancel_friend_request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from: user.id, to: to_id }),
        }
      );

      if (res.status === 200) {
        setsearchResults((prev) =>
          prev.map((user) =>
            user.id === to_id ? { ...user, is_already_requested: false } : user
          )
        );
      } else {
        console.error("Failed to cancel req :", data.detail || res.statusText);
      }
    } catch (error) {
      console.error("Error cancel request:", error);
    }
  };

  const get_all_request = async () => {
    try {
      const res = await fetchWithAuth(
        "http://192.168.18.144:8000/api/get_all_request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user: user.id }),
        }
      );

      const data = await res.json();

      if (res.status === 200) {
        setfriendRequests(data.requests);
      } else {
        console.error("Failed to add friends:", data.detail || res.statusText);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleConfirmReq = async (id) => {
    try {
      const res = await fetchWithAuth(
        "http://192.168.18.144:8000/api/confirm_request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ req_id: id }),
        }
      );

      if (res.status === 200) {
        get_all_request();
        onAccept;
      } else {
        console.error("Failed to confirm req :", data.detail || res.statusText);
      }
    } catch (error) {
      console.error("Error confirm request:", error);
    }
  };

  const handleCancelmReq = async (id) => {
    try {
      const res = await fetchWithAuth(
        "http://192.168.18.144:8000/api/reject_req",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ req_id: id }),
        }
      );

      if (res.status === 200) {
        get_all_request();
      } else {
        console.error("Failed to reject req :", data.detail || res.statusText);
      }
    } catch (error) {
      console.error("Error reject request:", error);
    }
  };

  useEffect(() => {
    get_all_request();
  }, []);

  useEffect(() => {
    const searchuser = async () => {
      // if (input.trim() === ""){
      //   setsearchResults
      //   return} ;
      try {
        const res = await fetchWithAuth(
          "http://192.168.18.144:8000/api/search_users",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ search: search, from: user.id }),
          }
        );

        const data = await res.json();
        console.log(data.results, "result of search");

        if (res.status === 200) {
          setsearchResults(data.results);
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

    searchuser();
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col md:w-[45%] md:h-[60%] w-[90%] h-[60%] ">
        <div className="flex justify-between items-center border-b border-dashed pb-2 mb-4 flex-shrink-0">
          <h3 className="text-[16px]  font-bold font-[poppins]  text-black">
            FIND FRIENDS
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-xl cursor-pointer"
          >
            <i class="bi bi-x text-2xl text-black"></i>
          </button>
        </div>
        <div className="flex-1 grid md:grid-cols-2 gap-4 min-h-2 ">
          <div className="flex flex-col min-h-0">
            <p className="text-black dark:text-white text-[16px]  pb-3.5 flex-shrink-0">
              FRIEND REQUESTS
            </p>
            <div
              className="flex-1 overflow-y-auto pt-3 px-3 rounded-md"
              style={{ scrollbarWidth: "none" }}
            >
              {friendRequests.length > 0 ? (
                friendRequests.map((req) => (
                  <div
                    key={req.req_id}
                    className="shadow-[0_4px_20px_rgba(255,255,255,0.1)]
                            hover:shadow-[0_6px_25px_rgba(255,255,255,0.15)]
                            transition-shadow duration-300 flex items-center justify-between w-full text-white rounded-md p-3 mb-4"
                  >
                    <div className="ring-1 w-[50px] h-[50px] rounded-full overflow-hidden ml-3 flex-shrink-0 flex items-center justify-center">
                      {req?.profile ? (
                        <img
                          src={`http://192.168.18.144:8000${req.profile}`}
                          alt="profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-semibold text-lg">
                          {req?.name?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex flex-col ml-4 flex-grow min-w-0">
                      <p className="truncate">{req.name}</p>
                      <p className="truncate">{req.username}</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col mr-3 gap-1 flex-shrink-0">
                      <button
                        className="rounded-md py-0.5 px-2 ring-1 ring-green-700 bg-green-700 text-white text-sm font-medium hover:bg-green-500 cursor-pointer"
                        onClick={() => handleConfirmReq(req.req_id)}
                      >
                        CONFIRM
                      </button>
                      <button
                        className="rounded-md py-0.5 px-2 ring-1 ring-red-700 bg-red-700 text-white text-sm font-medium hover:bg-red-500 cursor-pointer"
                        onClick={() => handleCancelmReq(req.req_id)}
                      >
                        REJECT
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No friend requests yet.</p>
              )}
            </div>
          </div>
          <div className="flex flex-col m bg-[#FAFAFA] rounded-2xl p-3 w-full ">
            <div className="flex-shrink-0 mb-2 flex justify-start min-w-full">
              <div className="relative w-full">
                <p className="text-[16px] font-bold font-[poppins] py-3.5 flex-shrink-0 ml-3">
                  ADD FRIENDS
                </p>
                <div className="relative w-full">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setsearch(e.target.value)}
                    placeholder="Search or find your friend"
                    className="w-full py-2 md:pl-8 pl-2 pr-4 text-sm rounded-md ring-1 ring-gray-300  focus:outline-none"
                  />
                  <i className="bi bi-search hidden md:block absolute left-[10px] top-[50%] translate-y-[-50%] text-[14px] text-black"></i>
                </div>
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto mt-3 rounded-md p-4"
              style={{ scrollbarWidth: "none" }}
            >
              {searchResults.map((user) => (
                <div
                  className="shadow-[0_4px_20px_rgba(255,255,255,0.1)]
                            hover:shadow-[0_6px_25px_rgba(255,255,255,0.15)]
                            transition-shadow duration-300 flex items-center justify-between w-full text-black rounded-md  mb-4"
                >
                  {/* Avatar */}
                  <div className="hidden  bg-gray-600 w-[45px] h-[45px] rounded-full overflow-hidden flex-shrink-0 md:flex items-center justify-center">
                    {user?.profile ? (
                      <img
                        src={`http://192.168.18.144:8000${user.profile}`}
                        alt="profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-semibold text-lg">
                        {user?.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col mx-2.5 flex-grow min-w-0 ">
                    <p className="truncate  font-semibold text-[14px]">
                      {user.name}
                    </p>
                    <p className="hidden md:block font-normal text-[12px]">
                      @{user.username}
                    </p>
                  </div>

                  <div className="flex flex-col mr-3 gap-1 flex-shrink-0">
                    <button
                      className={`rounded-md py-0.5 px-2 ring-1 ${
                        user.is_friend
                          ? "ring-[#68479D] bg-[#68479D] "
                          : user.is_already_requested
                          ? "ring-red-500 bg-red-500"
                          : "ring-green-700 bg-green-700"
                      }  ${
                        user.is_friend
                          ? "hover:bg-[#68479D]"
                          : user.is_already_requested
                          ? "hover:bg-red-700 "
                          : "hover:bg-green-800 "
                      }  text-white md:text-sm text-xs font-medium  cursor-pointer`}
                      onClick={() => {
                        user.is_friend
                          ? ""
                          : user.is_already_requested
                          ? handleCancelRequest(user.id)
                          : handleaddfriend(user.id);
                      }}
                    >
                      {user.is_friend ? (
                        <i class="bi bi-person-check-fill"></i>
                      ) : user.is_already_requested ? (
                        <>
                          <i class="bi bi-person-dash-fill"></i>
                        </>
                      ) : (
                        <i class="bi bi-person-plus-fill"></i>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Frndrequest;
