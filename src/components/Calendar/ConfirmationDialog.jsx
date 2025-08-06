import React from "react";
import { AlertTriangle, X } from "lucide-react";
import Button from "../ui/Button";

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div
        className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-700 p-4 flex justify-between items-center border-b border-gray-600">
          <h2 className="text-xl font-semibold flex items-center">
            <AlertTriangle className="mr-2 text-amber-400" />{" "}
            {title || "Confirm Action"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-300 hover:text-white hover:bg-gray-600 rounded-full"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300">{message}</p>
        </div>

        {/* Actions */}
        <div className="bg-gray-700/30 p-4 flex justify-end space-x-3 border-t border-gray-700">
          <Button
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant="danger"
            className="flex items-center"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ConfirmationDialog;
