import React, { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  Clock,
  Plus,
  X,
  AlertCircle,
  Check,
  Trash2,
  Edit3,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Reminder system component for notes
 * Handles reminder creation, management, and notifications
 */
const ReminderSystem = ({
  noteId,
  existingReminders = [],
  onReminderUpdate,
}) => {
  const [reminders, setReminders] = useState(existingReminders);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    reminderDate: "",
    reminderTime: "",
    type: "notification",
    isRecurring: false,
    recurringPattern: "daily",
  });
  const [editingReminder, setEditingReminder] = useState(null);

  // Reminder types
  const reminderTypes = [
    { value: "notification", label: "Browser Notification" },
    { value: "email", label: "Email Reminder" },
    { value: "both", label: "Both Notification & Email" },
  ];

  // Recurring patterns
  const recurringPatterns = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];

  // Check for due reminders on component mount and every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      reminders.forEach((reminder) => {
        const reminderDateTime = new Date(
          `${reminder.reminderDate}T${reminder.reminderTime}`,
        );

        if (reminderDateTime <= now && !reminder.isTriggered) {
          triggerReminder(reminder);
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [reminders]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Trigger reminder notification
  const triggerReminder = (reminder) => {
    // Mark as triggered
    const updatedReminders = reminders.map((r) =>
      r.id === reminder.id ? { ...r, isTriggered: true } : r,
    );
    setReminders(updatedReminders);
    onReminderUpdate?.(updatedReminders);

    // Show browser notification
    if (
      (reminder.type === "notification" || reminder.type === "both") &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(reminder.title, {
        body: reminder.description,
        icon: "/favicon.ico",
        tag: `reminder-${reminder.id}`,
      });
    }

    // Show toast notification
    toast.success(`Reminder: ${reminder.title}`, {
      duration: 5000,
      position: "top-right",
    });

    // Handle recurring reminders
    if (reminder.isRecurring) {
      createRecurringReminder(reminder);
    }
  };

  // Create next occurrence for recurring reminders
  const createRecurringReminder = (reminder) => {
    const currentDate = new Date(
      `${reminder.reminderDate}T${reminder.reminderTime}`,
    );
    let nextDate = new Date(currentDate);

    switch (reminder.recurringPattern) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    const newRecurringReminder = {
      ...reminder,
      id: Date.now() + Math.random(),
      reminderDate: nextDate.toISOString().split("T")[0],
      isTriggered: false,
    };

    const updatedReminders = [...reminders, newRecurringReminder];
    setReminders(updatedReminders);
    onReminderUpdate?.(updatedReminders);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !newReminder.title.trim() ||
      !newReminder.reminderDate ||
      !newReminder.reminderTime
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const reminderDateTime = new Date(
      `${newReminder.reminderDate}T${newReminder.reminderTime}`,
    );
    if (reminderDateTime <= new Date()) {
      toast.error("Reminder time must be in the future");
      return;
    }

    const reminder = {
      id: editingReminder?.id || Date.now(),
      noteId,
      ...newReminder,
      isTriggered: false,
      createdAt: editingReminder?.createdAt || new Date().toISOString(),
    };

    let updatedReminders;
    if (editingReminder) {
      updatedReminders = reminders.map((r) =>
        r.id === editingReminder.id ? reminder : r,
      );
      toast.success("Reminder updated successfully");
    } else {
      updatedReminders = [...reminders, reminder];
      toast.success("Reminder created successfully");
    }

    setReminders(updatedReminders);
    onReminderUpdate?.(updatedReminders);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setNewReminder({
      title: "",
      description: "",
      reminderDate: "",
      reminderTime: "",
      type: "notification",
      isRecurring: false,
      recurringPattern: "daily",
    });
    setShowCreateForm(false);
    setEditingReminder(null);
  };

  // Delete reminder
  const deleteReminder = (reminderId) => {
    const updatedReminders = reminders.filter((r) => r.id !== reminderId);
    setReminders(updatedReminders);
    onReminderUpdate?.(updatedReminders);
    toast.success("Reminder deleted");
  };

  // Edit reminder
  const editReminder = (reminder) => {
    setNewReminder({
      title: reminder.title,
      description: reminder.description,
      reminderDate: reminder.reminderDate,
      reminderTime: reminder.reminderTime,
      type: reminder.type,
      isRecurring: reminder.isRecurring,
      recurringPattern: reminder.recurringPattern,
    });
    setEditingReminder(reminder);
    setShowCreateForm(true);
  };

  // Mark reminder as completed
  const markCompleted = (reminderId) => {
    const updatedReminders = reminders.map((r) =>
      r.id === reminderId ? { ...r, isCompleted: true } : r,
    );
    setReminders(updatedReminders);
    onReminderUpdate?.(updatedReminders);
    toast.success("Reminder marked as completed");
  };

  // Format date for display
  const formatDateTime = (date, time) => {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get reminder status
  const getReminderStatus = (reminder) => {
    if (reminder.isCompleted)
      return { status: "completed", color: "text-green-400" };
    if (reminder.isTriggered)
      return { status: "triggered", color: "text-yellow-400" };

    const now = new Date();
    const reminderDateTime = new Date(
      `${reminder.reminderDate}T${reminder.reminderTime}`,
    );

    if (reminderDateTime <= now)
      return { status: "overdue", color: "text-red-400" };
    return { status: "pending", color: "text-blue-400" };
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Reminders</h3>
          <span className="bg-blue-900/20 text-blue-400 text-xs px-2 py-1 rounded-full">
            {reminders.length}
          </span>
        </div>

        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Reminder
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">
              {editingReminder ? "Edit Reminder" : "Create New Reminder"}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={newReminder.title}
                onChange={(e) =>
                  setNewReminder((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter reminder title..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newReminder.description}
                onChange={(e) =>
                  setNewReminder((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter reminder description..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  value={newReminder.reminderDate}
                  onChange={(e) =>
                    setNewReminder((prev) => ({
                      ...prev,
                      reminderDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Time *
                </label>
                <input
                  type="time"
                  value={newReminder.reminderTime}
                  onChange={(e) =>
                    setNewReminder((prev) => ({
                      ...prev,
                      reminderTime: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reminder Type
              </label>
              <select
                value={newReminder.type}
                onChange={(e) =>
                  setNewReminder((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {reminderTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Recurring */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newReminder.isRecurring}
                  onChange={(e) =>
                    setNewReminder((prev) => ({
                      ...prev,
                      isRecurring: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">
                  Recurring Reminder
                </span>
              </label>

              {newReminder.isRecurring && (
                <select
                  value={newReminder.recurringPattern}
                  onChange={(e) =>
                    setNewReminder((prev) => ({
                      ...prev,
                      recurringPattern: e.target.value,
                    }))
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {recurringPatterns.map((pattern) => (
                    <option key={pattern.value} value={pattern.value}>
                      {pattern.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingReminder ? "Update Reminder" : "Create Reminder"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No reminders set for this note</p>
            <p className="text-sm text-gray-500 mt-1">
              Create a reminder to get notified about important tasks
            </p>
          </div>
        ) : (
          reminders.map((reminder) => {
            const { status, color } = getReminderStatus(reminder);

            return (
              <div
                key={reminder.id}
                className={`bg-gray-900 border rounded-lg p-4 ${
                  reminder.isCompleted
                    ? "border-green-700 opacity-75"
                    : "border-gray-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5
                        className={`font-medium ${
                          reminder.isCompleted
                            ? "text-gray-400 line-through"
                            : "text-white"
                        }`}
                      >
                        {reminder.title}
                      </h5>
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${color} bg-gray-800`}
                      >
                        {status}
                      </span>
                      {reminder.isRecurring && (
                        <span className="text-xs px-2 py-1 rounded-full text-purple-400 bg-purple-900/20">
                          {reminder.recurringPattern}
                        </span>
                      )}
                    </div>

                    {reminder.description && (
                      <p className="text-sm text-gray-400 mb-2">
                        {reminder.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(
                          reminder.reminderDate,
                          reminder.reminderTime,
                        )}
                      </span>
                      <span className="capitalize">
                        {reminder.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {!reminder.isCompleted && !reminder.isTriggered && (
                      <>
                        <button
                          onClick={() => markCompleted(reminder.id)}
                          className="p-1 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                          title="Mark as completed"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => editReminder(reminder)}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit reminder"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReminderSystem;
