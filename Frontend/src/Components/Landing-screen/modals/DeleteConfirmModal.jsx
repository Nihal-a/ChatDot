import React from "react";

const DeleteConfirmModal = ({ isOpen, onClose, onDelete, msgId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-40 backdrop-blur-sm transition-opacity">
      <div className="bg-white/90 rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
          Delete Message?
        </h2>
        <p className="text-gray-600 text-sm text-center mb-6">
          This message will be deleted for everyone and can’t be undone.
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
              onDelete(msgId);
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

export default DeleteConfirmModal;
