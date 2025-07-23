import React from "react";
import { useSelector } from "react-redux";
import { VscSend } from "react-icons/vsc";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { Logout } from "../Redux/Slice";
import { fetchWithAuth } from "../../utils";

const ChatScreen = ({ selectedUser }) => {
  const { user } = useSelector((state) => state.chatdot);
  const [dropdown, setDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const cookies = new Cookies();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [input, setinput] = useState();
  const [messages, setmessages] = useState([]);
  const access = cookies.get("access");
  const socketRef = useRef(null);
  const messageEndRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const prevUserRef = useRef(null);

  console.log(`selectedUser: ${selectedUser?.username}`);
  console.log(`user.username: ${user?.username}`);

  const sendMessage = () => {
    if (input.trim() === "") return;

    socketRef.current.send(
      JSON.stringify({
        sender: user.username,
        message: input,
        rec: selectedUser.username,
      })
    );

    setinput("");
  };

  const handleLogout = async () => {
    dispatch(Logout());
    try {
      await fetch("http://localhost:8000/api/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }
    cookies.remove("access");
    navigate("/signin");
  };

  useEffect(() => {
    if (!selectedUser) return;

    const roomName = [user.username, selectedUser.username].sort().join("_");

    console.log(`Connecting to WebSocket for room: ${roomName}`);

    const socket = new WebSocket(
      `ws://localhost:8000/ws/chat/${roomName}/?token=${access}`
    );
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setmessages((prev) => [...prev, data]);
    };

    socket.onopen = () => console.log("WebSocket Connected");
    socket.onclose = () => console.log("WebSocket Disconnected");

    return () => {
      socket.close();
    };
  }, [selectedUser]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setmessages([]); // Clear previous messages (optional UX improvement)

      try {
        const res = await fetchWithAuth(
          "http://localhost:8000/api/get_messages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: user.username,
              receiver: selectedUser.username,
            }),
          }
        );

        const data = await res.json();

        if (res.status === 200) {
          setmessages(data.messages);
        } else {
          console.error(
            "Failed to fetch messages:",
            data.detail || res.statusText
          );
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedUser && selectedUser.username !== prevUserRef.current) {
      fetchMessages();
      prevUserRef.current = selectedUser.username;
    }
  }, [selectedUser, user.username]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage(); // 🔄 Clear input
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selectedUser) {
    return (
      <>
        {" "}
        <div className="h-[8%] flex items-center justify-end px-4 py-2 gap-4 bg-white border-b border-gray-200">
          <i className="bi bi-bell text-xl"></i>
          <div
            onClick={() => setDropdown(!dropdown)}
            className="w-[40px] h-[40px] rounded-full bg-white ring-1 ring-[#68479D] overflow-hidden cursor-pointer"
          >
            {user?.profile ? (
              <img
                src={user.profile}
                alt="profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 animate-pulse" />
            )}
          </div>
          {dropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-12 right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-10"
            >
              <button
                onClick={() => navigate("/profile")}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
        <div
          className="flex-grow overflow-y-auto  scrollbar-hide px-4 py-3 space-y-2"
          style={{ scrollbarWidth: "none" }}
        ></div>
      </>
    );
  }

  console.log(messages);
  return (
    <>
      <div className="h-[8%] flex items-center justify-end px-4 py-2 gap-4 bg-white border-b border-gray-200">
        <i className="bi bi-bell text-xl"></i>
        <div
          onClick={() => setDropdown(!dropdown)}
          className="w-[40px] h-[40px] rounded-full bg-white ring-1 ring-[#68479D] overflow-hidden cursor-pointer"
        >
          {user?.profile ? (
            <img
              src={user.profile}
              alt="profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 animate-pulse" />
          )}
        </div>
        {dropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-12 right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-10"
          >
            <button
              onClick={() => navigate("/profile")}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <div
        className="flex-grow overflow-y-auto  scrollbar-hide px-4 py-3 space-y-2"
        style={{ scrollbarWidth: "none" }}
      >
        {loading && <div>Loading messages...</div>}
        {messages.length === 0 && !loading && <div>No messages</div>}
        {messages.map((msg, index) => (
          <div
            // key={i}
            // className={`w-fit max-w-[70%] px-4 py-2 rounded-lg ${
            //   // i % 2 === 0
            //   //   ? "bg-white self-start":
            //   "bg-[#68479D] text-white self-end ml-auto"
            // }`}
            className={`w-fit max-w-[70%] px-4 py-2 rounded-lg ${
              msg.sender === user.username
                ? "bg-[#68479D] text-white self-end ml-auto"
                : "bg-white self-start"
            }`}
          >
            {msg.message}
          </div>
        ))}

        <div ref={messageEndRef} />
      </div>
      <div className="h-[8%] flex items-center justify-between px-4 py-3 bg-white border-t rounded-t-xl border-gray-200">
        <input
          type="text"
          value={input}
          onKeyDown={handleKeyDown}
          onChange={(e) => setinput(e.target.value)}
          placeholder="Type a message"
          className="w-[97%] py-2.5 px-4 text-sm rounded-full focus:ring-0 focus:outline-none bg-gray-100"
        />
        <button onClick={sendMessage}>
          <VscSend className="text-xl text-[#68479D]" />
        </button>
      </div>
    </>
  );
};

export default ChatScreen;
