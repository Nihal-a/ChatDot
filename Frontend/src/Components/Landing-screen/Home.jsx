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
    console.log(latestMsg);
    chatScreenRef.current?.handleClearChat(targetUsername);
    const updatedList = latestMsg.map((item) => {
      if (item.username === targetUsername) {
        return {
          ...item,
          last_message: "",
          last_message_time: "",
        };
      }
      return item;
    });

    const userExists = updatedList.some(
      (item) => item.username === targetUsername.username
    );
    // if (!userExists && targetUsername) {
    //   updatedList.push({
    //     username: targetUsername.username,
    //     last_message: targetUsername.last_message || "",
    //     last_message_time: targetUsername.last_message_time || "",
    //     unseen_count: 0,
    //   });
    // }

    return updatedList;
  };

  const handleCloseChatScreen = () => {
    setselectedUser(null);
  };

  const handleUserSelect = (selUser) => {
    console.log(latestMsg);
    if (!selUser) return;

    console.log("🎯 User selected:", selUser.username);
    setselectedUser(selUser);

    setlatestMsg((prevList) => {
      const updatedList = prevList.map((item) => {
        if (item.username === selUser.username) {
          return {
            ...item,
            unseen_count: 0,
            last_message: item.last_message || selUser.last_message || "",
            last_message_time:
              item.last_message_time || selUser.last_message_time || "",
          };
        }
        return item;
      });

      const userExists = updatedList.some(
        (item) => item.username === selUser.username
      );
      if (!userExists && selUser.username) {
        updatedList.push({
          username: selUser.username,
          last_message: selUser.last_message || "",
          last_message_time: selUser.last_message_time || "",
          unseen_count: 0,
        });
      }

      return updatedList;
    });

    handleSidebarUpdate({
      username: selUser.username,
      last_msg: selUser.last_message || "",
      last_msg_time: selUser.last_message_time || "",
      unseen_count: 0,
    });
  };

  const handleSidebarUpdate = (updateData) => {
    console.log("🔄 Processing sidebar update:", updateData);

    const { username, last_msg, last_msg_time, unseen_count } = updateData;

    const isCurrentlySelected =
      selectedUser && selectedUser.username === username;
    const finalUnseenCount = isCurrentlySelected ? 0 : unseen_count || 0;

    const newUpdate = {
      username,
      last_message: last_msg || "", // ✅ map backend `last_msg` → frontend `last_message`
      last_message_time: last_msg_time || new Date().toISOString(),
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

        const updatedUser = updatedList.splice(existingIndex, 1)[0];
        return [updatedUser, ...updatedList];
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
        username: latest.username,
        last_message: latest.last_msg || latest.last_message || "",
        last_message_time:
          latest.last_msg_time ||
          latest.last_message_time ||
          new Date().toISOString(),
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

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "sidebar_update") {
          console.log("📱 Sidebar update received:", data.data);
          handleSidebarUpdate(data.data);
        } else if (data.type === "error") {
          console.error("WebSocket error:", data.message);
        }
      } catch (err) {
        console.error("Home WS parse error:", err);
      }
    };

    sidebarSocketRef.current = socket;

    return () => {
      if (sidebarSocketRef.current) {
        sidebarSocketRef.current.close();
      }
    };
  }, [user?.username, access]);

  return (
    <div className="w-full h-screen flex overflow-hidden font-[inter]">
      <div className="md:w-1/4 w-2/6 h-full flex flex-col border-r border-gray-200">
        <Sidebar
          ref={sidebarRef}
          onBlock={handleBlock}
          onunBlock={handleunBlock}
          onClearChat={handleClearChat}
          onselectUser={handleUserSelect}
          latestMsg={latestMsg}
          selectedUser={selectedUser}
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
