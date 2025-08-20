import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Cookies from "universal-cookie";
import Sidebar from "./Sidebar";
import ChatScreen from "./ChatScreen";

const Home = () => {
  const [selectedUser, setselectedUser] = useState(null);
  const [latestMsg, setlatestMsg] = useState([]);

  const { user } = useSelector((state) => state.chatdot);

  const cookies = new Cookies();
  const access = cookies.get("access");

  const sidebarSocketRef = useRef(null);
  const chatScreenRef = useRef();
  const sidebarRef = useRef();

  const handlecallGetUsers = () => {
    sidebarRef.current?.fetchUsers();
  };

  const handleBlock = (targetUsername) => {
    chatScreenRef.current?.handleBlock(targetUsername);
  };

  const handleunBlock = (targetUsername) => {
    chatScreenRef.current?.handleunBlock(targetUsername);
  };

  const handleClearChat = (targetUsername) => {
    chatScreenRef.current?.handleClearChat(targetUsername);
  };

  const handleCloseChatScreen = () => {
    setselectedUser(null);
  };

  const handleUserSelect = (user) => {
    console.log("🎯 User selected:", user.username);
    setselectedUser(user);

    setlatestMsg((prevList) => {
      return prevList.map((item) =>
        item.username === user.username ? { ...item, unseen_count: 0 } : item
      );
    });
  };

  const handleSidebarUpdate = (updateData) => {
    console.log("🔄 Processing sidebar update:", updateData);

    const { username, last_msg, last_msg_time, unseen_count } = updateData;

    const isCurrentlySelected =
      selectedUser && selectedUser.username === username;
    const finalUnseenCount = isCurrentlySelected ? 0 : unseen_count || 0;

    console.log(
      `📊 Update for ${username}: unseen=${unseen_count}, selected=${isCurrentlySelected}, final=${finalUnseenCount}`
    );

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
        const updatedList = [...prevList];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          ...newUpdate,
        };

        if (last_msg) {
          const updatedUser = updatedList.splice(existingIndex, 1)[0];
          return [updatedUser, ...updatedList];
        }

        return updatedList;
      } else {
        return [newUpdate, ...prevList];
      }
    });
  };

  const handleLatestMsg = (latest) => {
    console.log("📨 Direct latest message update:", latest);

    setlatestMsg((prevList) => {
      const existingIndex = prevList.findIndex(
        (item) => item.username === latest.username
      );

      const isCurrentlySelected =
        selectedUser && selectedUser.username === latest.username;
      const finalLatest = {
        ...latest,
        unseen_count: isCurrentlySelected ? 0 : latest.unseen_count || 0,
      };

      if (existingIndex !== -1) {
        const updatedList = [...prevList];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          ...finalLatest,
        };

        const updatedUser = updatedList.splice(existingIndex, 1)[0];
        return [updatedUser, ...updatedList];
      } else {
        return [finalLatest, ...prevList];
      }
    });
  };

  useEffect(() => {
    if (!access || !user?.username) return;

    const socket = new WebSocket(
      `ws://192.168.18.144:8000/ws/chat/${user.username}/?token=${access}`
    );

    // socket.onopen = () => {
    //   console.log("Home WebSocket connected!");
    // };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "sidebar_update") {
          console.log("📱 Sidebar update received:", data.data);
          handleSidebarUpdate(data.data);
        } else if (data.type === "error") {
          console.error("WebSocket error:", data.message);
          // Handle error messages from blocked users, etc.
        }
      } catch (err) {
        console.error("Home WS parse error:", err);
      }
    };

    // socket.onclose = () => {
    //   console.log("Home WebSocket disconnected");
    // };

    // socket.onerror = (error) => {
    //   console.error("Sidebar WebSocket error:", error);
    // };

    sidebarSocketRef.current = socket;

    return () => {
      if (sidebarSocketRef.current) {
        sidebarSocketRef.current.close();
      }
    };
  }, [user?.username, access]);

  console.log("📋 Current latestMsg state:", latestMsg);

  return (
    <div className="w-full h-screen flex  overflow-hidden font-[inter]">
      <div className="md:w-1/4 w-2/6 h-full flex flex-col border-r border-gray-200">
        <Sidebar
          ref={sidebarRef}
          onBlock={handleBlock}
          onunBlock={handleunBlock}
          onClearChat={handleClearChat}
          onselectUser={handleUserSelect}
          latestMsg={latestMsg}
          selectedUser={selectedUser} // Pass selected user to sidebar
          onSidebarUpdate={handleSidebarUpdate}
        />
      </div>
      <div className="w-3/4 h-full flex flex-col bg-[#EFEDF8]">
        <ChatScreen
          ref={chatScreenRef}
          selectedUser={selectedUser}
          onClose={handleCloseChatScreen}
          onlatestMsg={handleLatestMsg}
          updateselectUser={handleUserSelect}
          callgetUsers={handlecallGetUsers}
          user={user}
        />
      </div>
    </div>
  );
};

export default Home;
