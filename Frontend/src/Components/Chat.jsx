import React, { useState, useEffect } from "react";
import { useRef } from "react";
import { useSelector } from "react-redux";
import Cookies from "universal-cookie";
const Chat = () => {
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);
  const cookies = new Cookies();
  const access = cookies.get("access");

  const { user } = useSelector((state) => state.chatdot);

  useEffect(() => {
    setUsername(user.username || "Anonymous");

    // const socket = new WebSocket("ws://localhost:8000/ws/chat/custom/");
    const socket = new WebSocket(`ws://localhost:8000/ws/chat/aslam/?token=${access}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [
        ...prev,
        { sender: data.sender, message: data.message },
      ]);
    };

    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onclose = () => {
      console.log("Disconnected from WebSocket");
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() !== "") {
      socketRef.current.send(
        JSON.stringify({
          sender: username,
          message: input,
          rec: "aslam",
        })
      );
      setInput("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Chat Room: custom</h2>
      <h2>{username}</h2>
      <div
        style={{
          border: "1px solid #ccc",
          height: 300,
          overflowY: "scroll",
          marginBottom: 10,
          padding: 10,
        }}
      >
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};
export default Chat;
