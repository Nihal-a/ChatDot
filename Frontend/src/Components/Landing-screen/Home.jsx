import React from "react";
import Sidebar from "./Sidebar";
import { useState } from "react";
import ChatScreen from "./ChatScreen";

const Home = () => {
  const [selectedUser, setselectedUser] = useState(null);
  const [latestMsg, setlatestMsg] = useState([]);

  const handleCloseChatScreen = () => {
    setselectedUser(null);
  };

  const handleUserSelect = (user) => {
    setselectedUser(user);
  };

  const handleLatestMsg = (latest) => {
    setlatestMsg((prevList) => {
      const existingIndex = prevList.findIndex(
        (item) => item.username === latest.username
      );

      if (existingIndex !== -1) {
        // Overwrite existing
        const updatedList = [...prevList];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          ...latest,
        };
        return updatedList;
      } else {
        // Add new
        return [latest, ...prevList];
      }
    });
  };

  return (
    <div className="w-full h-screen flex overflow-hidden font-[inter]">
      <div className="w-1/4 h-full flex flex-col border-r border-gray-200">
        <Sidebar onselectUser={handleUserSelect} latestMsg={latestMsg} />
      </div>
      <div className="w-3/4 h-full flex flex-col bg-[#EFEDF8]">
        <ChatScreen
          selectedUser={selectedUser}
          onClose={handleCloseChatScreen}
          onlatestMsg={handleLatestMsg}
        />
      </div>
    </div>
  );
};

export default Home;
