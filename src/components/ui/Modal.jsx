import React from "react";

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827] bg-opacity-90 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-auto border border-gray-600 rounded-2xl shadow-2xl bg-[#181F2A] px-4 py-6 sm:px-6 sm:py-8">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white focus:outline-none text-2xl font-bold leading-none"
          onClick={onClose}
          aria-label="Close modal"
          type="button"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
