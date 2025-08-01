import React from "react";
import { useSelector } from "react-redux";
import { VscSend } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { Logout } from "../Redux/Slice";
import { fetchWithAuth } from "../../utils";
import { format, parse, differenceInMinutes, isSameDay } from "date-fns";
import Cookies from "universal-cookie";
import Frndrequest from "./modals/frndrequest";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";

const ChatScreen = ({ selectedUser, onClose, onlatestMsg }) => {
  const { user } = useSelector((state) => state.chatdot);

  const [dropdown, setDropdown] = useState(false);
  const [msgalterdropdown, setmsgalterdropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const dropdownRef = useRef(null);
  const msgalterdropdownRef = useRef(null);

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
  const [msgAlterOptions, setmsgAlterOptions] = useState({
    msg_id: null,
    alterPermissible: true,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const [isEditingMsg, setisEditingMsg] = useState({
    edit: false,
    msgid: null,
  });

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

  const handleMsgOptions = (msgid) => {
    const entry = Object.entries(messages).find(([_, msgs]) =>
      msgs.some((msg) => msg.id === msgid)
    );

    if (!entry) return;

    const [date, msgs] = entry;
    const msg = msgs.find((m) => m.id === msgid);
    if (!msg) return;

    // Don't show options if user already deleted the message for themselves
    if (msg.is_deleted || msg.is_bothdeleted) {
      setmsgAlterOptions({
        msg_id: msgid,
        alterPermissible: false,
      });
      setmsgalterdropdown(true);
      return;
    }

    const msgTime = parse(
      `${date} ${msg.time}`,
      "dd MMMM yyyy hh:mm a",
      new Date()
    );
    const now = new Date();

    const canEditOrDeleteForEveryone =
      isSameDay(now, msgTime) && differenceInMinutes(now, msgTime) < 10;

    setmsgAlterOptions({
      msg_id: msgid,
      alterPermissible: canEditOrDeleteForEveryone,
    });
    console.log(canEditOrDeleteForEveryone);

    setTimeout(() => {
      const msgElement = document.getElementById(`msg-${msgid}`);
      if (msgElement) {
        const rect = msgElement.getBoundingClientRect();
        const screenHeight = window.innerHeight;

        if (rect.top > screenHeight * 0.65) {
          setDropdownPosition("top"); // Message near bottom → show dropdown above
        } else {
          setDropdownPosition("bottom"); // Message near top/mid → show dropdown below
        }
      }
    }, 0);

    setmsgalterdropdown(true);
  };

  const openDeleteModal = (msgId) => {
    setSelectedMsgId(msgId);
    setShowDeleteModal(true);
  };

  const deleteMessageBoth = (msgid) => {
    const payload = {
      type: "deleteBoth",
      id: msgid,
      user: user.username,
    };
    socketRef.current.send(JSON.stringify(payload));
  };

  const deleteMessageMe = (msgid) => {
    socketRef.current.send(
      JSON.stringify({
        type: "deleteMe",
        id: msgid,
        user: user.username,
      })
    );
  };

  const handleeditMsg = (msgid, msg) => {
    setinput(msg);
    setisEditingMsg({
      edit: true,
      msgid: msgid,
    });
    setmsgalterdropdown(false);
    return;
  };

  const editMsg = () => {
    if (input.trim() === "") return;
    socketRef.current.send(
      JSON.stringify({
        type: "edit",
        id: isEditingMsg.msgid,
        new_msg: input,
      })
    );
    setinput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setisEditingMsg({
      edit: false,
      msgid: null,
    });
  };

  const handleKeyDown = (e) => {
    if (isEditingMsg.edit == true) {
      if (e.key === "Enter") {
        if (e.shiftKey) {
          return;
        } else {
          e.preventDefault();
          editMsg();
        }
      }
    } else {
      if (e.key === "Enter") {
        if (e.shiftKey) {
          return;
        } else {
          e.preventDefault();
          sendMessage();
        }
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

    if (socketRef.current) {
      socketRef.current.close();
      console.log("Previous socket closed");
    }

    const socket = new WebSocket(
      `ws://192.168.18.144:8000/ws/chat/${roomName}/?token=${access}`
    );

    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📨 Received WebSocket data:", data);

      // 🔥 Handle seen status updates
      if (data.type === "seen") {
        console.log("Processing seen update:", data);

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

      if (data.type === "deleteMe") {
        const deletedMsgId = data.id;
        const deletedByUser = data.user;

        setmessages((prevMessages) => {
          const updatedMessages = {};

          for (const date in prevMessages) {
            const filtered = prevMessages[date].map((msg) => {
              const isDeletedBy = msg.is_deleted_by || []; // ensure it's an array

              return msg.id === deletedMsgId
                ? {
                    ...msg,
                    is_deleted_by: isDeletedBy.includes(deletedByUser)
                      ? isDeletedBy
                      : [...isDeletedBy, deletedByUser],
                  }
                : msg;
            });

            updatedMessages[date] = filtered;
          }

          return updatedMessages;
        });
      }

      if (data.type === "deleteBoth") {
        const deletedMsgId = data.id;
        const deletedByUser = data.user;
        console.log("🗑️ Deleting message in both with ID:", deletedMsgId);

        setmessages((prevMessages) => {
          const updatedMessages = {};

          for (const date in prevMessages) {
            const filtered = prevMessages[date].map((msg) =>
              msg.id === deletedMsgId
                ? {
                    ...msg,
                    is_bothdeleted: true,
                    is_bothdeleted_by: deletedByUser,
                  }
                : msg
            );

            updatedMessages[date] = filtered;
          }

          return updatedMessages;
        });

        return;
      }

      if (data.type === "edit") {
        const editedessageId = data.id;
        const new_msg = data.new_msg;
        console.log("🗑️ edit message with ID:", editedessageId);

        setmessages((prevMessages) => {
          const updatedMessages = {};

          for (const date in prevMessages) {
            const filtered = prevMessages[date].map((msg) =>
              msg.id === editedessageId
                ? {
                    ...msg,
                    is_edited: true,
                    message: new_msg,
                  }
                : msg
            );

            updatedMessages[date] = filtered;
          }

          return updatedMessages;
        });

        return;
      }

      // 🔥 Handle new messages
      if (data.type === "message" || !data.type) {
        const msgDate = new Date(data.datetime);
        const formattedDate = format(msgDate, "dd MMMM yyyy");
        const formattedTime = format(msgDate, "hh:mm a");

        const newMessage = {
          id: data.id,
          is_deleted_by: null,
          is_bothdeleted: false,
          is_bothdeleted_by: null,
          sender: data.sender,
          receiver: data.receiver,
          message: data.message,
          time: formattedTime,
          seen: false,
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

      if (data.type === "sidebar_update") {
        const updatedUser = data.data;
        console.log("sidebar update");
        // console.log(updatedUser);
        onlatestMsg(updatedUser);

        // Update the sidebar user info
        // setAllUser((prevUsers) => {
        //   const existing = prevUsers.find(
        //     (u) => u.username === updatedUser.username
        //   );

        //   if (existing) {
        //     return prevUsers.map((user) =>
        //       user.username === updatedUser.username
        //         ? { ...user, ...updatedUser }
        //         : user
        //     );
        //   } else {
        //     return [...prevUsers, updatedUser];
        //   }
        // });
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
        console.log(data);
        if (res.status === 200) {
          const formattedGroupedMessages = {};

          for (const date in data) {
            const messages = data[date];

            formattedGroupedMessages[date] = messages.map((msg) => {
              const timeObj = new Date(`2000-01-01T${msg.datetime}`);
              const formattedTime = format(timeObj, "hh:mm a");

              return {
                id: msg.id,
                is_active: msg.is_active,
                is_deleted: msg.is_deleted,
                is_deleted_by: msg.is_deleted_by,
                is_bothdeleted: msg.is_bothdeleted,
                is_bothdeleted_by: msg.is_bothdeleted_by,
                sender: msg.sender,
                receiver: msg.receiver,
                message: msg.message,
                time: formattedTime,
                seen: Boolean(msg.seen),
                is_edited: msg.is_edited,
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
      if (
        msgalterdropdownRef.current &&
        !msgalterdropdownRef.current.contains(e.target)
      ) {
        setmsgalterdropdown(false);
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
        ></div>
        <Frndrequest
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
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

              {msgs.map((msg, index) => {
                const isMe = msg.sender === user.username;
                const deletedForMe = msg.is_deleted_by?.includes(user.username);
                const deletedGlobally = msg.is_bothdeleted;
                const deletedGlobally_by = msg.is_bothdeleted_by;
                const edited = msg.is_edited;
                const is_active = msg.is_active;

                if (deletedForMe) return null;
                if (!is_active) return null;

                return (
                  <div
                    id={`msg-${msg.id}`}
                    key={index}
                    className={`relative w-fit min-w-[8%] max-w-[70%] px-2 py-1 pb-3.5 rounded-lg mb-1 ${
                      isMe
                        ? "bg-[#68479D] text-white self-end ml-auto group"
                        : "bg-white self-start group"
                    }`}
                  >
                    {/* Message text */}
                    <p className="whitespace-pre-wrap text-sm">
                      {deletedGlobally
                        ? deletedGlobally_by === user.username
                          ? "You deleted this message"
                          : "This message was deleted"
                        : msg.message}
                    </p>

                    {/* Options Dropdown (Sender & Receiver) */}
                    {!deletedGlobally && (
                      <div
                        className={`absolute top-0 ${
                          isMe ? "-left-[45px]" : "-right-[45px]"
                        } px-3 py-3 cursor-pointer`}
                      >
                        <div
                          className="invisible opacity-0 ring-1 px-1.5 rounded-full py-0 text-gray-400 text-xs group-hover:opacity-100 transition-opacity duration-150 delay-100 group-hover:visible"
                          onClick={() => handleMsgOptions(msg.id)}
                        >
                          <i className="bi bi-chevron-down"></i>
                        </div>

                        {msgalterdropdown &&
                          msgAlterOptions.msg_id === msg.id && (
                            <div
                              ref={msgalterdropdownRef}
                              className={`absolute z-10 w-50 bg-white rounded-lg shadow-lg p-2 ${
                                dropdownPosition === "top"
                                  ? isMe
                                    ? "bottom-0 mb-2 right-2"
                                    : "bottom-0 mb-2 left-2"
                                  : isMe
                                  ? "top-0 mt-0 right-2"
                                  : "top-0 mt-0 left-2"
                              }`}
                            >
                              {/* Sender options */}
                              {msgAlterOptions.alterPermissible && isMe && (
                                <>
                                  <div
                                    className="w-full flex gap-2 items-center text-black cursor-pointer py-1"
                                    onClick={() =>
                                      handleeditMsg(msg.id, msg.message)
                                    }
                                  >
                                    <i className="bi bi-pencil text-sm"></i>
                                    <p className="text-black text-sm">Edit</p>
                                  </div>
                                  <div
                                    className="w-full flex gap-2 items-center text-black border-b pb-1 py-1 cursor-pointer"
                                    onClick={() => openDeleteModal(msg.id)}
                                  >
                                    <i className="bi bi-trash text-sm"></i>
                                    <p className="text-black text-sm">
                                      Delete for everyone
                                    </p>
                                  </div>
                                </>
                              )}

                              {/* Both sender and receiver */}
                              <div
                                className="w-full flex gap-2 items-center text-black mt-1 cursor-pointer py-1"
                                onClick={() => deleteMessageMe(msg.id)}
                              >
                                <i className="bi bi-trash text-sm"></i>
                                <p className="text-black text-sm">
                                  Delete for me
                                </p>
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Time & Seen */}
                    <p
                      className={`absolute ${
                        isMe ? "right-5" : "right-2.5"
                      } bottom-0.5 text-[9px] text-gray-300`}
                    >
                      {msg.time}
                    </p>
                    <p className="absolute right-1.5 bottom-0 text-[10px] text-gray-300">
                      {isMe &&
                        (msg.seen ? (
                          <i className="bi bi-check2-all text-blue-400"></i>
                        ) : (
                          <i className="bi bi-check2"></i>
                        ))}
                    </p>
                    {edited && (
                      <p className="absolute right-16 bottom-0.5 text-[9px] text-gray-300">
                        <i className="bi bi-pencil"></i>
                      </p>
                    )}
                  </div>
                );
              })}
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
        <button onClick={isEditingMsg.edit ? editMsg : sendMessage}>
          <VscSend className="text-xl text-[#68479D]" />
        </button>

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={deleteMessageBoth}
          msgId={selectedMsgId}
        />
        <Frndrequest
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selecteduser={selecteduser}
        />
      </div>
    </>
  );
};

export default ChatScreen;
