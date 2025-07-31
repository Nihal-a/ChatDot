import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { fetchWithAuth } from "../../../utils";

const Frndrequest = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const { user } = useSelector((state) => state.chatdot);
  const [search, setsearch] = useState("");
  const [searchResults, setsearchResults] = useState([]);

  useEffect(() => {
    const searchuser = async () => {
      try {
        const res = await fetchWithAuth(
          "http://192.168.18.144:8000/api/search_users",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ search: search }),
          }
        );

        const data = await res.json();
        console.log(data);

        if (res.status === 200) {
          setsearchResults(data);
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

  console.log(search);
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
              <div
                className="shadow-[0_4px_20px_rgba(255,255,255,0.1)]
                            hover:shadow-[0_6px_25px_rgba(255,255,255,0.15)]
                            transition-shadow duration-300 flex items-center justify-between w-full text-white rounded-md p-3 mb-4"
              >
                {/* Avatar */}
                <div className="ring-1 w-[50px] h-[50px] rounded-full overflow-hidden ml-3 flex-shrink-0">
                  <img
                    src=""
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* User Info */}
                <div className="flex flex-col ml-4 flex-grow min-w-0">
                  <p className="truncate">Mohammed Nihal</p>
                  <p className="truncate">nihal</p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col mr-3 gap-1 flex-shrink-0">
                  <button className="rounded-md py-0.5 px-2 ring-1 ring-green-700 bg-green-700 text-white text-sm font-medium hover:bg-green-500 cursor-pointer">
                    CONFIRM
                  </button>
                  <button className="rounded-md py-0.5 px-2 ring-1 ring-red-700 bg-red-700 text-white text-sm font-medium hover:bg-red-500 cursor-pointer">
                    REJECT
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <div className="flex-shrink-0 mb-2">
              <div className="relative w-full ml-3">
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
              {/* {searchResults.map((user) => ( */}
              <div className="flex items-center justify-between w-full text-white ring-1 rounded-md p-3 mb-4">
                {/* Avatar */}
                <div className="ring-1 w-[50px] h-[50px] rounded-full overflow-hidden ml-3 flex-shrink-0">
                  <img
                    src=""
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* User Info */}
                <div className="flex flex-col ml-4 flex-grow min-w-0">
                  <p className="truncate">Mohammed Nihal</p>
                  <p className="truncate">nihal</p>
                </div>

                <button className="rounded-md py-0.5 px-2 ring-1 ring-[#68479D] bg-[#68479D] text-white text-sm font-medium hover:bg-[#7c62a5] flex-shrink-0">
                  CANCEL
                </button>
              </div>
              {/* ))} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Frndrequest;
