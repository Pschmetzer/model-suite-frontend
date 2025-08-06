import React, { useState } from "react";
import {
  X,
  Calendar,
  CalendarClock,
  Trash2,
  Edit,
  Clock,
  Save,
  ArrowLeft,
} from "lucide-react";
import Button from "../ui/Button";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../common/PermissionGuard";

const AbsenceDetailModal = ({
  absence,
  onClose,
  onEdit,
  onDelete,
  formatDate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const { hasPermission } = usePermissions();

  if (!absence) return null;

  // Calculate duration in days
  const startDate = new Date(absence.startDate);
  const endDate = new Date(absence.endDate);
  const durationInDays =
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Initialize edit form when entering edit mode
  const handleEditClick = () => {
    setEditFormData({
      startDate: absence.startDate.split("T")[0],
      endDate: absence.endDate.split("T")[0],
      note: absence.note || "",
    });
    setIsEditing(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Handle save button click
  const handleSaveClick = () => {
    onEdit({
      ...absence,
      ...editFormData,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div
        className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-700 p-4 flex justify-between items-center border-b border-gray-600">
          <h2 className="text-xl font-semibold flex items-center">
            <CalendarClock className="mr-2 text-red-400" />
            {isEditing ? "Edit Absence" : "Absence Details"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={isEditing ? () => setIsEditing(false) : onClose}
            className="text-gray-300 hover:text-white hover:bg-gray-600 rounded-full"
            aria-label={isEditing ? "Cancel edit" : "Close modal"}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isEditing ? (
            /* Edit Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={editFormData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={editFormData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  name="note"
                  value={editFormData.note}
                  onChange={handleInputChange}
                  placeholder="E.g., Vacation, Personal leave, etc."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              {/* Title/Note */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-1">
                  {absence.note || "Absence"}
                </h3>
                <div className="text-sm text-gray-400">ID: {absence._id}</div>
              </div>

              {/* Date Information */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 space-y-3">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-gray-400">Date Range</div>
                    <div className="text-white font-medium">
                      {formatDate(absence.startDate)} -{" "}
                      {formatDate(absence.endDate)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-gray-400">Duration</div>
                    <div className="text-white font-medium">
                      {durationInDays} day{durationInDays !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Note */}
              {absence.note && (
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="text-sm text-gray-400 mb-1">Note</div>
                  <div className="text-white">{absence.note}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-700/30 p-4 flex justify-end space-x-3 border-t border-gray-700">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                className="flex items-center text-gray-400 hover:text-gray-300"
                onClick={() => setIsEditing(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <PermissionGuard
                permission="calendar.edit"
                fallback={hasPermission("calendar.edit")}
              >
                <Button
                  variant="default"
                  className="flex items-center"
                  onClick={handleSaveClick}
                >
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </PermissionGuard>
            </>
          ) : (
            <>
              <PermissionGuard
                permission="calendar.edit"
                fallback={hasPermission("calendar.edit")}
              >
                <Button
                  variant="ghost"
                  className="flex items-center text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={() => onDelete(absence._id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </PermissionGuard>
              <PermissionGuard
                permission="calendar.edit"
                fallback={hasPermission("calendar.edit")}
              >
                <Button
                  variant="default"
                  className="flex items-center"
                  onClick={handleEditClick}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              </PermissionGuard>
            </>
          )}
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

export default AbsenceDetailModal;
