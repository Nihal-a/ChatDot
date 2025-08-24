import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { VscSend } from "react-icons/vsc";
import { PiMicrophoneLight } from "react-icons/pi";
import { PiMicrophoneFill } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { Logout } from "../Redux/Slice";
import { fetchWithAuth } from "../../utils";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import {
  format,
  parse,
  differenceInMinutes,
  isSameDay,
  isToday,
  isYesterday,
} from "date-fns";

import Cookies from "universal-cookie";
import Frndrequest from "./modals/Frndrequest";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import ProfileView from "./modals/ProfileView";
import ImageViewModal from "./modals/ImageViewModal";

const ChatScreen = forwardRef(
  (
    { selectedUser, onClose, onlatestMsg, updateselectUser, callgetUsers },
    ref
  ) => {
    const [dropdown, setDropdown] = useState(false);
    const [msgalterdropdown, setmsgalterdropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState("bottom");
    const [profileUser, setProfileUser] = useState(null);
    const [showProfileView, setshowProfileView] = useState(false);
    const [input, setinput] = useState("");
    const [messages, setmessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showImageViewModal, setshowImageViewModal] = useState(false);
    const [recording, setRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [showImageUrl, setshowImageUrl] = useState({});
    const [selectedMsgId, setSelectedMsgId] = useState(null);
    const [ModalMsg, setModalMsg] = useState(null);
    const [deleteType, setDeleteType] = useState(null);
    const [mainPreviewImage, setmainPreviewImage] = useState(null);
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [CurrentIndex, setCurrentIndex] = useState(0);
    const [sendingFileType, setsendingFileType] = useState(null);
    const [attachmentMenu, setattachmentMenu] = useState(false);
    const [msgAlterOptions, setmsgAlterOptions] = useState({
      msg_id: null,
      alterPermissible: true,
    });
    const [isEditingMsg, setisEditingMsg] = useState({
      edit: false,
      msgid: null,
    });

    const { user } = useSelector((state) => state.chatdot);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const cookies = new Cookies();
    const access = cookies.get("access");

    const dropdownRef = useRef(null);
    const msgalterdropdownRef = useRef(null);
    const imageFileInputRef = useRef(null);
    const videoFileInputRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    const socketRef = useRef(null);
    const messageEndRef = useRef(null);
    const prevUserRef = useRef(null);
    const textareaRef = useRef();
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const handleMsgOptions = (msgid) => {
      const entry = Object.entries(messages).find(([_, msgs]) =>
        msgs.some((msg) => msg.id === msgid)
      );

      if (!entry) return;

      const [date, msgs] = entry;
      const msg = msgs.find((m) => m.id === msgid);
      if (!msg) return;
      if (msg.is_deleted || msg.is_bothdeleted) {
        setmsgAlterOptions({
          msg_id: msgid,
          alterPermissible: false,
        });
        setmsgalterdropdown(true);
        return;
      }

      const now = new Date();

      if (date === "Today") {
        const todayStr = format(now, "dd MMMM yyyy");

        const msgTime = parse(
          `${todayStr} ${msg.time}`,
          "dd MMMM yyyy hh:mm a",
          new Date()
        );
        console.log(todayStr);
        const canEditOrDeleteForEveryone =
          isSameDay(now, msgTime) && differenceInMinutes(now, msgTime) < 10;

        setmsgAlterOptions({
          msg_id: msgid,
          alterPermissible: canEditOrDeleteForEveryone,
        });
      } else {
        const msgTime = parse(
          `${date} ${msg.time}`,
          "dd MMMM yyyy hh:mm a",
          new Date()
        );

        const canEditOrDeleteForEveryone =
          isSameDay(now, msgTime) && differenceInMinutes(now, msgTime) < 10;

        setmsgAlterOptions({
          msg_id: msgid,
          alterPermissible: canEditOrDeleteForEveryone,
        });
        console.log(canEditOrDeleteForEveryone);
      }

      setTimeout(() => {
        const msgElement = document.getElementById(`msg-${msgid}`);
        if (msgElement) {
          const rect = msgElement.getBoundingClientRect();
          const screenHeight = window.innerHeight;

          if (rect.top > screenHeight * 0.65) {
            setDropdownPosition("top");
          } else {
            setDropdownPosition("bottom");
          }
        }
      }, 0);

      setmsgalterdropdown(true);
    };

    const startRecording = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(
          "Microphone not supported on this device/browser or permission denied"
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          // Save blob so we can process/send it
          setAudioUrl(audioBlob);
          const fileName = `voice_${user.username}_${Date.now()}.webm`;
          // Convert to Base64 and send
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = reader.result;
            socketRef.current.send(
              JSON.stringify({
                type: "voice",
                sender: user.username,
                rec: selectedUser.username,
                filename: fileName,
                audio: base64Audio,
              })
            );
          };
          reader.readAsDataURL(audioBlob);
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (err) {
        console.error("Mic permission or recording failed:", err);
      }
    };

    const stopRecording = () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setRecording(false);
      }
    };

    const sendMessage = () => {
      if (input.trim() === "") return;

      console.log("🚀 Sending message:", input);

      socketRef.current.send(
        JSON.stringify({
          type: "message",
          sender: user.username,
          message: input.trim(),
          rec: selectedUser.username,
        })
      );

      setinput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    };

    const sendImage = () => {
      if (!socketRef) {
        console.log("Socket not ready!");
        return;
      }

      files.forEach((file) => {
        const reader = new FileReader();

        reader.onload = () => {
          const base64data = reader.result;
          console.log("Sending", file.name, "length:", base64data.length);

          socketRef.current.send(
            JSON.stringify({
              type: "images",
              sender: user.username,
              rec: selectedUser.username,
              filename: file.name,
              images: base64data,
            })
          );
        };

        reader.readAsDataURL(file);
      });

      setPreviews([]);
      setFiles([]);
    };

    const sendVideo = () => {
      if (!socketRef) {
        console.log("Socket not ready!");
        return;
      }

      files.forEach((file) => {
        const reader = new FileReader();

        reader.onload = () => {
          const base64data = reader.result;
          console.log("Sending", file.name, "length:", base64data.length);

          socketRef.current.send(
            JSON.stringify({
              type: "video",
              sender: user.username,
              rec: selectedUser.username,
              filename: file.name,
              video: base64data,
            })
          );
        };

        reader.readAsDataURL(file);
      });

      setPreviews([]);
      setFiles([]);
    };

    const openImageViewModal = (imgurl, format) => {
      setshowImageUrl({ url: imgurl, format: format });
      setshowImageViewModal(true);
    };

    const openDeleteModal = (msgId, type) => {
      console.log(type);
      setModalMsg(type);
      setSelectedMsgId(msgId);
      setDeleteType(type);
      setShowDeleteModal(true);
    };

    const handleDelete = () => {
      if (deleteType === "me") {
        deleteMessageMe(selectedMsgId);
      } else if (deleteType === "both") {
        deleteMessageBoth(selectedMsgId);
      }
      setShowDeleteModal(false);
    };

    const handleShowProfile = (e, user) => {
      e.stopPropagation();
      setProfileUser(user);
      setshowProfileView(true);
    };

    const handleCloseProfile = () => {
      console.log("Closing profile modal");
      setshowProfileView(false);
      setProfileUser(null);
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

    const clearChat = () => {
      socketRef.current.send(
        JSON.stringify({
          type: "clearchat",
          time: new Date().toISOString(),
          user: user.username,
          to: selectedUser.username,
        })
      );
    };

    const handleunBlock = () => {
      socketRef.current.send(
        JSON.stringify({
          type: "unblock",
          user: user.username,
          to: selectedUser.username,
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
          new_msg: input.trim(),
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

    const triggerImageFileInput = () => {
      setsendingFileType("image");
      imageFileInputRef.current.click();
    };
    const triggerVideoFileInput = () => {
      setsendingFileType("video");
      videoFileInputRef.current.click();
    };

    const handleFileChange = (e) => {
      const selectedFiles = Array.from(e.target.files);

      if (sendingFileType === "image") {
        const newPreviews = selectedFiles.map((file) => ({
          file: file,
          url: URL.createObjectURL(file), // preview for image
          type: "image",
        }));

        setFiles((prev) => {
          const updated = [...prev, ...selectedFiles];
          setCurrentIndex(updated.length - 1);
          return updated;
        });

        setPreviews((prev) => [...prev, ...newPreviews]);
        setmainPreviewImage(URL.createObjectURL(selectedFiles[0]));
      } else if (sendingFileType === "video") {
        const newPreviews = selectedFiles.map((file) => ({
          file: file,
          url: URL.createObjectURL(file),
          type: "video",
        }));

        setFiles((prev) => {
          const updated = [...prev, ...selectedFiles];
          setCurrentIndex(updated.length - 1);
          return updated;
        });

        setPreviews((prev) => [...prev, ...newPreviews]);
        setmainPreviewImage(URL.createObjectURL(selectedFiles[0]));
      }
    };

    const removeImage = () => {
      if (previews.length === 0) return;

      const removed = previews[CurrentIndex];
      URL.revokeObjectURL(removed.url);

      const newPreviews = previews.filter((_, i) => i !== CurrentIndex);
      const newFiles = files.filter((_, i) => i !== CurrentIndex);

      setPreviews(newPreviews);
      setFiles(newFiles);

      let newIndex = CurrentIndex;
      if (newIndex >= newPreviews.length) {
        newIndex = newPreviews.length - 1;
      }
      setCurrentIndex(newIndex);

      if (newPreviews.length > 0) {
        setmainPreviewImage(newPreviews[newIndex].url);
      } else {
        setmainPreviewImage(null);
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

    const scrollToBottom = useCallback(() => {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }, []);

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
        if (
          attachmentMenu &&
          attachmentMenuRef.current &&
          !attachmentMenuRef.current.contains(e.target)
        ) {
          setattachmentMenu(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

        if (data.type === "error") {
          console.error("❌ WebSocket error:", data.message);
          return;
        }

        if (data.type === "seen") {
          console.log("Processing seen update:", data);

          setmessages((prevMessages) => {
            const updated = { ...prevMessages };

            for (const date in updated) {
              updated[date] = updated[date].map((msg) => {
                if (
                  msg.sender === user.username &&
                  msg.receiver === selectedUser.username &&
                  data.seen_by === selectedUser.username &&
                  data.message_sender === user.username &&
                  !msg.is_ghost
                ) {
                  return { ...msg, seen: true };
                }
                return msg;
              });
            }

            return updated;
          });

          return;
        }

        if (data.type === "block") {
          console.log("🚫 Block notification received");
          updateselectUser({
            ...selectedUser,
            is_blocked_by: selectedUser.is_blocked_by.includes(user.username)
              ? selectedUser.is_blocked_by
              : [...selectedUser.is_blocked_by, user.username],
          });
        }

        if (data.type === "unblock") {
          console.log("✅ Unblock notification received");
          updateselectUser({
            ...selectedUser,
            is_blocked_by: selectedUser.is_blocked_by.filter(
              (u) => u !== user.username
            ),
          });
        }

        if (data.type === "deleteMe") {
          const deletedMsgId = data.id;
          const deletedByUser = data.user;

          setmessages((prevMessages) => {
            const updatedMessages = {};

            for (const date in prevMessages) {
              const filtered = prevMessages[date].map((msg) => {
                const isDeletedBy = msg.is_deleted_by || [];

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

          return;
        }

        if (data.type === "clearchat") {
          const clearTime = new Date(data.clear_time);
          const clearUser = data.user;
          console.log("🧹 Clear chat:", clearTime, clearUser);

          setmessages((prevMessages) => {
            const updated = {};

            for (const date in prevMessages) {
              const updatedMessages = prevMessages[date].map((msg) => {
                const isClearedBy = msg.is_cleared_by || [];

                if (!isClearedBy.includes(clearUser)) {
                  return {
                    ...msg,
                    is_cleared_by: [...isClearedBy, clearUser],
                  };
                }

                return msg;
              });

              updated[date] = updatedMessages;
            }

            return updated;
          });

          return;
        }

        if (data.type === "deleteBoth") {
          const deletedMsgId = data.id;
          const deletedByUser = data.user;
          console.log("🗑️ Deleting message for both with ID:", deletedMsgId);

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
          const editedMessageId = data.id;
          const new_msg = data.new_msg;
          console.log("✏️ Edit message with ID:", editedMessageId);

          setmessages((prevMessages) => {
            const updatedMessages = {};

            for (const date in prevMessages) {
              const filtered = prevMessages[date].map((msg) =>
                msg.id === editedMessageId
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

        if (data.type === "sidebar_update") {
          onlatestMsg(data.data);
        }

        if (data.type === "message" || !data.type) {
          console.log("📨 Processing new message:", data);

          if (!data.datetime || !data.sender || !data.message) {
            console.error("❌ Invalid message data:", data);
            return;
          }

          const msgDate = new Date(data.datetime);
          const formattedDate = format(msgDate, "dd MMMM yyyy");
          const formattedTime = format(msgDate, "hh:mm a");

          const newMessage = {
            id: data.id || Date.now(),
            is_deleted_by: null,
            is_bothdeleted: false,
            is_bothdeleted_by: false,
            sender: data.sender,
            receiver:
              data.receiver ||
              (data.sender === user.username
                ? selectedUser.username
                : user.username),
            message: data.message,
            format: data.format,
            time: formattedTime,
            seen: data.seen || false,
            is_edited: false,
            is_ghost: data.is_ghost || false,
          };

          console.log("📨 New message to add:", newMessage);

          setmessages((prevMessages) => {
            console.log("📚 Previous messages:", prevMessages);

            let groupKey;
            if (isToday(msgDate)) {
              groupKey = "Today";
            } else if (isYesterday(msgDate)) {
              groupKey = "Yesterday";
            } else {
              groupKey = formattedDate;
            }

            const updatedMessages = { ...prevMessages };

            if (updatedMessages[groupKey]) {
              const messageExists = updatedMessages[groupKey].some(
                (msg) => msg.id === newMessage.id
              );

              if (!messageExists) {
                updatedMessages[groupKey] = [
                  ...updatedMessages[groupKey],
                  newMessage,
                ];
              }
            } else {
              updatedMessages[groupKey] = [newMessage];
            }

            console.log("✅ Updated messages:", updatedMessages);
            setTimeout(() => scrollToBottom(), 0);
            return updatedMessages;
          });

          if (
            data.sender === selectedUser.username &&
            (data.receiver === user.username || !data.receiver) &&
            !data.is_ghost &&
            !selectedUser.is_blocked_by?.includes(data.sender)
          ) {
            console.log(
              "👀 Auto-sending seen notification for message from",
              data.sender
            );

            setTimeout(() => {
              if (
                socketRef.current &&
                socketRef.current.readyState === WebSocket.OPEN
              ) {
                socketRef.current.send(
                  JSON.stringify({
                    type: "seen",
                    sender: user.username,
                    receiver: data.sender,
                  })
                );
              }
            }, 100);
          }
        }

        if (data.type === "image" || !data.type) {
          console.log("📨 Processing new message:", data);

          if (!data.datetime || !data.sender || !data.images) {
            console.error("❌ Invalid message data:", data);
            return;
          }

          const msgDate = new Date(data.datetime);
          const formattedDate = format(msgDate, "dd MMMM yyyy");
          const formattedTime = format(msgDate, "hh:mm a");

          const newMessage = {
            id: data.id || Date.now(),
            is_deleted_by: null,
            is_bothdeleted: false,
            is_bothdeleted_by: false,
            sender: data.sender,
            receiver:
              data.receiver ||
              (data.sender === user.username
                ? selectedUser.username
                : user.username),
            message: "",
            image: data.images,
            format: data.format,
            time: formattedTime,
            seen: data.seen || false,
            is_edited: false,
            is_ghost: data.is_ghost || false,
          };
          console.log("📨 New message to add:", newMessage);

          setmessages((prevMessages) => {
            console.log("📚 Previous messages:", prevMessages);

            let groupKey;
            if (isToday(msgDate)) {
              groupKey = "Today";
            } else if (isYesterday(msgDate)) {
              groupKey = "Yesterday";
            } else {
              groupKey = formattedDate;
            }

            const updatedMessages = { ...prevMessages };

            if (updatedMessages[groupKey]) {
              const messageExists = updatedMessages[groupKey].some(
                (msg) => msg.id === newMessage.id
              );

              if (!messageExists) {
                updatedMessages[groupKey] = [
                  ...updatedMessages[groupKey],
                  newMessage,
                ];
              }
            } else {
              updatedMessages[groupKey] = [newMessage];
            }

            console.log("✅ Updated messages:", updatedMessages);
            setTimeout(() => scrollToBottom(), 0);
            return updatedMessages;
          });

          if (
            data.sender === selectedUser.username &&
            (data.receiver === user.username || !data.receiver) &&
            !data.is_ghost &&
            !selectedUser.is_blocked_by?.includes(data.sender)
          ) {
            console.log(
              "👀 Auto-sending seen notification for message from",
              data.sender
            );

            setTimeout(() => {
              if (
                socketRef.current &&
                socketRef.current.readyState === WebSocket.OPEN
              ) {
                socketRef.current.send(
                  JSON.stringify({
                    type: "seen",
                    sender: user.username,
                    receiver: data.sender,
                  })
                );
              }
            }, 100);
          }
        }

        if (data.type === "video" || !data.type) {
          console.log("📨 Processing new message:", data);

          if (!data.datetime || !data.sender || !data.video) {
            console.error("❌ Invalid message data:", data);
            return;
          }

          const msgDate = new Date(data.datetime);
          const formattedDate = format(msgDate, "dd MMMM yyyy");
          const formattedTime = format(msgDate, "hh:mm a");

          const newMessage = {
            id: data.id || Date.now(),
            is_deleted_by: null,
            is_bothdeleted: false,
            is_bothdeleted_by: false,
            sender: data.sender,
            receiver:
              data.receiver ||
              (data.sender === user.username
                ? selectedUser.username
                : user.username),
            message: "",
            image: data.images,
            video: data.video,
            format: data.format,
            time: formattedTime,
            seen: data.seen || false,
            is_edited: false,
            is_ghost: data.is_ghost || false,
          };
          console.log("📨 New message to add:", newMessage);
          setmessages((prevMessages) => {
            console.log("📚 Previous messages:", prevMessages);

            let groupKey;
            if (isToday(msgDate)) {
              groupKey = "Today";
            } else if (isYesterday(msgDate)) {
              groupKey = "Yesterday";
            } else {
              groupKey = formattedDate;
            }

            const updatedMessages = { ...prevMessages };

            if (updatedMessages[groupKey]) {
              const messageExists = updatedMessages[groupKey].some(
                (msg) => msg.id === newMessage.id
              );

              if (!messageExists) {
                updatedMessages[groupKey] = [
                  ...updatedMessages[groupKey],
                  newMessage,
                ];
              }
            } else {
              updatedMessages[groupKey] = [newMessage];
            }

            console.log("✅ Updated messages:", updatedMessages);
            setTimeout(() => scrollToBottom(), 0);
            return updatedMessages;
          });

          if (
            data.sender === selectedUser.username &&
            (data.receiver === user.username || !data.receiver) &&
            !data.is_ghost &&
            !selectedUser.is_blocked_by?.includes(data.sender)
          ) {
            console.log(
              "👀 Auto-sending seen notification for message from",
              data.sender
            );

            setTimeout(() => {
              if (
                socketRef.current &&
                socketRef.current.readyState === WebSocket.OPEN
              ) {
                socketRef.current.send(
                  JSON.stringify({
                    type: "seen",
                    sender: user.username,
                    receiver: data.sender,
                  })
                );
              }
            }, 100);
          }
        }

        if (data.type === "voice" || !data.type) {
          console.log("📨 Processing new message:", data);

          if (!data.datetime || !data.sender || !data.voice) {
            console.error("❌ Invalid message data:", data);
            return;
          }

          const msgDate = new Date(data.datetime);
          const formattedDate = format(msgDate, "dd MMMM yyyy");
          const formattedTime = format(msgDate, "hh:mm a");

          const newMessage = {
            id: data.id || Date.now(),
            is_deleted_by: null,
            is_bothdeleted: false,
            is_bothdeleted_by: false,
            sender: data.sender,
            receiver:
              data.receiver ||
              (data.sender === user.username
                ? selectedUser.username
                : user.username),
            message: "",
            image: data.images,
            voice: data.voice,
            format: data.format,
            time: formattedTime,
            seen: data.seen || false,
            is_edited: false,
            is_ghost: data.is_ghost || false,
          };
          console.log("📨 New message to add:", newMessage);
          setmessages((prevMessages) => {
            console.log("📚 Previous messages:", prevMessages);

            let groupKey;
            if (isToday(msgDate)) {
              groupKey = "Today";
            } else if (isYesterday(msgDate)) {
              groupKey = "Yesterday";
            } else {
              groupKey = formattedDate;
            }

            const updatedMessages = { ...prevMessages };

            if (updatedMessages[groupKey]) {
              const messageExists = updatedMessages[groupKey].some(
                (msg) => msg.id === newMessage.id
              );

              if (!messageExists) {
                updatedMessages[groupKey] = [
                  ...updatedMessages[groupKey],
                  newMessage,
                ];
              }
            } else {
              updatedMessages[groupKey] = [newMessage];
            }

            console.log("✅ Updated messages:", updatedMessages);
            setTimeout(() => scrollToBottom(), 0);
            return updatedMessages;
          });

          if (
            data.sender === selectedUser.username &&
            (data.receiver === user.username || !data.receiver) &&
            !data.is_ghost &&
            !selectedUser.is_blocked_by?.includes(data.sender)
          ) {
            console.log(
              "👀 Auto-sending seen notification for message from",
              data.sender
            );

            setTimeout(() => {
              if (
                socketRef.current &&
                socketRef.current.readyState === WebSocket.OPEN
              ) {
                socketRef.current.send(
                  JSON.stringify({
                    type: "seen",
                    sender: user.username,
                    receiver: data.sender,
                  })
                );
              }
            }, 100);
          }
        }
      };

      socket.onopen = () => {
        console.log("✅ WebSocket connection opened");
      };

      socket.onerror = (error) => {
        console.error("⚠️ WebSocket error", error);
      };

      socket.onclose = (event) => {
        console.log(
          "🔌 WebSocket connection closed:",
          event.code,
          event.reason
        );
      };

      return () => {
        if (socketRef.current) {
          socketRef.current.close();
          console.log("🧹 Cleanup: socket closed");
        }
      };
    }, [selectedUser, user.username, scrollToBottom]);

    useImperativeHandle(ref, () => ({
      handleBlock: (targetUsername) => {
        socketRef.current?.send(
          JSON.stringify({
            type: "block",
            user: user.username,
            to: targetUsername || selectedUser.username,
          })
        );
      },
      handleunBlock: (targetUsername) => {
        socketRef.current.send(
          JSON.stringify({
            type: "unblock",
            user: user.username,
            to: targetUsername || selectedUser.username,
          })
        );
      },

      handleClearChat: (targetUsername) => {
        socketRef.current.send(
          JSON.stringify({
            type: "clearchat",
            time: new Date().toISOString(),
            user: user.username,
            to: targetUsername || selectedUser.username,
          })
        );
      },
    }));

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
          console.log("📚 Fetched messages:", data);

          if (res.status === 200) {
            const formattedGroupedMessages = {};

            for (const date in data) {
              const messages = data[date];

              formattedGroupedMessages[date] = messages.map((msg) => {
                const timeObj = new Date(`2000-01-01T${msg.datetime}`);
                const formattedTime = format(timeObj, "hh:mm a");

                return {
                  id: msg.id,
                  is_deleted: msg.is_deleted,
                  is_cleared_by: msg.is_cleared_by,
                  is_deleted_by: msg.is_deleted_by,
                  is_bothdeleted: msg.is_bothdeleted,
                  is_bothdeleted_by: msg.is_bothdeleted_by,
                  sender: msg.sender,
                  receiver: msg.receiver,
                  message: msg.message,
                  time: formattedTime,
                  seen: Boolean(msg.seen),
                  is_edited: msg.is_edited,
                  format: msg.format,
                  image: msg.images,
                  voice: msg.voice,
                  video: msg.video,
                };
              });
            }

            setmessages(formattedGroupedMessages);
            console.log("📚 Loaded messages:", formattedGroupedMessages);

            // Scroll to bottom after loading messages
            setTimeout(() => scrollToBottom(), 200);
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
        setattachmentMenu(false);
        setPreviews([]);
        prevUserRef.current = selectedUser.username;
      }
    }, [selectedUser, user.username, scrollToBottom]);

    useEffect(() => {
      scrollToBottom();
    }, [messages, scrollToBottom]);
    useEffect(() => {
      return () => {};
    }, []);

    useEffect(() => {
      const handleEsc = (e) => {
        if (e.key === "Escape") {
          onClose();
          setattachmentMenu(false);
          setshowImageViewModal(false);
        }
      };

      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!selectedUser) {
      return (
        <>
          <div className="relative h-[7%] flex items-center justify-end px-4 py-2 gap-4 bg-white border-b border-gray-200 mt-5 rounded-xl mr-5">
            {/* {user.notfication_count > 0 && (
              <div className="md:w-[15px] md:h-[15px] absolute rounded-full p-1 top-1.5 right-16.5 ring-1 z-10 bg-white ring-green-700 flex items-center justify-center">
                <p className="text-[10px] font-normal font-[poppins]">
                  {user.notfication_count}
                </p>
              </div>
            )}
            <div
              className={`relative w-[40px] h-[40px] rounded-full bg-white  ${
                user.notfication_count > 0
                  ? "ring-green-700 ring-2"
                  : "ring-[#68479D] ring-1"
              } overflow-hidden cursor-pointer flex items-center justify-center`}
              onClick={() => setIsModalOpen(true)}
            >
              <i className="absolute  bi bi-person-fill-add text-2xl text-[#68479D]"></i>
            </div> */}

            <div
              onClick={() => setDropdown(!dropdown)}
              className="w-[40px] h-[40px] rounded-full bg-white ring-1 ring-[#68479D] overflow-hidden cursor-pointer"
            >
              {user?.profile ? (
                <img
                  src={`http://192.168.18.144:8000${user.profile}`}
                  alt="okokok"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/40 text-xl font-bold">
                  {user?.username?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            {dropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-12 right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-10"
              >
                <button
                  onClick={(e) => handleShowProfile(e, user)}
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
            onAccept={callgetUsers}
          />
          <ProfileView
            onClose={handleCloseProfile}
            isOpen={showProfileView}
            Seluser={profileUser}
          />
        </>
      );
    }
    return (
      <>
        <div className="h-[7%] flex items-center justify-end px-4 py-2 gap-4 bg-white border-b border-gray-200 mt-5 rounded-xl mr-5">
          {/* <div
            className={`relative w-[40px] h-[40px] rounded-full bg-white  ${
              user.notfication_count > 0
                ? "ring-green-700 ring-2"
                : "ring-[#68479D] ring-1"
            } overflow-hidden cursor-pointer flex items-center justify-center`}
            onClick={() => setIsModalOpen(true)}
          >
            <i className="absolute  bi bi-person-fill-add text-2xl text-[#68479D]"></i>
          </div> */}

          <div
            onClick={() => setDropdown(!dropdown)}
            className="w-[40px] h-[40px] rounded-full bg-white ring-1 ring-[#68479D] overflow-hidden cursor-pointer"
          >
            {user?.profile ? (
              <img
                src={`http://192.168.18.144:8000${user.profile}`}
                alt="okokok"
                // onError={(e) => {
                //   e.target.onerror = null;
                //   e.target.src = "/fallback.png"; // or some default avatar
                // }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/40 text-xl font-bold">
                {user?.username?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          {dropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-12 right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-10"
            >
              <button
                onClick={(e) => handleShowProfile(e, user)}
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
            Object.entries(messages).map(([date, msgs]) => {
              const visibleMsgs = msgs.filter((msg) => {
                const deletedForMe = msg.is_deleted_by?.includes(user.username);
                const is_clearmsg = msg.is_cleared_by?.includes(user.username);
                console.log(is_clearmsg);
                return !deletedForMe && !is_clearmsg;
              });

              if (visibleMsgs.length === 0) return null;

              return (
                <div key={date}>
                  <p className="text-center text-xs text-gray-400 my-3">
                    {date}
                  </p>

                  {visibleMsgs.map((msg, index) => {
                    const isMe = msg.sender === user.username;
                    const deletedGlobally = msg.is_bothdeleted;
                    const deletedGlobally_by = msg.is_bothdeleted_by;
                    const edited = msg.is_edited;
                    const format = msg.format;

                    return (
                      <div
                        id={`msg-${msg.id}`}
                        key={`${msg.id}-${index}`}
                        className={`relative w-fit ${
                          format == "image"
                            ? " pb-0.5 py-1"
                            : format == "voice"
                            ? " pb-0.5"
                            : format == "video"
                            ? " pb-0.5"
                            : "md:min-w-[12%] min-w-[25%] md:max-w-[70%] max-w-[80%] wrap-break-word  py-1"
                        }   rounded-lg mb-1 ${
                          isMe
                            ? `${
                                msg.format == "text" || deletedGlobally
                                  ? "bg-[#68479D] text-white self-end ml-auto group px-2 pb-3.5"
                                  : msg.format == "image" || deletedGlobally
                                  ? "bg-transparent text-white self-end ml-auto group"
                                  : msg.format == "video" || deletedGlobally
                                  ? "bg-transparent text-white self-end ml-auto group"
                                  : "bg-transparent text-white self-end ml-auto group  mb-1"
                              }`
                            : `${
                                msg.format == "text" || deletedGlobally
                                  ? "bg-white text-black self-start  group px-2 pb-3.5"
                                  : msg.format == "image" || deletedGlobally
                                  ? "bg-white text-black self-start  group px-2 pb-3.5  "
                                  : msg.format == "video" || deletedGlobally
                                  ? "bg-white text-black self-start  group px-2 pb-3.5 "
                                  : "bg-transparent text-white self-start group pb-3.5"
                              }`
                        }`}
                      >
                        {format == "text" ? (
                          <>
                            {" "}
                            <p className="whitespace-pre-wrap md:text-sm text-[16px] ">
                              {deletedGlobally
                                ? deletedGlobally_by === user.username
                                  ? "You deleted this message"
                                  : "This message was deleted"
                                : msg.message}
                            </p>
                            <p
                              className={`absolute ${
                                isMe ? "right-5" : "right-2.5"
                              } bottom-0.5 md:text-[9px] text-[8px] text-gray-300`}
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
                          </>
                        ) : (
                          <>
                            {msg.format === "image" ? (
                              <>
                                <p className="whitespace-pre-wrap md:text-sm text-[16px] ">
                                  {deletedGlobally ? (
                                    deletedGlobally_by === user.username ? (
                                      "You deleted this message"
                                    ) : (
                                      "This message was deleted"
                                    )
                                  ) : (
                                    <img
                                      src={msg.image}
                                      alt=""
                                      className="max-w-[200px] max-h-[300px] object-contain rounded-lg ring-1 cursor-pointer"
                                      onClick={() =>
                                        openImageViewModal(msg.image, "image")
                                      }
                                    />
                                  )}
                                </p>

                                <p
                                  className={`absolute ${
                                    isMe ? "right-5" : "right-2.5"
                                  } bottom-0.5 md:text-[9px] text-[8px] text-gray-300`}
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
                              </>
                            ) : msg.format === "video" ? (
                              <>
                                <p className="whitespace-pre-wrap md:text-sm text-[16px] ">
                                  {deletedGlobally ? (
                                    deletedGlobally_by === user.username ? (
                                      "You deleted this message"
                                    ) : (
                                      "This message was deleted"
                                    )
                                  ) : (
                                    <>
                                      {" "}
                                      <video
                                        // controls
                                        src={msg.video}
                                        className="relative max-w-[250px] max-h-[300px] rounded-lg cursor-pointer"
                                        onClick={() =>
                                          openImageViewModal(msg.video, "video")
                                        }
                                      />
                                      <i
                                        className="bi bi-play-circle text-white text-5xl absolute inset-0 flex items-center justify-center cursor-pointer"
                                        onClick={() =>
                                          openImageViewModal(msg.video, "video")
                                        }
                                      ></i>
                                    </>
                                  )}
                                </p>

                                <p
                                  className={`absolute ${
                                    isMe ? "right-5" : "right-2.5"
                                  } bottom-0.5 md:text-[9px] text-[8px] text-gray-300`}
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
                              </>
                            ) : msg.format === "voice" ? (
                              <>
                                <p className="whitespace-pre-wrap md:text-sm text-[16px] ">
                                  {deletedGlobally ? (
                                    deletedGlobally_by === user.username ? (
                                      "You deleted this message"
                                    ) : (
                                      "This message was deleted"
                                    )
                                  ) : (
                                    <audio
                                      controls
                                      src={msg.voice}
                                      className="max-w-[250px] rounded-lg"
                                    />
                                  )}
                                </p>

                                <p
                                  className={`absolute ${
                                    isMe ? "right-5" : "right-2.5"
                                  } bottom-0.5 md:text-[9px] text-[8px] text-gray-300`}
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
                              </>
                            ) : null}
                          </>
                        )}

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
                                  {msgAlterOptions.alterPermissible && isMe && (
                                    <>
                                      {msg.format == "text" && (
                                        <div
                                          className="w-full flex gap-2 items-center text-black cursor-pointer py-1"
                                          onClick={() =>
                                            handleeditMsg(msg.id, msg.message)
                                          }
                                        >
                                          <i className="bi bi-pencil text-sm"></i>
                                          <p className="text-black text-sm">
                                            Edit
                                          </p>
                                        </div>
                                      )}
                                      <div
                                        className="w-full flex gap-2 items-center text-black border-b pb-1 py-1 cursor-pointer"
                                        onClick={() =>
                                          openDeleteModal(msg.id, "both")
                                        }
                                      >
                                        <i className="bi bi-trash text-sm"></i>
                                        <p className="text-black text-sm">
                                          Delete for everyone
                                        </p>
                                      </div>
                                    </>
                                  )}

                                  <div
                                    className="w-full flex gap-2 items-center text-black mt-1 cursor-pointer py-1"
                                    onClick={() =>
                                      openDeleteModal(msg.id, "me")
                                    }
                                  >
                                    <i className="bi bi-trash text-sm"></i>
                                    <p className="text-black text-sm">
                                      Delete for me
                                    </p>
                                  </div>
                                  {msg.format == "image" &&
                                    !deletedGlobally && (
                                      <a href={msg.image} download="image.jpg">
                                        <div className="w-full flex gap-2 items-center text-black pb-1 py-1 cursor-pointer">
                                          <i className="bi bi-download text-sm"></i>
                                          <p className="text-black text-sm">
                                            Download
                                          </p>
                                        </div>
                                      </a>
                                    )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                      //   )}
                      // </>
                    );
                  })}
                </div>
              );
            })}

          <div ref={messageEndRef} />
        </div>
        {selectedUser.is_blocked_by.includes(user.username) ? (
          <div className="h-[7%] flex items-center justify-center gap-5 px-4 py-3 bg-white border-t rounded-xl border-gray-200 max-h-32 mb-5 mr-5">
            <button
              className="text-md text-white font-[poppins] w-[20%] rounded-full bg-[#EF4444] ring-1 ring-white  py-0.5 cursor-pointer
           hover:text-[#EF4444] hover:ring-[#EF4444] hover:bg-white ransition-all duration-300 delay-100"
              onClick={() => clearChat()}
            >
              <i className="bi bi-trash3"></i> Delete Chat
            </button>
            <button
              className="text-md text-white font-[poppins] w-[20%] rounded-full bg-[#22C55E] ring-1 ring-white py-0.5 cursor-pointer
           hover:text-[#22C55E] hover:ring-[#22C55E] hover:bg-white ransition-all duration-300 delay-100"
              onClick={() => handleunBlock()}
            >
              <i className="bi bi-ban"></i> Unblock
            </button>
          </div>
        ) : (
          <div className="relative h-[8%] flex items-center justify-between px-4 py-3 bg-white border-t rounded-xl border-gray-200 max-h-32 mb-5 mr-5">
            <i
              className="bi bi-plus text-2xl"
              onClick={() => setattachmentMenu(!attachmentMenu)}
            ></i>
            {attachmentMenu ? (
              <div
                className="absolute bottom-15 left-1 w-[8%] h-[100px] shadow-xl ring-1 ring-gray-300 rounded-md p-3 flex flex-col items-start gap-2 "
                ref={attachmentMenuRef}
              >
                <div
                  className="w-full h-[25%]  flex  items-center justify-start gap-1 cursor-pointer"
                  onClick={() => {
                    triggerImageFileInput(), setattachmentMenu(false);
                  }}
                >
                  <i className="bi bi-image"></i>
                  <p className="text-sm font-[poppins] ">Photos </p>
                </div>

                <div
                  className="w-full h-[25%]  flex items-center justify-start gap-1 cursor-pointer"
                  onClick={() => {
                    triggerVideoFileInput(), setattachmentMenu(false);
                  }}
                >
                  <i className="bi bi-file-earmark-play-fill"></i>
                  <p className="text-sm font-[poppins] ">Videos </p>
                </div>

                {/* <div
                className="w-full h-[25%]  flex items-center justify-start gap-1 cursor-pointer"
                onClick={() => triggerImageFileInput()}
              >
                <i className="bi bi-file-earmark"></i>
                <p className="text-sm font-[inter] ">Document</p>
              </div> */}
              </div>
            ) : (
              ""
            )}

            {previews.length > 0 &&
              previews.map((file, index) => (
                <div
                  key={file.url}
                  className="absolute bottom-3.5 left-2 md:h-[550px] h-[200px] md:w-[600px] w-[250px] bg-[#e9e9e9] flex flex-col mt-4 shadow-lg z-20 rounded-md"
                >
                  {/* Top Bar */}
                  <div className="w-full h-[8%] px-1 flex items-center justify-between border-b border-gray-300 shadow-sm">
                    <div></div>
                    <i
                      className="bi bi-trash md:text-2xl text-xs p-1.5 md:bg-white rounded-sm"
                      onClick={() => removeImage()}
                    ></i>
                    <i
                      className="bi bi-x md:text-2xl text-sm md:bg-white rounded-sm font-medium"
                      onClick={() => setPreviews([])}
                    ></i>
                  </div>

                  {/* Main Preview */}
                  {file.type === "image" ? (
                    <div className="w-full h-[82%] py-1">
                      <img
                        src={mainPreviewImage}
                        alt=""
                        className="w-full h-full object-scale-down object-center"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-[82%] py-1">
                      <video
                        src={mainPreviewImage}
                        controls
                        className="w-full h-full object-scale-down object-center"
                      />
                    </div>
                  )}

                  {/* Bottom bar with thumbnails + send */}
                  <div className="w-full h-[10%] px-1 flex items-center justify-between border-t border-gray-300 shadow-sm">
                    <div className="w-[90%] h-full flex items-center justify-center py-1 ">
                      {previews.length > 1 &&
                        previews.map((thumb, thumbIndex) => (
                          <div
                            key={thumb.url}
                            className="max-w-[45px] h-full mr-1 cursor-pointer"
                            onClick={() => {
                              setmainPreviewImage(thumb.url);
                              setCurrentIndex(thumbIndex);
                            }}
                          >
                            {thumb.type === "image" ? (
                              <img
                                src={thumb.url}
                                alt=""
                                className="w-full h-full object-cover object-center"
                              />
                            ) : (
                              <video
                                src={thumb.url}
                                className="w-full h-full object-cover object-center"
                              />
                            )}
                          </div>
                        ))}
                    </div>

                    <button
                      onClick={() => {
                        sendingFileType === "image"
                          ? sendImage()
                          : sendingFileType === "document"
                          ? sendDocument()
                          : sendVideo();
                      }}
                    >
                      <VscSend className="md:text-xl text-sm text-[#68479D]" />
                    </button>
                  </div>
                </div>
              ))}

            <input
              type="file"
              accept="image/*"
              multiple={false}
              ref={imageFileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              accept="video/*"
              multiple={false}
              ref={videoFileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setinput(e.target.value);
                handletextareaInput();
              }}
              onKeyDown={handleKeyDown}
              className="w-[95%] py-2.5 px-4  text-sm rounded-xl focus:ring-0 focus:outline-none bg-gray-100 resize-none overflow-y-auto max-h-32"
              rows={1}
            />
            {!files.length > 0 && (
              <>
                {input.length > 0 ? (
                  <button
                    onClick={isEditingMsg.edit ? editMsg : sendMessage}
                    hidden={previews.length > 0}
                  >
                    <VscSend className="md:text-xl text-lg  text-[#68479D]" />
                  </button>
                ) : (
                  <>
                    {!recording ? (
                      <button onClick={startRecording}>
                        <PiMicrophoneLight className="md:text-xl" />
                      </button>
                    ) : (
                      <button onClick={stopRecording}>
                        <PiMicrophoneFill className="md:text-xl" />
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
        <ProfileView
          onClose={handleCloseProfile}
          isOpen={showProfileView}
          Seluser={profileUser}
          onAccept={callgetUsers}
        />
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
          showMsg={ModalMsg}
        />
        <ImageViewModal
          isOpen={showImageViewModal}
          onClose={() => setshowImageViewModal(false)}
          imgurl={showImageUrl}
        />

        <Frndrequest
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAccept={callgetUsers}
        />
      </>
    );
  }
);

export default ChatScreen;
