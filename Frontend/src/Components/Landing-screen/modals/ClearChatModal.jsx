import { fetchWithAuth } from "../../../utils";
import { useSelector } from "react-redux";
import Cookies from "universal-cookie";

const ClearChatModal = ({ isOpen, onClose, clearchat, clearChatUser }) => {
  if (!isOpen) return null;

  const cookies = new Cookies();
  const access = cookies.get("access");
  const { user } = useSelector((state) => state.chatdot);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-40 backdrop-blur-sm transition-opacity">
      <div className="bg-white/90 rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
          Clear Chat {clearChatUser.name}?
        </h2>

        <p className="text-gray-600 text-sm text-center mb-6">
          This will permanently delete your chat with {clearChatUser.name},
          including all messages and media. Once cleared, this {" "}
          <span className="text-red-700 font-semibold">
             action cannot be undone.!
          </span>
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => clearchat()}
            className="px-4 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearChatModal;
