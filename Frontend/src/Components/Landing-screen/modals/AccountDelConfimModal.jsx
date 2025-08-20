import React, { useState, useEffect } from "react";
import { Logout } from "../../Redux/Slice";
import { useDispatch } from "react-redux";
import { fetchWithAuth } from "../../../utils";
import Cookies from "universal-cookie";

const AccountDelConfimModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const cookies = new Cookies();
  const access = cookies.get("access");

  const checkPassword = async () => {
    if (password.length < 8) {
      setError("Password length is lessthan 8");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await fetchWithAuth(
        "http://192.168.18.144:8000/api/check_password",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: password }),
        }
      );

      if (res.status === 200) {
        deleteAccount();
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      const res = await fetchWithAuth(
        "http://192.168.18.144:8000/api/delete_account",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 200) {
        dispatch(Logout());
        onDelete();
        onClose();
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError("");
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-40 backdrop-blur-sm transition-opacity">
      <div className="bg-white/90 rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
          Delete Account?
        </h2>

        <p className="text-gray-600 text-sm text-center mb-6">
          This action will delete your account forever and you need to signup
          again to access ChatDot, existing connections & messages also will be
          erased.
          <span className="text-red-700 font-semibold">
            {" "}
            Action can’t be undone once you delete!
          </span>
        </p>

        <p className="text-gray-600 text-sm text-center mb-4">
          To delete the account, please type your password to confirm.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-3 py-1 border-1 border-gray-300 rounded-lg mb-3 focus:outline-none  focus:border-red-400"
        />
        {error && <p className="text-red-600 text-xs mb-4">{error}</p>}

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={checkPassword}
            disabled={loading || !password.trim()}
            className="px-4 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountDelConfimModal;
