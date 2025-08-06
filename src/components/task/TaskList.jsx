import { useState } from "react";
import {
  Clock,
  AlertTriangle,
  PauseCircle,
  CheckCircle2,
  Trash2,
  PlayCircle,
  ListTodo,
} from "lucide-react";
import boardApi from "../../utils/boardApi";
import { usePermissions } from "../../hooks/usePermissions";

const TaskList = ({
  tasks,
  onTaskClick,
  onTaskComplete,
  onTaskHold,
  onTaskDelete,
  onTaskInProgress,
  isModel,
}) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const { hasPermission } = usePermissions();

  const priorityConfig = {
    critical: { color: "bg-red-500", text: "text-red-500", label: "Critical" },
    high: { color: "bg-orange-500", text: "text-orange-500", label: "High" },
    medium: {
      color: "bg-yellow-500",
      text: "text-yellow-500",
      label: "Medium",
    },
    low: { color: "bg-blue-500", text: "text-blue-500", label: "Low" },
  };

  const statusConfig = {
    all: { label: "All Tasks", color: "bg-gray-500" },
    todo: { label: "To Do", color: "bg-blue-500", icon: ListTodo },
    in_progress: {
      label: "In Progress",
      color: "bg-yellow-500",
      icon: PlayCircle,
    },
    completed: {
      label: "Completed",
      color: "bg-green-500",
      icon: CheckCircle2,
    },
    on_hold: { label: "On Hold", color: "bg-red-500", icon: PauseCircle },
  };

  const filteredTasks = tasks?.filter((task) => {
    if (statusFilter === "all") return true;
    return task.status === statusFilter;
  });

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return "";
    const today = new Date();
    const taskDate = new Date(dueDate);

    if (taskDate < today) {
      return "text-red-400";
    } else if (taskDate.toDateString() === today.toDateString()) {
      return "text-yellow-400";
    }
    return "text-green-400";
  };

  const formatDueDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div>
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? `${config.color} text-white`
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            {config.icon && <config.icon className="w-4 h-4" />}
            <span>{config.label}</span>
            <span className="ml-1 bg-black/20 px-2 py-0.5 rounded-full text-sm">
              {tasks?.filter(
                (task) => status === "all" || task.status === status,
              ).length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 pb-16 gap-4">
        {filteredTasks?.map((task) => (
          <div
            key={task._id}
            onClick={() => onTaskClick(task)}
            className={`bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors relative group ${
              task.status === "completed"
                ? "border-l-4 border-green-500"
                : task.status === "on_hold"
                  ? "border-l-4 border-yellow-500"
                  : task.status === "in_progress"
                    ? "border-l-4 border-blue-500"
                    : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3
                  className={`text-lg font-medium text-white mb-2 ${
                    task.status === "completed"
                      ? "line-through text-gray-400"
                      : ""
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p
                    className={`text-gray-400 text-sm mb-3 line-clamp-2 ${
                      task.status === "completed" ? "line-through" : ""
                    }`}
                  >
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  {task.dueDate && (
                    <div
                      className={`flex items-center gap-1.5 ${
                        task.status === "completed"
                          ? "text-green-400"
                          : getDueDateStatus(task.dueDate)
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{formatDueDate(task.dueDate)}</span>
                    </div>
                  )}
                  {task.priority && (
                    <div
                      className={`flex items-center gap-1.5 ${priorityConfig[task.priority].text}`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>{priorityConfig[task.priority].label}</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div
                    className={`flex items-center gap-1.5 ${statusConfig[task.status].color} bg-opacity-10 px-2 py-1 rounded-full`}
                  >
                    {(() => {
                      const Icon = statusConfig[task.status].icon;
                      return Icon ? (
                        <Icon
                          className={`w-4 h-4 ${statusConfig[task.status].color.replace("bg-", "text-")}`}
                        />
                      ) : null;
                    })()}
                    <span
                      className={statusConfig[task.status].color.replace(
                        "bg-",
                        "text-",
                      )}
                    >
                      {statusConfig[task.status].label}
                    </span>
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {/* Only show complete and in progress buttons for models */}
                {isModel && (
                  <>
                    {task.status !== "completed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskComplete(task);
                        }}
                        className="p-1.5 text-gray-400 hover:text-green-400 rounded-full hover:bg-green-400/10 transition-all"
                        title="Mark as complete"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {task.status === "todo" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskInProgress(task);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-400 rounded-full hover:bg-blue-400/10 transition-all"
                        title="Move to In Progress"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}

                {/* Show hold button for both agency and model - requires tasks.assign or tasks.approve permission */}
                {task.status !== "on_hold" &&
                  task.status !== "completed" &&
                  (hasPermission("tasks.assign") ||
                    hasPermission("tasks.approve")) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskHold(task);
                      }}
                      className="p-1.5 text-gray-400 hover:text-yellow-400 rounded-full hover:bg-yellow-400/10 transition-all"
                      title="Put on hold"
                    >
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  )}

                {/* Show delete button only for agency with tasks.delete permission */}
                {!isModel && hasPermission("tasks.delete") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskDelete(task);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-red-400/10 transition-all"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;
