"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Star,
  Loader2,
  ChevronLeft,
  ListTodo,
  Clock,
  AlertTriangle,
  PauseCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import BoardCard from "./BoardCard";
import BoardView from "./BoardView";
import CreateBoardModal from "./CreateBoardModal";
import CardModal from "./CardModal";
import boardApi from "../../../utils/boardApi";
import TaskList from "../TaskList";
import { usePermissions } from "../../../hooks/usePermissions";
import PermissionGuard from "../../common/PermissionGuard";

const BoardsView = ({ modelId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [deletingBoard, setDeletingBoard] = useState(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [individualTasks, setIndividualTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // Get user role from localStorage
  const auth = JSON.parse(localStorage.getItem("auth")) || {};
  const userRole = auth.user?.role;
  const isModel = userRole === "model";
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (modelId) {
      fetchBoards();
      fetchIndividualTasks();
    }
  }, [modelId]);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardApi.getAllBoards(modelId);
      setBoards(data);
    } catch (err) {
      console.error("Failed to fetch boards:", err);
      setError("Failed to load boards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchIndividualTasks = async () => {
    try {
      const response = await boardApi.getIndividualTasks(modelId);
      setIndividualTasks(response);
    } catch (error) {
      console.error("Failed to fetch individual tasks:", error);
    }
  };

  const handleCreateBoard = async (newBoard) => {
    if (isModel) {
      setError("Models are not authorized to create boards");
      return;
    }

    try {
      setLoading(true);
      const createdBoard = await boardApi.createBoard({
        ...newBoard,
        modelId,
      });
      setBoards([...boards, createdBoard]);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create board:", err);
      setError("Failed to create board. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await boardApi.createIndividualTask({
        ...taskData,
        modelId,
      });
      setIndividualTasks((prevTasks) => [response, ...(prevTasks || [])]);
      setShowCreateTaskModal(false);
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task. Please try again.");
    }
  };

  const handleTaskUpdate = async (taskData) => {
    try {
      const response = await boardApi.updateTask(taskData._id, taskData);
      setIndividualTasks((tasks) =>
        tasks?.map((task) => (task._id === response._id ? response : task)),
      );
      setSelectedTask(null);
    } catch (error) {
      console.error("Failed to update task:", error);
      alert("Failed to update task. Please try again.");
    }
  };

  const handleTaskComplete = async (task) => {
    try {
      const response = await boardApi.updateTask(task._id, {
        ...task,
        status: "completed",
      });
      setIndividualTasks((tasks) =>
        tasks?.map((t) => (t._id === response._id ? response : t)),
      );
    } catch (error) {
      console.error("Failed to complete task:", error);
      alert("Failed to complete task. Please try again.");
    }
  };

  const handleDeleteTask = async (task) => {
    try {
      if (!window.confirm("Are you sure you want to delete this task?")) {
        return;
      }
      await boardApi.deleteTask(task._id);
      setIndividualTasks((tasks) => tasks?.filter((t) => t._id !== task._id));
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  const handleTaskInProgress = async (task) => {
    try {
      const response = await boardApi.updateTask(task._id, {
        ...task,
        status: "in_progress",
      });
      setIndividualTasks((tasks) =>
        tasks?.map((t) => (t._id === response._id ? response : t)),
      );
    } catch (error) {
      console.error("Failed to move task to in progress:", error);
      alert("Failed to move task to in progress. Please try again.");
    }
  };

  const handlePutTaskOnHold = async (task) => {
    try {
      const reason = window.prompt(
        "Please enter the reason for putting this task on hold:",
      );
      if (!reason) return;

      const response = await boardApi.putTaskOnHold(task._id, reason);
      setIndividualTasks((tasks) =>
        tasks?.map((t) =>
          t._id === response._id ? { ...response, status: "on_hold" } : t,
        ),
      );
    } catch (error) {
      console.error("Failed to put task on hold:", error);
      alert("Failed to put task on hold. Please try again.");
    }
  };

  const toggleStar = async (boardId) => {
    if (isModel) {
      setError("Models are not authorized to modify boards");
      return;
    }

    const board = boards.find((b) => b._id === boardId);
    if (!board) return;

    try {
      await boardApi.updateBoard(boardId, { starred: !board.starred });
      setBoards(
        boards.map((b) =>
          b._id === boardId ? { ...b, starred: !b.starred } : b,
        ),
      );
    } catch (err) {
      console.error("Failed to update board:", err);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    try {
      setDeletingBoard(boardId);
      await boardApi.deleteBoard(boardId);

      // Update local state
      setBoards(boards.filter((board) => board._id !== boardId));
      setDeletingBoard(null);
    } catch (error) {
      console.error("Failed to delete board:", error);
      alert("Failed to delete board. Please try again.");
      setDeletingBoard(null);
    }
  };

  const handleBoardClick = (board) => {
    setSelectedBoard(board);
  };

  const handleBackToBoards = () => {
    setSelectedBoard(null);
    fetchBoards(); // Refresh boards list in case of any updates
  };

  const filteredBoards = boards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const starredBoards = filteredBoards.filter((board) => board.starred);
  const otherBoards = filteredBoards.filter((board) => !board.starred);

  const priorityConfig = {
    low: { text: "text-green-400", label: "Low" },
    medium: { text: "text-yellow-400", label: "Medium" },
    high: { text: "text-red-400", label: "High" },
    urgent: { text: "text-red-400", label: "Urgent" },
  };

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
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex items-center gap-2 text-blue-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading boards...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-red-400 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (selectedBoard) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 p-4 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
          <button
            onClick={handleBackToBoards}
            className="flex items-center gap-2 dark:text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="dark:text-white text-[#1F2937]">
              Back to Boards
            </span>
          </button>
          <h1 className="text-xl font-bold dark:text-white text-[#1F2937] truncate">
            {selectedBoard.title}
          </h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <BoardView board={selectedBoard} onBoardUpdate={fetchBoards} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold dark:text-white text-[#1F2937] mb-2">
              Model Tasks
            </h1>
            <p className="dark:text-white text-[#1F2937]">
              Manage tasks and track progress
            </p>
          </div>
          {!isModel && (
            <div className="flex items-center gap-4">
              <PermissionGuard permission="tasks.create">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateTaskModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-lg transition-colors duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Create Task
                </motion.button>
              </PermissionGuard>
              <PermissionGuard permission="tasks.create">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-lg transition-colors duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Create Board
                </motion.button>
              </PermissionGuard>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-white text-[#1F2937] w-5 h-5" />
            <input
              type="text"
              placeholder="Search boards and tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 dark:bg-gray-800 border border-gray-700 rounded-lg dark:text-white text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Starred Boards */}
        {starredBoards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              Starred Boards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {starredBoards.map((board, index) => (
                <BoardCard
                  key={board._id}
                  board={board}
                  index={index}
                  onToggleStar={toggleStar}
                  onClick={() => handleBoardClick(board)}
                  isModel={isModel}
                  onDelete={handleDeleteBoard}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Boards */}
        <div>
          <h2 className="text-xl font-semibold dark:text-white text-[#1F2937] mb-4">
            All Boards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherBoards.map((board, index) => (
              <BoardCard
                key={board._id}
                board={board}
                index={index}
                onToggleStar={toggleStar}
                onClick={() => handleBoardClick(board)}
                isModel={isModel}
                onDelete={handleDeleteBoard}
              />
            ))}
          </div>
        </div>

        {/* Individual Tasks Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold dark:text-white text-[#1F2937] mb-6 flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            Tasks
          </h2>
          <TaskList
            tasks={individualTasks?.filter(
              (task) =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase()),
            )}
            onTaskClick={setSelectedTask}
            onTaskComplete={handleTaskComplete}
            onTaskInProgress={handleTaskInProgress}
            onTaskHold={handlePutTaskOnHold}
            onTaskDelete={handleDeleteTask}
            isModel={isModel}
          />
        </div>

        {/* Empty State */}
        {filteredBoards.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white mb-2">
                No boards found
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm
                  ? "No boards match your search. Try different keywords."
                  : isModel
                    ? "No tasks have been assigned to you yet."
                    : "Create your first board to get started!"}
              </p>
              {!isModel && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Create Board
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showCreateModal && !isModel && (
        <CreateBoardModal
          onClose={() => setShowCreateModal(false)}
          onCreateBoard={handleCreateBoard}
        />
      )}

      {/* Create/Edit Task Modal */}
      {(showCreateTaskModal || selectedTask) && (
        <CardModal
          card={selectedTask}
          onClose={() => {
            setSelectedTask(null);
            setShowCreateTaskModal(false);
          }}
          onUpdate={selectedTask ? handleTaskUpdate : handleCreateTask}
        />
      )}
    </div>
  );
};

export default BoardsView;
