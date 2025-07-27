import React from "react";
import { useSelector } from "react-redux";
import { VscSend } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { Logout } from "../Redux/Slice";
import { fetchWithAuth } from "../../utils";
import { format } from "date-fns";
import Cookies from "universal-cookie";
import Frndrequest from "./modals/frndrequest";

const ChatScreen = ({ selectedUser, onClose }) => {
  const { user } = useSelector((state) => state.chatdot);

  const [dropdown, setDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const cookies = new Cookies();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [input, setinput] = useState("");
  const [messages, setmessages] = useState([]);
  const access = cookies.get("access");
  const socketRef = useRef(null);
  const messageEndRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const prevUserRef = useRef(null);
  const textareaRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sendMessage = () => {
    if (input.trim() === "") return;
    socketRef.current.send(
      JSON.stringify({
        type: "message",
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
        return;
      } else {
        e.preventDefault();
        sendMessage();
      }
    }
  };

  const handletextareaInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };

  const handleLogout = async () => {
    dispatch(Logout());
    try {
      await fetch("http://192.168.1.65:8000/api/logout", {
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

    console.log(`🔥 Connecting to WebSocket for room: ${roomName}`);
    if (socketRef.current) {
      socketRef.current.close();
      console.log("❌ Previous socket closed");
    }

    const socket = new WebSocket(
      `ws://192.168.1.65:8000/ws/chat/${roomName}/?token=${access}`
    );

    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📨 Received WebSocket data:", data);

      // 🔥 Handle seen status updates
      if (data.type === "seen") {
        console.log("👀 Processing seen update:", data);

        // Mark messages as seen in UI for the sender
        setmessages((prevMessages) => {
          const updated = { ...prevMessages };

          for (const date in updated) {
            updated[date] = updated[date].map((msg) => {
              // Mark messages sent by current user to the selected user as seen
              // when the selected user (data.seen_by) has seen them
              if (
                msg.sender === user.username &&
                msg.receiver === selectedUser.username &&
                data.seen_by === selectedUser.username &&
                data.message_sender === user.username
              ) {
                console.log("✅ Marking message as seen:", msg.message);
                return { ...msg, seen: true };
              }
              return msg;
            });
          }

          return updated;
        });

        return; // Done processing seen update
      }

      // 🔥 Handle new messages
      if (data.type === "message" || !data.type) {
        const msgDate = new Date(data.datetime);
        const formattedDate = format(msgDate, "dd MMMM yyyy");
        const formattedTime = format(msgDate, "hh:mm a");

        const newMessage = {
          sender: data.sender,
          receiver: data.receiver,
          message: data.message,
          time: formattedTime,
          seen: false, // Always start as false
        };

        console.log("📨 New message received:", newMessage);

        // Add new message to state
        setmessages((prevMessages) => {
          const updatedMessages = { ...prevMessages };

          if (updatedMessages[formattedDate]) {
            updatedMessages[formattedDate] = [
              ...updatedMessages[formattedDate],
              newMessage,
            ];
          } else {
            updatedMessages[formattedDate] = [newMessage];
          }

          return updatedMessages;
        });

        // 🔥 Auto-mark as seen if message is received from the selected user
        if (
          data.sender === selectedUser.username &&
          data.receiver === user.username
        ) {
          console.log(
            "👀 Auto-sending seen notification for message from",
            data.sender
          );

          // Small delay to ensure message is processed first
          setTimeout(() => {
            if (
              socketRef.current &&
              socketRef.current.readyState === WebSocket.OPEN
            ) {
              socketRef.current.send(
                JSON.stringify({
                  type: "seen",
                  sender: user.username, // who is marking as seen
                  receiver: data.sender, // whose messages are being marked as seen
                })
              );
            }
          }, 100);
        }
      }
    };

    socket.onopen = () => {
      console.log("✅ WebSocket connection opened");
      // The backend will automatically mark messages as seen on connect
      // No need to send manual seen notification here anymore
    };

    socket.onerror = (error) => {
      console.error("⚠️ WebSocket error", error);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        console.log("🧹 Cleanup: socket closed");
      }
    };
  }, [selectedUser, user.username]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setmessages([]);

      try {
        const res = await fetchWithAuth(
          "http://192.168.1.65:8000/api/get_messages",
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
          const formattedGroupedMessages = {};

          for (const date in data) {
            const messages = data[date];

            formattedGroupedMessages[date] = messages.map((msg) => {
              const timeObj = new Date(`2000-01-01T${msg.datetime}`);
              const formattedTime = format(timeObj, "hh:mm a");

              return {
                sender: msg.sender,
                receiver: msg.receiver,
                message: msg.message,
                time: formattedTime,
                seen: Boolean(msg.seen),
              };
            });
          }

          setmessages(formattedGroupedMessages);
          console.log("📚 Loaded messages:", formattedGroupedMessages);
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

  if (!selectedUser) {
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
          className="flex-grow overflow-y-auto scrollbar-hide px-4 py-3 space-y-2"
          style={{ scrollbarWidth: "none" }}
        ></div>
      </>
    );
  }

  return (
    <>
      <div className="h-[8%] flex items-center justify-end px-4 py-2 gap-4 bg-white border-b border-gray-200">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-0.5 rounded-md font-medium ring-1 ring-[#68479D] focus:outline-0 text-white font-[poppins] active:bg-[#7c62a5] bg-[#68479D]"
          type="button"
        >
          Add Friends
        </button>
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
        className="flex-grow overflow-y-auto scrollbar-hide px-4 py-3 space-y-2"
        style={{ scrollbarWidth: "none" }}
      >
        {loading && <div>Loading messages...</div>}

        {!loading && Object.keys(messages).length === 0 && (
          <div>No messages</div>
        )}

        {!loading &&
          Object.entries(messages).map(([date, msgs]) => (
            <div key={date}>
              <p className="text-center text-xs text-gray-400 my-3">{date}</p>
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
                  <p
                    className={`absolute ${
                      msg.sender === user.username ? "right-5 " : "right-2.5 "
                    } bottom-0.5 text-[9px] text-gray-300`}
                  >
                    {msg.time}
                  </p>
                  <p className="absolute right-1.5 bottom-0 text-[10px] text-gray-300">
                    {msg.sender === user.username ? (
                      <>
                        {msg.seen ? (
                          <i className="bi bi-check2-all text-blue-400"></i>
                        ) : (
                          <i className="bi bi-check2"></i>
                        )}
                      </>
                    ) : (
                      ""
                    )}
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
        <Frndrequest
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </>
  );
};

export default ChatScreen;
