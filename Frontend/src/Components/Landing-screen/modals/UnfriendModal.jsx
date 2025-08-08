import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../../utils";
import Cookies from "universal-cookie";
import { useSelector } from "react-redux";

const UnfriendModal = ({ isOpen, onClose, unfrienduser, refetch }) => {
  if (!isOpen) return null;
  console.log(unfrienduser);
  const cookies = new Cookies();
  const access = cookies.get("access");
  const { user } = useSelector((state) => state.chatdot);

  const unfriend = async () => {
    try {
      const res = await fetchWithAuth(
        "http://192.168.18.144:8000/api/unfriend",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            me: user.username,
            my_friend: unfrienduser.username,
          }),
        }
      );

      if (res.status === 200) {
        onClose();
        refetch();
      } else {
        console.log("error at unfriend");
      }
    } catch (err) {
      console.log("error at unfriend");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-40 backdrop-blur-sm transition-opacity">
      <div className="bg-white/90 rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
          Unfriend {unfrienduser.name}?
        </h2>

        <p className="text-gray-600 text-sm text-center mb-6">
          This action will unfriend {unfrienduser.name}, existing messages &
          media also will be erased.
          <br />
          <span className="text-red-700 font-semibold">
            {" "}
            Action can’t be undone!
          </span>
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={() => unfriend()}
            className="px-4 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnfriendModal;
