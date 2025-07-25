import React from "react";
import { useSelector } from "react-redux";
import { VscSend } from "react-icons/vsc";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { Logout } from "../Redux/Slice";
import { fetchWithAuth } from "../../utils";
import {
  format,
  subDays,
  parse,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";

const ChatScreen = ({ selectedUser, onClose }) => {
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
  const textareaRef = useRef();
  const [liveDate, setliveDate] = useState({
    today: null,
    yesterday: null,
  });

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Let browser insert new line
        return;
      } else {
        e.preventDefault(); // Prevent new line
        sendMessage();
      }
    }
  };

  const handletextareaInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height
      textarea.style.height = textarea.scrollHeight + "px"; // Grow to fit content
    }
  };

  const handleLogout = async () => {
    dispatch(Logout());
    try {
      await fetch("http://192.168.18.144:8000/api/logout", {
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
      `ws://192.168.18.144:8000/ws/chat/${roomName}/?token=${access}`
    );
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const temp = format(data.datetime, "dd MMMM yyyy, hh:mm:ss");
      const msgingdatetime = parse(temp, "dd MMMM yyyy, hh:mm:ss", new Date());
      const today = new Date();
      const isToday = isWithinInterval(msgingdatetime, {
        start: startOfDay(today),
        end: endOfDay(today),
      });

      // const yesterday = subDays(now, 1);
      // const isYesterday = isWithinInterval(msgingdatetime, {    -------yesterday check idea
      //   start: startOfDay(yesterday),
      //   end: endOfDay(yesterday),
      // });

      const formattedTime = format(new Date(data.datetime), " hh:mm a");
      const formattedDate = format(new Date(data.datetime), "dd MMMM yyyy");
      setmessages((prev) => [
        ...prev,
        {
          sender: data.sender,
          receiver: data.receiver,
          message: data.message,
          date: formattedDate,
          time: formattedTime,
        },
      ]);
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
          "http://192.168.18.144:8000/api/get_messages",
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
        console.log("oooooooookkkkkkkkkk:", data);

        if (res.status === 200) {
          const formattedGroupedMessages = {};

          for (const date in data) {
            const messages = data[date];

            formattedGroupedMessages[date] = messages.map((msg) => {
              // Combine dummy date to parse time
              const timeObj = new Date(`2000-01-01T${msg.datetime}`);
              const formattedTime = format(timeObj, "hh:mm a");

              return {
                sender: msg.sender,
                receiver: msg.receiver,
                message: msg.message,
                time: formattedTime,
              };
            });
          }

          setmessages(formattedGroupedMessages);
          console.log("Formatted grouped messages:", formattedGroupedMessages);
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

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  console.log(messages);

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

  return (
    <>
      <div className="h-[8%] flex items-center justify-end px-4 py-2 gap-4 bg-white border-b border-gray-200">
        <i className="bi bi-bell text-xl"></i>
        {/* <p>{time}</p> */}
        {/* <p>{time.format("hh:mm:ss A")}</p> 
        <p>{time.format("MMMM Do, YYYY")}</p>  */}

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
        className=" flex-grow overflow-y-auto  scrollbar-hide px-4 py-3 space-y-2"
        style={{ scrollbarWidth: "none" }}
      >
        {loading && <div>Loading messages...</div>}

        {!loading && Object.keys(messages).length === 0 && (
          <div>No messages</div>
        )}

        {!loading &&
          Object.entries(messages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date heading */}
              <p className="text-center text-xs text-gray-400 my-3">{date}</p>

              {/* Messages for this date */}
              {msgs.map((msg, index) => (
                <div
                  key={index}
                  className={`relative w-fit min-w-[8%] max-w-[70%] px-2 py-1 pb-3.5 rounded-lg mb-1 ${
                    msg.sender === user.username
                      ? "bg-[#68479D] text-white self-end ml-auto"
                      : "bg-white self-start"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                  <p className="absolute right-1.5 bottom-1 text-[10px] text-gray-300">
                    {msg.time}
                  </p>
                </div>
              ))}
            </div>
          ))}

        <div ref={messageEndRef} />
      </div>
      <div className="h-[8%] flex items-center justify-between px-4 py-3 bg-white border-t rounded-t-xl border-gray-200 max-h-32">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setinput(e.target.value);
            handletextareaInput();
          }}
          onKeyDown={handleKeyDown}
          className="w-[97%] py-2.5 px-4 text-sm rounded-xl focus:ring-0 focus:outline-none bg-gray-100 resize-none overflow-y-auto max-h-32"
          rows={1}
        />
        <button onClick={sendMessage}>
          <VscSend className="text-xl text-[#68479D]" />
        </button>
      </div>
    </>
  );
};

export default ChatScreen;
