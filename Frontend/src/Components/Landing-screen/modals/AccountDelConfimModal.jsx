import React, { useState, useEffect } from "react";

const AccountDelConfimModal = ({
  isOpen,
  onClose,
  onDelete,
  userid,
  showMsg,
}) => {
  if (!isOpen) return null;
  const [ModalMsg, setModalMsg] = useState(null);

  useEffect(() => {
    setModalMsg(showMsg);
  }, [showMsg]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-40 backdrop-blur-sm transition-opacity">
      <div className="bg-white/90 rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
          Delete Message?
        </h2>
        <p className="text-gray-600 text-sm text-center mb-6">
          {showMsg == "confirm delete"
            ? "This action will be deleted your account forever and you need to signup again to access ChatDot and the exsting connections and messages also will be erased, and action can’t be undone once you delete!"
            : "This message will be deleted for everyone and can’t be undone"}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="px-4 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountDelConfimModal;
