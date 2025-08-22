import React from "react";

const ImageViewModal = ({ isOpen, onClose, imgurl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl animate-fade-in animate-fade-out">
        <div className="flex flex-col items-center justify-center gap-4">
          {imgurl.format === "image" ? (
            <img
              src={imgurl.url}
              alt=""
              className="max-w-[350px] max-h-[450px] object-cover rounded-lg "
            />
          ) : (
            <video
              src={imgurl.url}
              controls
              className="max-w-[350px] max-h-[450px] object-cover rounded-lg "
            />
          )}
          <div className="flex gap-5">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            >
              Close
            </button>
            <a
              href={imgurl.url}
              download={imgurl.format === "image" ? "image.jpg" : "video.mp4"}
              className="px-4 py-1.5 rounded-lg bg-[#68479D] text-white hover:bg-[#7953b6] transition"
            >
              <i class="bi bi-download text-sm pr-3"></i>
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewModal;
