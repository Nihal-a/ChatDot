import React from "react";
import Sidebar from "./Sidebar";
import { useState } from "react";
import ChatScreen from "./ChatScreen";

const Home = () => {
  const [selectedUser, setselectedUser] = useState(null);
  return (
    <div className="w-full h-screen flex overflow-hidden font-[inter]">
      <div className="w-1/4 h-full flex flex-col border-r border-gray-200">
        <Sidebar onselectUser={setselectedUser} />
      </div>
      <div className="w-3/4 h-full flex flex-col bg-[#EFEDF8]">
        <ChatScreen selectedUser={selectedUser} />
      </div>
    </div>
  );
};

export default Home;
