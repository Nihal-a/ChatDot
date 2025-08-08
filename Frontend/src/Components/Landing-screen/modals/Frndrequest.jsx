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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[50%] h-[70%] shadow-lg flex flex-col">
        <div className="flex justify-between items-center border-b pb-2 mb-4 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Make Circle Bigger!!
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-xl"
          >
            X
          </button>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="flex flex-col min-h-0">
            <p className="text-white dark:text-white text-2xl pb-3.5 flex-shrink-0">
              Friend Requests
            </p>
            <div
              className="flex-1 overflow-y-auto pt-3 px-3 rounded-md"
              style={{ scrollbarWidth: "none" }}
            >
              {friendRequests.map((req) => (
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
              ))}
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <div className="flex-shrink-0 mb-2">
              <div className="relative w-full ml-3">
                <p className="text-white dark:text-white text-2xl pb-3.5 flex-shrink-0">
                  Add Friends
                </p>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setsearch(e.target.value)}
                  placeholder="Search or find your friend"
                  className="w-[95%] py-2 ml-3 mb-2.5 pl-10 pr-4 text-sm rounded-md ring-1 ring-gray-300 focus:outline-none placeholder:text-gray-300 text-white"
                />
                <i className="bi bi-search absolute left-6 top-1.5 text-gray-500 text-md"></i>
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto pt-3 px-3 rounded-md ml-3"
              style={{ scrollbarWidth: "none" }}
            >
              {searchResults.map((user) => (
                <div
                  className="shadow-[0_4px_20px_rgba(255,255,255,0.1)]
                            hover:shadow-[0_6px_25px_rgba(255,255,255,0.15)]
                            transition-shadow duration-300 flex items-center justify-between w-full text-white rounded-md p-3 mb-4"
                >
                  {/* Avatar */}
                  <div className=" bg-gray-600 w-[50px] h-[50px] rounded-full overflow-hidden ml-3 flex-shrink-0 flex items-center justify-center">
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

                  {/* User Info */}
                  <div className="flex flex-col ml-6 flex-grow min-w-0 ">
                    <p className="truncate">{user.name}</p>
                    <p className="truncate">{user.username}</p>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col mr-3 gap-1 flex-shrink-0">
                    <button
                      className={`rounded-md py-0.5 px-2 ring-1 ${
                        user.is_friend
                          ? "ring-[#68479D] bg-[#68479D]"
                          : user.is_already_requested
                          ? "ring-red-500 bg-red-500"
                          : "ring-green-700 bg-green-700"
                      }  ${
                        user.is_friend
                          ? "hover:bg-[#68479D]"
                          : user.is_already_requested
                          ? "hover:bg-red-700 "
                          : "hover:bg-green-800 "
                      }  text-white text-sm font-medium  cursor-pointer`}
                      onClick={() => {
                        user.is_friend
                          ? ""
                          : user.is_already_requested
                          ? handleCancelRequest(user.id)
                          : handleaddfriend(user.id);
                      }}
                    >
                      {user.is_friend ? (
                        <> Already Friend</>
                      ) : user.is_already_requested ? (
                        <>
                          <i className="bi bi-x-circle-fill"></i> Cancel Request
                        </>
                      ) : (
                        <i className="bi bi-person-plus-fill"></i>
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
