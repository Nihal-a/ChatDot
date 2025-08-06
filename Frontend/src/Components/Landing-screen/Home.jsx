import React, { useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import Cookies from "universal-cookie";
import Sidebar from "./Sidebar";
import { useState } from "react";
import ChatScreen from "./ChatScreen";

const Home = () => {
  const [selectedUser, setselectedUser] = useState(null);
  const [latestMsg, setlatestMsg] = useState([]);
  const { user } = useSelector((state) => state.chatdot);
  const cookies = new Cookies();
  const access = cookies.get("access");
  const sidebarSocketRef = useRef(null);

  const chatScreenRef = useRef();

  const handleBlock = (targetUsername) => {
    chatScreenRef.current?.handleBlock(targetUsername);
  };

  const handleunBlock = (targetUsername) => {
    chatScreenRef.current?.handleunBlock(targetUsername);
  };

  const handleClearChat = (targetUsername) => {
    chatScreenRef.current?.handleClearChat(targetUsername);
  };

  useEffect(() => {
    if (!access || !user?.username) return;

    const socket = new WebSocket(
      `ws://192.168.18.144:8000/ws/chat/${user.username}/?token=${access}`
    );

    socket.onopen = () => {
      console.log("Sidebar WebSocket connected!");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "sidebar_update") {
          console.log("saaanam vannu");
          console.log("🔁 Sidebar update received:", data.data);
          handleSidebarUpdate(data.data);
        }
      } catch (err) {
        console.error("Sidebar WS parse error:", err);
      }
    };

    socket.onclose = () => {
      console.log("Sidebar WebSocket disconnected");
    };

    socket.onerror = (error) => {
      console.error("Sidebar WebSocket error:", error);
    };

    sidebarSocketRef.current = socket;

    return () => {
      if (sidebarSocketRef.current) {
        sidebarSocketRef.current.close();
      }
    };
  }, [user?.username, access]);

  const handleCloseChatScreen = () => {
    setselectedUser(null);
  };

  const handleUserSelect = (user) => {
    setselectedUser(user);

    // When user selects a chat, immediately mark their unseen count as 0
    setlatestMsg((prevList) => {
      return prevList.map((item) =>
        item.username === user.username ? { ...item, unseen_count: 0 } : item
      );
    });
  };

  // Handle sidebar updates from WebSocket
  const handleSidebarUpdate = (updateData) => {
    console.log("Processing sidebar update:", updateData);

    const { username, last_msg, last_msg_time, unseen_count } = updateData;

    // If user is currently selected and chat is open, set unseen count to 0
    const finalUnseenCount =
      selectedUser && selectedUser.username === username
        ? 0
        : unseen_count || 0;

    const newUpdate = {
      username: username,
      last_message: last_msg,
      last_message_time: last_msg_time,
      unseen_count: finalUnseenCount,
    };

    setlatestMsg((prevList) => {
      const existingIndex = prevList.findIndex(
        (item) => item.username === username
      );

      if (existingIndex !== -1) {
        // Update existing user
        const updatedList = [...prevList];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          ...newUpdate,
        };

        // Move to top if there's a new message
        if (last_msg) {
          const updatedUser = updatedList.splice(existingIndex, 1)[0];
          return [updatedUser, ...updatedList];
        }

        return updatedList;
      } else {
        // Add new user to top
        return [newUpdate, ...prevList];
      }
    });
  };

  const handleLatestMsg = (latest) => {
    console.log("Direct latest message update:", latest);
    setlatestMsg((prevList) => {
      const existingIndex = prevList.findIndex(
        (item) => item.username === latest.username
      );

      if (existingIndex !== -1) {
        // Overwrite existing and move to top
        const updatedList = [...prevList];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          ...latest,
        };

        // Move to top
        const updatedUser = updatedList.splice(existingIndex, 1)[0];
        return [updatedUser, ...updatedList];
      } else {
        // Add new to top
        return [latest, ...prevList];
      }
    });
  };

  return (
    <div className="w-full h-screen flex overflow-hidden font-[inter]">
      <div className="w-1/4 h-full flex flex-col border-r border-gray-200">
        <Sidebar
          onBlock={handleBlock}
          onunBlock={handleunBlock}
          onClearChat={handleClearChat}
          onselectUser={handleUserSelect}
          latestMsg={latestMsg}
          onSidebarUpdate={handleSidebarUpdate} // Pass the callback
        />
      </div>
      <div className="w-3/4 h-full flex flex-col bg-[#EFEDF8]">
        <ChatScreen
          ref={chatScreenRef}
          selectedUser={selectedUser}
          onClose={handleCloseChatScreen}
          onlatestMsg={handleLatestMsg}
          updateselectUser={handleUserSelect}
          user={user}
        />
      </div>
    </div>
  );
};

export default Home;
