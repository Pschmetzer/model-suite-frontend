import React, { useEffect, useState, useCallback, useMemo } from "react";
import AddModelModal from "../../components/ui/AddModelModal";
import {
  Search,
  Plus,
  Settings,
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Edit,
  ArrowDown,
  Minus,
  StickyNote,
  GripVertical,
  Activity,
  Clock,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Check,
  Trash,
  Users,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import ReactDOM from "react-dom";
import { formatActiveTime } from "../../utils/functions";
import { stopActivityTracking } from "../../utils/socket";

// Add loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
  </div>
);

// Add retry utility
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        // Don't wait on last attempt
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1))); // Exponential backoff
      }
    }
  }

  throw lastError;
};

// Add toast component at the top with other components
const Toast = ({ message, type = "success", onClose, action }) => {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50`}
    >
      <span>{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="ml-4 underline hover:no-underline"
        >
          {action.label}
        </button>
      )}
      <button onClick={onClose} className="ml-4 hover:opacity-80">
        <X size={18} />
      </button>
    </div>
  );
};

// UI Components
const Button = ({
  variant = "default",
  size = "default",
  className = "",
  children,
  onClick,
  disabled,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "hover:bg-gray-800/50 text-gray-300",
  };
  const sizes = {
    default: "h-10 py-2 px-4",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Update the Avatar component to use transform GPU acceleration
const Avatar = ({ src, alt, fallback, className = "" }) => (
  <div
    className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full transform-gpu ${className}`}
  >
    {src ? (
      <img
        className="aspect-square h-full w-full object-cover"
        src={src}
        alt={alt}
        loading="lazy"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center rounded-full dark:bg-gray-600">
        <span className="text-sm font-medium dark:text-white">{fallback}</span>
      </div>
    )}
  </div>
);

const Badge = ({ children, className = "", color = "default" }) => {
  const colors = {
    default: "bg-blue-600 text-white",
    red: "bg-red-500 text-white",
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold transition-colors ${colors[color]} ${className}`}
    >
      {children}
    </div>
  );
};

// const Modal = ({ open, onClose, children }) => {
//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       <div className="fixed inset-0 bg-black/50" onClick={onClose} />
//       <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
//         {children}
//       </div>
//     </div>
//   );
// };

// const SearchInput = ({ value, onChange, placeholder, autoFocus }) => (
//   <input
//     type="text"
//     value={value}
//     onChange={onChange}
//     placeholder={placeholder}
//     autoFocus={autoFocus}
//     className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//   />
// );

const Tooltip = ({ text, children }) => (
  <div className="group relative">
    {children}
    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
      {text}
    </div>
  </div>
);

// Add these new components after the existing UI Components and before the Sidebar component
const CustomInsert = ({ type, content, onEdit, onDelete, isExpanded }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content || "");

  const handleSave = () => {
    onEdit(text);
    setIsEditing(false);
  };

  // Don't show editable elements when sidebar is collapsed
  if (!isExpanded) return null;

  switch (type) {
    case "spacer":
      return (
        <div className="group relative">
          <div className="h-8 my-2 bg-gray-800/30 rounded border border-dashed border-gray-700/30 hover:border-blue-500/30 transition-colors">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onDelete}
                className="text-gray-400 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      );
    case "divider":
      return (
        <div className="group relative my-4">
          <div className="flex items-center">
            <div className="flex-grow h-px bg-gray-700/50"></div>
            {isEditing ? (
              <div className="flex items-center space-x-2 mx-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white"
                  autoFocus
                  onBlur={handleSave}
                  onKeyPress={(e) => e.key === "Enter" && handleSave()}
                />
              </div>
            ) : (
              <div className="relative px-3 py-1 group-hover:bg-gray-800/50 rounded">
                <span className="text-xs text-gray-400">{text}</span>
                <div className="absolute -right-[45px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-gray-800/90 rounded-full px-1 py-0.5 ml-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-blue-400 p-0.5"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={onDelete}
                    className="text-gray-400 hover:text-red-400 p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex-grow h-px bg-gray-700/50"></div>
          </div>
        </div>
      );
    case "note":
      return (
        <div className="group relative my-2">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded text-white"
                autoFocus
                onBlur={handleSave}
                onKeyPress={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          ) : (
            <div className="relative bg-gray-800/30 rounded-lg p-2 border border-gray-700/30 group-hover:border-blue-500/30 transition-colors">
              <p className="text-sm text-gray-300 pr-8">{text}</p>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-gray-800/90 rounded-full px-1 py-0.5">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-400 hover:text-blue-400 p-0.5"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={onDelete}
                  className="text-gray-400 hover:text-red-400 p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
};

// Update the InsertMenu component with better UI
const InsertMenu = ({ onInsert, className = "", isExpanded }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleInsert = (type) => {
    onInsert(type);
    setIsOpen(false);
  };

  if (!isExpanded) return null;

  return (
    <div className={`relative ${className}`}>
      <div
        className="h-[1px] w-full bg-gray-800/50 relative group cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="bg-gray-800 hover:bg-gray-700 rounded-full p-1 shadow-lg border border-gray-700/50 flex items-center gap-1">
            <Plus size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400 pr-1">Insert</span>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700/50 overflow-hidden z-50 py-1">
          <button
            onClick={() => handleInsert("spacer")}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700/50 transition-colors flex items-center gap-2 group"
          >
            <div className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:bg-gray-600/50">
              <ArrowDown size={14} className="text-gray-400" />
            </div>
            <div>
              <span className="text-gray-300 font-medium">Add Spacer</span>
              <p className="text-xs text-gray-500">Add vertical space</p>
            </div>
          </button>
          <button
            onClick={() => handleInsert("divider")}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700/50 transition-colors flex items-center gap-2 group"
          >
            <div className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:bg-gray-600/50">
              <Minus size={14} className="text-gray-400" />
            </div>
            <div>
              <span className="text-gray-300 font-medium">Add Divider</span>
              <p className="text-xs text-gray-500">
                Horizontal line with label
              </p>
            </div>
          </button>
          <button
            onClick={() => handleInsert("note")}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700/50 transition-colors flex items-center gap-2 group"
          >
            <div className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:bg-gray-600/50">
              <StickyNote size={14} className="text-gray-400" />
            </div>
            <div>
              <span className="text-gray-300 font-medium">Add Note</span>
              <p className="text-xs text-gray-500">Custom text label</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

// Add this CSS class definition after the existing imports
const scrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(59, 130, 246, 0.5) rgba(17, 24, 39, 0.1);
    overflow-x: hidden;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 0; /* Disable horizontal scrollbar */
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(17, 24, 39, 0.1);
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(59, 130, 246, 0.5);
    border-radius: 3px;
    transition: background-color 0.2s ease;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(59, 130, 246, 0.7);
  }
`;

// Add the style tag to inject the CSS
const StyleTag = () => <style>{scrollbarStyles}</style>;

// Add this new component after the Toast component and before ModelWithInserts
const ContextMenu = ({ x, y, onClose, children }) => {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".context-menu")) {
        onClose();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="context-menu fixed z-[9999] bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 py-1 min-w-[180px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(${x + 180 > window.innerWidth ? "-100%" : "0"}, ${
          y + 200 > window.innerHeight ? "-100%" : "0"
        })`,
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

// Update the ModelWithInserts component to include context menu
const ModelWithInserts = ({
  user,
  index,
  isExpanded,
  customInserts,
  onEdit,
  onDelete,
  handleAddInsert,
  isDragging,
  dragHandleProps,
  groups = [],
  currentGroupId = "ungrouped",
  onChangeGroup,
}) => {
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (
      e.target.tagName.toLowerCase() === "button" ||
      e.target.tagName.toLowerCase() === "input" ||
      e.target.closest(".drag-handle")
    ) {
      return;
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e) => {
    if (
      e.target.tagName.toLowerCase() === "button" ||
      e.target.tagName.toLowerCase() === "input" ||
      e.target.closest(".drag-handle") ||
      e.target.closest(".context-menu")
    ) {
      return;
    }
    navigate(`agency/model-view/${user._id}`);
  };

  const insertsBeforeModel = customInserts.filter(
    (insert) => insert.position === index,
  );

  return (
    <>
      {insertsBeforeModel.map((insert) => (
        <CustomInsert
          key={insert.id}
          type={insert.type}
          content={insert.content}
          onEdit={(newContent) => onEdit(insert.id, newContent)}
          onDelete={() => onDelete(insert.id)}
          isExpanded={isExpanded}
        />
      ))}
      <div
        className="relative mb-2 transform-gpu group"
        onContextMenu={handleContextMenu}
      >
        <div
          className={`${
            isDragging ? "ring-2 ring-blue-500 bg-gray-800/50" : ""
          } rounded-lg`}
          onClick={handleClick}
        >
          {isExpanded ? (
            <div className="flex items-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div
                {...dragHandleProps}
                className="drag-handle cursor-grab active:cursor-grabbing p-2 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <GripVertical size={16} className="text-gray-400" />
              </div>
              <div className="relative flex-shrink-0">
                <Avatar
                  src={user.profilePhoto}
                  alt={user.fullName}
                  fallback={user.fullName?.[0]}
                  className="h-10 w-10 border-2 border-blue-600 shadow"
                />
                {user.lastOnline &&
                  Date.now() - new Date(user.lastOnline).getTime() <
                    5 * 60 * 1000 && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-900 transform-gpu"></div>
                  )}
              </div>
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-white font-medium text-sm truncate">
                  {user.fullName}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-gray-400 text-xs truncate">
                    {user.username}
                  </p>
                  {user.totalActiveMinutes > 0 && (
                    <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      {formatActiveTime(user.totalActiveMinutes)}
                    </span>
                  )}
                </div>
              </div>
              {/* Only show group indicator if grouping is enabled and not in ungrouped */}
              {currentGroupId !== "ungrouped" && groups.length > 0 && (
                <div className="ml-2 px-2 py-1 bg-gray-700/30 rounded text-xs text-gray-400">
                  {groups.find((g) => g.id === currentGroupId)?.name ||
                    "Unknown Group"}
                </div>
              )}
            </div>
          ) : (
            <Tooltip
              text={`${user.fullName} (${formatActiveTime(
                user.totalActiveMinutes,
              )})`}
            >
              <div className="flex justify-center relative p-2">
                <div
                  {...dragHandleProps}
                  className="drag-handle cursor-grab active:cursor-grabbing absolute left-0 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <GripVertical size={16} className="text-gray-400" />
                </div>
                <Avatar
                  src={user.profilePhoto}
                  alt={user.fullName}
                  fallback={user.fullName?.[0]}
                  className="h-12 w-12 border-2 border-blue-600 shadow"
                />
                {user.lastOnline &&
                  Date.now() - new Date(user.lastOnline).getTime() <
                    5 * 60 * 1000 && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-900 transform-gpu"></div>
                  )}
              </div>
            </Tooltip>
          )}
        </div>

        {/* Only show context menu if grouping is enabled and there are groups */}
        {contextMenu && groups.length > 0 && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
          >
            <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
              Move to Group
            </div>
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  onChangeGroup(user._id, group.id);
                  setContextMenu(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700/50 transition-colors flex items-center gap-2 ${
                  currentGroupId === group.id
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-gray-300"
                }`}
              >
                {currentGroupId === group.id && (
                  <Check size={14} className="text-blue-400" />
                )}
                <span className={currentGroupId === group.id ? "ml-0" : "ml-5"}>
                  {group.name}
                </span>
              </button>
            ))}
          </ContextMenu>
        )}
      </div>
    </>
  );
};

// Update the SortableModel component to support dragging between groups
const SortableModel = ({
  user,
  index,
  isExpanded,
  customInserts,
  onEdit,
  onDelete,
  handleAddInsert,
  groups = [],
  currentGroupId = "ungrouped",
  onChangeGroup,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: user._id,
    data: {
      index,
      user,
      customInserts: customInserts.filter(
        (insert) => insert.position === index,
      ),
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", user._id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <ModelWithInserts
        user={user}
        index={index}
        isExpanded={isExpanded}
        customInserts={customInserts}
        onEdit={onEdit}
        onDelete={onDelete}
        handleAddInsert={handleAddInsert}
        isDragging={isDragging}
        dragHandleProps={listeners}
        groups={groups}
        currentGroupId={currentGroupId}
        onChangeGroup={onChangeGroup}
      />
      <InsertMenu
        onInsert={(type) => handleAddInsert(type, index + 1)}
        className="my-1"
        isExpanded={isExpanded}
      />
    </div>
  );
};

// Update the SortMenu component to include isExpanded prop
const SortMenu = ({ onSort, currentSort, isOpen, onClose, isExpanded }) => {
  if (!isOpen) return null;

  const sortOptions = [
    {
      id: "name_asc",
      label: "Name (A-Z)",
      icon: <ArrowUp size={14} className="text-gray-400" />,
    },
    {
      id: "name_desc",
      label: "Name (Z-A)",
      icon: <ArrowDown size={14} className="text-gray-400" />,
    },
    {
      id: "date_desc",
      label: "Newest First",
      icon: <Clock size={14} className="text-gray-400" />,
    },
    {
      id: "date_asc",
      label: "Oldest First",
      icon: <Clock size={14} className="text-gray-400" />,
    },
    {
      id: "activity",
      label: "Most Active (Hours)",
      icon: <Activity size={14} className="text-gray-400" />,
    },
    {
      id: "manual",
      label: "Manual Order",
      icon: <GripVertical size={14} className="text-gray-400" />,
    },
  ];

  // Create portal to render at root level
  return ReactDOM.createPortal(
    <>
      {/* Backdrop with high z-index */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Menu container with even higher z-index */}
      <div
        className="fixed z-[9999]"
        style={{
          top: "64px", // Adjust based on your header height
          left: isExpanded ? "240px" : "76px", // Adjust based on your sidebar width
        }}
      >
        <div
          className="w-56 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onSort(option.id);
                  onClose();
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700/50 transition-colors flex items-center gap-3 ${
                  currentSort === option.id
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-gray-300"
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

// Add this component for managing groups
const GroupManager = ({ groups, onUpdateGroups }) => {
  const [newGroupName, setNewGroupName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      isCollapsed: false,
      order: groups.length,
    };

    onUpdateGroups([...groups, newGroup]);
    setNewGroupName("");
  };

  const handleEditGroup = (group) => {
    setEditingId(group.id);
    setEditName(group.name);
  };

  const handleSaveEdit = (group) => {
    if (!editName.trim()) return;

    onUpdateGroups(
      groups.map((g) =>
        g.id === group.id ? { ...g, name: editName.trim() } : g,
      ),
    );
    setEditingId(null);
  };

  const handleDeleteGroup = (groupId) => {
    onUpdateGroups(groups.filter((g) => g.id !== groupId));
  };

  return (
    <div className="space-y-4">
      {/* Add New Group */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New group name..."
          className="flex-1 px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded text-sm text-white placeholder-gray-400"
        />
        <button
          onClick={handleAddGroup}
          disabled={!newGroupName.trim()}
          className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded text-sm text-blue-400 hover:bg-blue-600/30 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Group List */}
      <div className="space-y-2">
        {groups.map((group) => (
          <div key={group.id} className="flex items-center gap-2 group">
            {editingId === group.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-sm text-white"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(group)}
                  className="text-green-400 hover:text-green-300 p-1"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-gray-400 hover:text-gray-300 p-1"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-300">
                  {group.name}
                </span>
                <button
                  onClick={() => handleEditGroup(group)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-300 p-1"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1"
                >
                  <Trash size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Update the SidebarSettings component to include group management
const SidebarSettings = ({
  isOpen,
  onClose,
  isGroupingEnabled,
  onToggleGrouping,
  groups,
  onUpdateGroups,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general"); // 'general' or 'groups'

  if (!isOpen) return null;

  const handleResetToDefault = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token found");

      // Reset all models to 'ungrouped'
      const resetAssignments = {};
      orderedModels.forEach((model) => {
        resetAssignments[model._id] = "ungrouped";
      });

      // Update backend
      for (const modelId of Object.keys(resetAssignments)) {
        await axios.put(
          `${baseUrl}/agency/model-group-assignment`,
          {
            modelId,
            groupId: "ungrouped",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      // Update local state
      setModelGroupAssignments(resetAssignments);

      setToast({
        show: true,
        message: "All models reset to Ungrouped",
        type: "success",
      });
    } catch (err) {
      console.error("Error resetting groups:", err);
      setToast({
        show: true,
        message: "Failed to reset groups",
        type: "error",
      });
    }
  };

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998]"
        onClick={onClose}
      />
      <div className="fixed z-[9999] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 w-80">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">
              Sidebar Settings
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === "general"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("general")}
            >
              General
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === "groups"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("groups")}
            >
              Groups
            </button>
          </div>

          <div className="p-4 space-y-4">
            {activeTab === "general" ? (
              <>
                {/* Grouping Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">
                      Enable Grouping
                    </h3>
                    <p className="text-xs text-gray-400">
                      Organize models into collapsible sections
                    </p>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isGroupingEnabled ? "bg-blue-600" : "bg-gray-700"
                    }`}
                    onClick={() => onToggleGrouping(!isGroupingEnabled)}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isGroupingEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Reset Layout Button */}
                <button
                  className="w-full px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10 rounded-md transition-colors"
                  onClick={handleResetToDefault}
                >
                  Reset to Default Groups
                </button>

                <div className="h-px bg-gray-700/50 my-2"></div>
              </>
            ) : (
              <GroupManager groups={groups} onUpdateGroups={onUpdateGroups} />
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

// Update ModelGroup props to include fetchGroupsAndModels and setToast
const ModelGroup = ({
  group,
  models,
  isExpanded,
  customInserts,
  onEdit,
  onDelete,
  handleAddInsert,
  onToggleCollapse,
  onDragEnd,
  groups,
  onChangeGroup,
  modelGroupAssignments,
  setModelGroupAssignments,
  fetchGroupsAndModels,
  setToast,
  setModels,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isOver, setIsOver] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;

  // Handle group toggle
  const handleGroupToggle = (e) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  // Get models in this group
  const groupModels = useMemo(() => {
    console.log("Group:", group.id, "Models:", models);
    console.log("Current assignments:", modelGroupAssignments);

    const filteredModels = models.filter((model) => {
      const assignment = modelGroupAssignments[model._id];
      console.log("Model:", model._id, "Assignment:", assignment);

      if (group.id === "ungrouped") {
        return !assignment || assignment === "ungrouped";
      }
      return assignment === group.id;
    });

    console.log("Filtered models for group", group.id, ":", filteredModels);
    return filteredModels;
  }, [models, modelGroupAssignments, group.id]);

  // When clicking add button
  const handleAddClick = (e) => {
    e.stopPropagation();
    setShowAddModel(!showAddModel);
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  };

  // Inside ModelGroup component, add back the handleSearch function
  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/agency/agency-models`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter models based on search term and current assignments
      const filteredModels = (response.data.data.models || []).filter(
        (model) => {
          const matchesSearch =
            (model.fullName?.toLowerCase() || "").includes(
              term.toLowerCase(),
            ) ||
            (model.username?.toLowerCase() || "").includes(term.toLowerCase());

          // A model is available if it's not in any group or is in 'ungrouped'
          const currentGroup = modelGroupAssignments[model._id];
          const isAvailable = !currentGroup || currentGroup === "ungrouped";

          return matchesSearch && isAvailable;
        },
      );

      setSearchResults(filteredModels);
    } catch (error) {
      console.error("Error searching models:", error);
      setToast({
        show: true,
        message: "Failed to search models",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add handleAddToGroup function to ModelGroup component
  const handleAddToGroup = async (modelId) => {
    setIsLoading(true);
    try {
      const response = await axios.put(
        `${baseUrl}/agency/model-group-assignment`,
        { modelId, groupId: group.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Add to group response:", response.data);

      if (response.data.success) {
        // Update local state with new assignments
        setModelGroupAssignments((prev) => {
          const newAssignments = { ...prev, ...response.data.assignments };
          console.log("New assignments:", newAssignments);
          return newAssignments;
        });

        // Reset search state
        setShowAddModel(false);
        setSearchTerm("");
        setSearchResults([]);

        // Show success message
        setToast({
          show: true,
          message: "Model added to group successfully",
          type: "success",
        });

        // Expand the group to show the newly added model
        setIsCollapsed(false);

        // Force a re-render of the group
        setModels((prevModels) => [...prevModels]);
      }
    } catch (error) {
      console.error("Error adding model to group:", error);
      setToast({
        show: true,
        message:
          error.response?.data?.message || "Failed to add model to group",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add handleRemoveFromGroup function
  const handleRemoveFromGroup = async (modelId) => {
    setIsLoading(true);
    try {
      const response = await axios.put(
        `${baseUrl}/agency/model-group-assignment`,
        { modelId, groupId: "ungrouped" },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        // Update local state
        setModelGroupAssignments(response.data.assignments);

        // Show success message
        setToast({
          show: true,
          message: "Model removed from group",
          type: "success",
        });

        // Refresh the models list
        await fetchGroupsAndModels();
      }
    } catch (error) {
      console.error("Error removing model from group:", error);
      setToast({
        show: true,
        message: "Failed to remove model from group",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`mb-4 rounded-lg transition-colors ${
        isOver ? "bg-blue-500/10" : ""
      }`}
    >
      {/* Group Header */}
      <div
        className={`flex items-center justify-between ${
          isExpanded ? "px-2 py-1.5" : "p-1"
        } hover:bg-gray-800/30 rounded-lg group`}
      >
        {isExpanded ? (
          <>
            <div
              className="flex items-center gap-2 flex-1 cursor-pointer"
              onClick={handleGroupToggle}
            >
              {isCollapsed ? (
                <ChevronRight size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-300">
                {group.name}
              </span>
              <span className="text-xs text-gray-500">
                ({groupModels.length})
              </span>
            </div>

            <button
              onClick={handleAddClick}
              className="p-1 hover:bg-gray-700/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus size={16} className="text-gray-400" />
            </button>
          </>
        ) : (
          // Collapsed sidebar view
          <Tooltip text={`${group.name} (${groupModels.length})`}>
            <div className="w-full">
              <div
                className="flex flex-col items-center gap-1 cursor-pointer p-1"
                onClick={handleGroupToggle}
              >
                <div className="relative">
                  {groupModels.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white">
                        {groupModels.length}
                      </span>
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                    <span className="text-sm text-gray-300">
                      {group.name[0].toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Tooltip>
        )}
      </div>

      {/* Search and Models List */}
      {(showAddModel || !isCollapsed) && (
        <div className={`mt-2 ${isExpanded ? "pl-6" : "px-1"} space-y-2`}>
          {/* Search Box */}
          {showAddModel && (
            <div
              className={`mb-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700/50 ${
                !isExpanded && "absolute left-16 z-50 w-64 shadow-lg"
              }`}
            >
              <input
                type="text"
                placeholder="Search your models..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded text-sm text-white placeholder-gray-400"
                autoFocus
              />
              {isLoading && (
                <div className="mt-2 text-center">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                </div>
              )}
              {!isLoading && searchResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {searchResults.map((model) => (
                    <div
                      key={model._id}
                      onClick={() => handleAddToGroup(model._id)}
                      className="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {model.profilePhoto ? (
                          <img
                            src={model.profilePhoto}
                            alt={model.fullName}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <Users size={16} className="text-gray-400" />
                        )}
                        <span className="text-sm text-gray-300">
                          {model.fullName || model.username}
                        </span>
                      </div>
                      <Plus size={14} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && searchTerm && searchResults.length === 0 && (
                <div className="mt-2 text-sm text-gray-400 text-center">
                  No available models found
                </div>
              )}
            </div>
          )}

          {/* Models List */}
          {!isCollapsed && (
            <div className="space-y-1">
              {groupModels.map((model) => (
                <div
                  key={model._id}
                  className={`flex items-center space-x-2 p-2 hover:bg-gray-800/50 rounded group ${
                    !isExpanded && "justify-center"
                  }`}
                >
                  {isExpanded ? (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        {model.profilePhoto ? (
                          <img
                            src={model.profilePhoto}
                            alt={model.fullName}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <Users size={16} className="text-gray-400" />
                        )}
                        <span className="text-sm text-gray-300">
                          {model.fullName || model.username}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFromGroup(model._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700/50 rounded transition-opacity"
                      >
                        <X size={14} className="text-gray-400" />
                      </button>
                    </>
                  ) : (
                    <Tooltip text={model.fullName || model.username}>
                      {model.profilePhoto ? (
                        <img
                          src={model.profilePhoto}
                          alt={model.fullName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                          <span className="text-sm text-gray-300">
                            {(model.fullName ||
                              model.username)[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </Tooltip>
                  )}
                </div>
              ))}
              {groupModels.length === 0 && isExpanded && (
                <div className="py-4 text-center text-sm text-gray-400">
                  No models in this group
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Update the Sidebar component to include the settings button and modal
const Sidebar = () => {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // All state declarations in one place
  const [models, setModels] = useState([]);
  const [orderedModels, setOrderedModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModelOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [customInserts, setCustomInserts] = useState([]);
  const [isLoadingInserts, setIsLoadingInserts] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSort, setCurrentSort] = useState("manual");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [groups, setGroups] = useState([
    { id: "vip", name: "VIP Models", isCollapsed: false, order: 0 },
    { id: "attention", name: "Needs Attention", isCollapsed: false, order: 1 },
    { id: "inactive", name: "Inactive", isCollapsed: false, order: 2 },
    { id: "ungrouped", name: "Ungrouped", isCollapsed: false, order: 3 },
  ]);
  const [modelGroupAssignments, setModelGroupAssignments] = useState({});
  const [isGroupingEnabled, setIsGroupingEnabled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Add this constant at the top of the file after imports
  const DEFAULT_GROUPS = [
    { id: "vip", name: "VIP Models", isCollapsed: false, order: 0 },
    { id: "attention", name: "Needs Attention", isCollapsed: false, order: 1 },
    { id: "inactive", name: "Inactive", isCollapsed: false, order: 2 },
    { id: "ungrouped", name: "Ungrouped", isCollapsed: false, order: 3 },
  ];

  // Add this function to handle grouping toggle
  const handleToggleGrouping = async (enabled) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token found");

      // Save preference to localStorage
      localStorage.setItem("sidebarGroupingEnabled", JSON.stringify(enabled));

      setIsGroupingEnabled(enabled);

      if (enabled) {
        // When enabling grouping, always start with default groups
        setGroups(DEFAULT_GROUPS);

        // Save default groups to backend
        await axios.put(
          `${baseUrl}/agency/model-groups`,
          { groups: DEFAULT_GROUPS },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Initialize empty assignments (all models will be in 'ungrouped' by default)
        const initialAssignments = {};
        orderedModels.forEach((model) => {
          initialAssignments[model._id] = "ungrouped";
        });
        setModelGroupAssignments(initialAssignments);
      } else {
        // When disabling grouping, clear group assignments
        setModelGroupAssignments({});
        // Clear groups
        setGroups([]);
      }
    } catch (err) {
      console.error("Error toggling grouping:", err);
      setToast({
        show: true,
        message: "Failed to update grouping settings",
        type: "error",
      });
    }
  };

  // Add this effect to load grouping preference
  useEffect(() => {
    const savedGroupingEnabled = localStorage.getItem("sidebarGroupingEnabled");
    if (savedGroupingEnabled !== null) {
      setIsGroupingEnabled(JSON.parse(savedGroupingEnabled));
    }
  }, []);

  // Add this effect to initialize and load groups
  useEffect(() => {
    // Load saved groups or use defaults
    const savedGroups = localStorage.getItem("sidebarGroups");
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    } else {
      const defaultGroups = [
        { id: "vip", name: "VIP Models", isCollapsed: false, order: 0 },
        {
          id: "attention",
          name: "Needs Attention",
          isCollapsed: false,
          order: 1,
        },
        { id: "inactive", name: "Inactive", isCollapsed: false, order: 2 },
        { id: "ungrouped", name: "Ungrouped", isCollapsed: false, order: 3 },
      ];
      setGroups(defaultGroups);
      localStorage.setItem("sidebarGroups", JSON.stringify(defaultGroups));
    }
  }, []);

  // Add this effect to save groups when they change
  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem("sidebarGroups", JSON.stringify(groups));
    }
  }, [groups]);

  // Add this function to handle group updates
  const handleUpdateGroups = async (newGroups) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token found");

      // Save to backend
      await axios.put(
        `${baseUrl}/agency/model-groups`,
        { groups: newGroups },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Update local state
      setGroups(newGroups);

      // Show success toast
      setToast({
        show: true,
        message: "Groups updated successfully",
        type: "success",
      });
    } catch (err) {
      console.error("Error updating groups:", err);
      setToast({
        show: true,
        message: "Failed to update groups",
        type: "error",
      });
    }
  };

  // Add this effect to fetch custom inserts on mount
  useEffect(() => {
    const fetchCustomInserts = async () => {
      try {
        setIsLoadingInserts(true);
        const token = JSON.parse(localStorage.getItem("auth"))?.token;
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.get(`${baseUrl}/agency/custom-inserts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCustomInserts(response.data || []);
      } catch (err) {
        console.error("Error fetching custom inserts:", err);
        setToast({
          show: true,
          message: "Failed to load custom sections. Please refresh the page.",
          type: "error",
        });
      } finally {
        setIsLoadingInserts(false);
      }
    };

    fetchCustomInserts();
  }, []);

  // Debounced persist function to avoid too many API calls
  const debouncedPersist = useCallback(
    debounce(async (inserts) => {
      try {
        const token = JSON.parse(localStorage.getItem("auth"))?.token;
        if (!token) {
          throw new Error("No authentication token found");
        }

        await axios.put(
          `${baseUrl}/agency/custom-inserts`,
          { customInserts: inserts },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } catch (err) {
        console.error("Error saving custom inserts:", err);
        setToast({
          show: true,
          message: "Failed to save changes. Please try again.",
          type: "error",
        });
      }
    }, 1000),
    [],
  );

  // Update the useEffect that fetches models to include sorting preference
  useEffect(() => {
    const fetchAgencyModels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = JSON.parse(localStorage.getItem("auth"))?.token;
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.get(`${baseUrl}/agency/agency-models`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Get saved sort preference
        const savedSort =
          localStorage.getItem("modelSortPreference") || "manual";
        setCurrentSort(savedSort);

        setModels(response.data.data.models || []);

        // Apply initial sorting
        const initialSortedModels = applySorting(
          response.data.data.models || [],
          savedSort,
        );
        setOrderedModels(initialSortedModels);
      } catch (err) {
        setError(err.message || "Failed to fetch models");
        console.error("Error fetching models:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgencyModels();
  }, []);

  // Add this helper function for sorting
  const applySorting = (models, sortType) => {
    let sortedModels = [...models];
    console.log("Applying sorting:", sortedModels);
    switch (sortType) {
      case "name_asc":
        return sortedModels.sort((a, b) =>
          (a.fullName || "").localeCompare(b.fullName || ""),
        );
      case "name_desc":
        return sortedModels.sort((a, b) =>
          (b.fullName || "").localeCompare(a.fullName || ""),
        );
      case "date_desc":
        return sortedModels.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
      case "date_asc":
        return sortedModels.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
      case "activity":
        return sortedModels.sort((a, b) => {
          // Sort by total active minutes
          const aMinutes = a.totalActiveMinutes || 0;
          const bMinutes = b.totalActiveMinutes || 0;

          if (bMinutes !== aMinutes) {
            return bMinutes - aMinutes; // Most active first
          }

          // If equal active minutes, use lastOnline as tiebreaker
          const aOnline = a.lastOnline ? new Date(a.lastOnline) : new Date(0);
          const bOnline = b.lastOnline ? new Date(b.lastOnline) : new Date(0);
          return bOnline - aOnline;
        });
      case "manual":
      default:
        return sortedModels.sort((a, b) => {
          const aIndex = a.orderIndex || 0;
          const bIndex = b.orderIndex || 0;
          return aIndex - bIndex;
        });
    }
  };

  // Update the handleSort function
  const handleSort = async (sortType) => {
    // Save sort preference
    localStorage.setItem("modelSortPreference", sortType);
    setCurrentSort(sortType);

    // Apply sorting
    const sortedModels = applySorting(orderedModels, sortType);
    setOrderedModels(sortedModels);

    // If switching to manual order, save the current order to the database
    if (sortType === "manual") {
      try {
        setIsSaving(true);
        const token = JSON.parse(localStorage.getItem("auth"))?.token;
        if (!token) throw new Error("No authentication token found");

        await axios.put(
          `${baseUrl}/agency/model-order`,
          {
            modelOrder: sortedModels.map((model, index) => ({
              id: model._id,
              orderIndex: index,
            })),
            customInserts,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setToast({
          show: true,
          message: "Order saved successfully",
          type: "success",
        });
      } catch (err) {
        console.error("Error saving order:", err);
        setToast({
          show: true,
          message: "Failed to save order",
          type: "error",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleGlobalModelSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(`${baseUrl}/agency/models`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search: query,
        },
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error("Error searching models:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddModelToAgency = async (modelToAdd) => {
    if (!modelToAdd) return;

    setIsAddingModel(true);
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) {
        throw new Error("Authentication token not found. Please log in.");
      }

      const response = await axios.post(
        `${baseUrl}/agency/add-model`,
        { modelId: modelToAdd._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Fetch updated models list after adding new model
      const updatedModelsResponse = await axios.get(
        `${baseUrl}/agency/agency-models`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setModels(updatedModelsResponse.data.data.models || []); // Ensure we always set an array
      setSelectedUser(null); // Reset selected user
      closeModal(); // Close the modal after successful addition

      setToast({
        show: true,
        message: `✨ ${modelToAdd.fullName} has been added to your agency`,
        type: "success",
      });

      setTimeout(() => {
        setToast({ show: false, message: "", type: "success" });
      }, 3000);
    } catch (err) {
      setToast({
        show: true,
        message: `Failed to add ${modelToAdd.fullName}: ${err.message}`,
        type: "error",
      });
      console.error("Error adding model to agency:", err);
    } finally {
      setIsAddingModel(false);
    }
  };

  const openModal = () => {
    setIsAddModelOpen(true);
    setSearchQuery("");
    setSelectedUser(null);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
    setIsAddModelOpen(false);
  };

  const openSearch = () => {
    setIsSearchOpen(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleCustomize = () => {
    setIsCustomizeOpen(!isCustomizeOpen);
  };

  // Update the existing handlers to use optimistic updates and debounced persistence
  const handleAddInsert = (type, position) => {
    const newInsert = {
      id: Date.now().toString(),
      type,
      content:
        type === "note" ? "New Note" : type === "divider" ? "Section" : "",
      position,
    };
    const updatedInserts = [...customInserts, newInsert];
    setCustomInserts(updatedInserts);
    debouncedPersist(updatedInserts);
  };

  const handleEditInsert = (id, newContent) => {
    const updatedInserts = customInserts.map((insert) =>
      insert.id === id ? { ...insert, content: newContent } : insert,
    );
    setCustomInserts(updatedInserts);
    debouncedPersist(updatedInserts);
  };

  const handleDeleteInsert = (id) => {
    const updatedInserts = customInserts.filter((insert) => insert.id !== id);
    setCustomInserts(updatedInserts);
    debouncedPersist(updatedInserts);
  };

  // Add sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Only activate on the drag handle
      activationConstraint: {
        distance: 0, // Start immediately when dragging the handle
        delay: 0, // No delay needed since we're using a handle
      },
      // Only start drag from the handle
      handleEvent: (event) => {
        return event.target.closest(".drag-handle") !== null;
      },
    }),
  );

  // Add this effect to initialize ordered models
  useEffect(() => {
    if (!isLoading && models.length > 0) {
      // Check if agency has a saved order
      const savedOrder = models.sort((a, b) => {
        const aIndex = a.orderIndex || 0;
        const bIndex = b.orderIndex || 0;
        return aIndex - bIndex;
      });
      setOrderedModels(savedOrder);
    }
  }, [isLoading, models]);

  const handleDragStart = (event) => {
    setIsDragging(true);
    document.body.classList.add("select-none");
  };

  const saveChanges = async (updatedOrder, updatedInserts) => {
    const token = JSON.parse(localStorage.getItem("auth"))?.token;
    if (!token) {
      throw new Error("No authentication token found");
    }

    return Promise.all([
      axios.put(
        `${baseUrl}/agency/model-order`,
        {
          modelOrder: updatedOrder.map((model) => ({
            id: model._id,
            orderIndex: model.orderIndex,
          })),
          customInserts: updatedInserts, // Send both updates in one request
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    ]);
  };

  // Update the handleDragEnd function to respect sorting
  const handleDragEnd = async (event) => {
    // Only allow dragging in manual sort mode
    if (currentSort !== "manual") {
      setToast({
        show: true,
        message: "Switch to Manual Order to reorder models",
        type: "info",
        action: {
          label: "Switch",
          onClick: () => handleSort("manual"),
        },
      });
      return;
    }

    setIsDragging(false);
    document.body.classList.remove("select-none");

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedModels.findIndex(
      (model) => model._id === active.id,
    );
    const newIndex = orderedModels.findIndex((model) => model._id === over.id);

    // Store original state for rollback
    const originalModels = [...orderedModels];
    const originalInserts = [...customInserts];

    // Create new array with updated order
    const newOrder = arrayMove(orderedModels, oldIndex, newIndex);

    // Update the order indices
    const updatedOrder = newOrder.map((model, index) => ({
      ...model,
      orderIndex: index,
    }));

    // Update insert positions based on new model order
    const updatedInserts = customInserts.map((insert) => {
      if (insert.position === oldIndex) {
        return { ...insert, position: newIndex };
      }
      if (insert.position > oldIndex && insert.position <= newIndex) {
        return { ...insert, position: insert.position - 1 };
      }
      if (insert.position < oldIndex && insert.position >= newIndex) {
        return { ...insert, position: insert.position + 1 };
      }
      return insert;
    });

    // Optimistically update UI
    setOrderedModels(updatedOrder);
    setCustomInserts(updatedInserts);

    // Show saving indicator
    setIsSaving(true);

    try {
      await retryOperation(
        () => saveChanges(updatedOrder, updatedInserts),
        3, // max retries
        1000, // base delay in ms
      );

      setToast({
        show: true,
        message: "Changes saved successfully",
        type: "success",
      });
    } catch (err) {
      console.error("Error updating order:", err);

      // Show error message with retry option
      setToast({
        show: true,
        message: "Failed to save changes. Click to retry.",
        type: "error",
        action: {
          label: "Retry",
          onClick: async () => {
            try {
              await retryOperation(
                () => saveChanges(updatedOrder, updatedInserts),
                3,
                1000,
              );
              setToast({
                show: true,
                message: "Changes saved successfully",
                type: "success",
              });
            } catch (retryErr) {
              console.error("Error retrying save:", retryErr);
              setToast({
                show: true,
                message: "Failed to save changes. Please refresh the page.",
                type: "error",
              });
              // Revert to original state
              setOrderedModels(originalModels);
              setCustomInserts(originalInserts);
            }
          },
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Keep only this handleModelClick implementation
  const handleModelClick = (modelId, e) => {
    if (isDragging) {
      e.preventDefault();
      return;
    }
    navigate(`agency/model-view/${modelId}`);
  };

  // Add useEffect to handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsSortMenuOpen(false);
      }
    };

    if (isSortMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent scrolling when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      // Restore scrolling when menu is closed
      document.body.style.overflow = "";
    };
  }, [isSortMenuOpen]);

  // Add this effect to load group assignments
  useEffect(() => {
    const fetchGroupAssignments = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("auth"))?.token;
        if (!token) throw new Error("No authentication token found");

        const response = await axios.get(`${baseUrl}/agency/model-groups`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setGroups(response.data.groups || []);
          setModelGroupAssignments(response.data.assignments || {});
        } else {
          throw new Error(response.data.message || "Failed to fetch groups");
        }
      } catch (err) {
        console.error("Error fetching group assignments:", err);
        setToast({
          show: true,
          message: "Failed to load groups. Please refresh the page.",
          type: "error",
        });
      }
    };

    if (isGroupingEnabled) {
      fetchGroupAssignments();
    }
  }, [isGroupingEnabled]);

  // Add group toggle handler
  const handleToggleGroup = async (groupId, isCollapsed) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token found");

      await axios.put(
        `${baseUrl}/agency/model-groups/${groupId}`,
        { isCollapsed },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setGroups(
        groups.map((g) => (g.id === groupId ? { ...g, isCollapsed } : g)),
      );
    } catch (err) {
      console.error("Error updating group:", err);
    }
  };

  // Update the handleGroupDragEnd function to properly handle API calls
  const handleGroupDragEnd = async (event, targetGroupId) => {
    const { active } = event;
    if (!active) return;

    try {
      const modelId = active.id;
      const response = await axios.put(
        `${baseUrl}/agency/model-group-assignment`,
        { modelId, groupId: targetGroupId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

     

      if (response.data.success) {
        setModelGroupAssignments((prev) => ({
          ...prev,
          ...response.data.assignments,
        }));
        await fetchGroupsAndModels();
      }
    } catch (error) {
      console.error("Error moving model to group:", error);
      setToast({
        show: true,
        message: "Failed to move model to group",
        type: "error",
      });
    }
  };

  // Helper function to get models by group
  const getModelsByGroup = (groupId) => {
    if (!isGroupingEnabled) return orderedModels;
    return orderedModels.filter(
      (model) => (modelGroupAssignments[model._id] || "ungrouped") === groupId,
    );
  };

  // Add this function after handleGroupDragEnd
  const handleChangeGroup = async (modelId, newGroupId) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token found");

      const model = orderedModels.find((m) => m._id === modelId);
      if (!model) throw new Error("Model not found");

      const oldGroupId = modelGroupAssignments[modelId] || "ungrouped";

      // Don't do anything if moving to same group
      if (oldGroupId === newGroupId) return;

      // Optimistically update UI
      setModelGroupAssignments((prev) => ({
        ...prev,
        [modelId]: newGroupId,
      }));

      // Show loading toast
      setToast({
        show: true,
        message: `Moving ${model.fullName} to ${
          groups.find((g) => g.id === newGroupId)?.name
        }...`,
        type: "info",
      });

      // Make API call
      const response = await axios.put(
        `${baseUrl}/agency/model-group-assignment`,
        {
          modelId,
          groupId: newGroupId,
          sourceGroupId: oldGroupId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data.success && response.data.error) {
        throw new Error(response.data.error);
      }

      // Show success toast with undo option
      setToast({
        show: true,
        message: `${model.fullName} moved to ${
          groups.find((g) => g.id === newGroupId)?.name
        }`,
        type: "success",
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              // Optimistically update UI for undo
              setModelGroupAssignments((prev) => ({
                ...prev,
                [modelId]: oldGroupId,
              }));

              // Make API call to undo
              await axios.put(
                `${baseUrl}/agency/model-group-assignment`,
                {
                  modelId,
                  groupId: oldGroupId,
                  sourceGroupId: newGroupId,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              setToast({
                show: true,
                message: `${model.fullName} moved back to ${
                  groups.find((g) => g.id === oldGroupId)?.name
                }`,
                type: "success",
              });
            } catch (err) {
              console.error("Error undoing group change:", err);

              // Revert the optimistic update if undo fails
              setModelGroupAssignments((prev) => ({
                ...prev,
                [modelId]: newGroupId,
              }));

              setToast({
                show: true,
                message: "Failed to undo change",
                type: "error",
              });
            }
          },
        },
      });
    } catch (err) {
      console.error("Error changing model group:", err);

      // Revert optimistic update
      setModelGroupAssignments((prev) => ({
        ...prev,
        [modelId]: modelGroupAssignments[modelId] || "ungrouped",
      }));

      setToast({
        show: true,
        message: "Failed to change group",
        type: "error",
        action: {
          label: "Retry",
          onClick: () => handleChangeGroup(modelId, newGroupId),
        },
      });
    }
  };

  // Inside the Sidebar component, add a function to fetch groups and models
  const fetchGroupsAndModels = useCallback(async () => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token found");

      // Fetch groups and assignments
      const groupsResponse = await axios.get(`${baseUrl}/agency/model-groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched groups response:", groupsResponse.data);

      if (groupsResponse.data.success) {
        setGroups(groupsResponse.data.groups);
        setModelGroupAssignments(groupsResponse.data.assignments || {});
      }

      // Fetch models
      const modelsResponse = await axios.get(
        `${baseUrl}/agency/agency-models`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("Fetched models:", modelsResponse.data.data.models);

      const fetchedModels = modelsResponse.data.data.models || [];
      setModels(fetchedModels);

      // Apply current sorting
      const sortedModels = applySorting(fetchedModels, currentSort);
      setOrderedModels(sortedModels);
    } catch (error) {
      console.error("Error fetching groups and models:", error);
      setToast({
        show: true,
        message: "Failed to refresh models list",
        type: "error",
      });
    }
  }, [baseUrl, currentSort]); // Add dependencies

  // Add useEffect to fetch initial data
  useEffect(() => {
    fetchGroupsAndModels();
  }, [fetchGroupsAndModels]);

  return (
    <>
      <StyleTag />
      {/* Add Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast({ show: false, message: "", type: "success" })
          }
          action={toast.action}
        />
      )}

      {/* Enhanced Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col shadow-xl border-r border-gray-200 dark:border-gray-800 z-50 transition-all duration-300 ease-in-out ${
          isExpanded ? "w-64" : "w-20"
        }`}
      >
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute top-1/2 right-[-12px] -translate-y-1/2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-800 rounded-full z-50 h-6 w-6 p-0 flex items-center justify-center shadow-lg"
        >
          {isExpanded ? (
            <ChevronLeft
              size={14}
              className="text-gray-600 dark:text-gray-400"
            />
          ) : (
            <ChevronRight
              size={14}
              className="text-gray-600 dark:text-gray-400"
            />
          )}
        </Button>

        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          {isExpanded ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    <img src="/logo.png" alt="" className="w-8 h-8" />
                  </span>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">
                    Model Overview
                  </h2>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  <img src="/logo.png" alt="" className="w-8 h-8" />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="px-4 py-3">
          {isExpanded ? (
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-10 py-2 dark:bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onClick={openSearch}
                readOnly
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSortMenuOpen(!isSortMenuOpen);
                  }}
                  className="text-gray-400 hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-700/50 rounded-md"
                >
                  <ArrowUpDown size={14} />
                </button>
                <SortMenu
                  isOpen={isSortMenuOpen}
                  onClose={() => setIsSortMenuOpen(false)}
                  currentSort={currentSort}
                  onSort={handleSort}
                  isExpanded={isExpanded}
                />
              </div>
            </div>
          ) : (
            <Tooltip text="Search">
              <Button
                variant="ghost"
                size="icon"
                className="w-full hover:bg-blue-600/20"
                onClick={openSearch}
              >
                <Search className="h-5 w-5 text-blue-400" />
              </Button>
            </Tooltip>
          )}
        </div>
        <div className="space-y-4 mb-2">
          <Tooltip text="Add Model">
            <Button
              variant="ghost"
              size="icon"
              className="w-full hover:bg-green-600/20"
              onClick={openModal}
            >
              <Plus className="h-5 w-5 text-green-400" />
            </Button>
          </Tooltip>
        </div>

        {/* Models List - Update this section */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full px-4 overflow-y-auto custom-scrollbar will-change-scroll">
            <div className="transform-gpu">
              {isLoading || isLoadingInserts ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="text-red-400 text-sm text-center py-4">
                  {error}
                </div>
              ) : orderedModels.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">
                  No models found
                </div>
              ) : isGroupingEnabled && groups.length > 0 ? (
                // Render grouped models only if grouping is enabled and groups exist
                groups.map((group) => (
                  <ModelGroup
                    key={group.id}
                    group={group}
                    models={models}
                    isExpanded={isExpanded}
                    customInserts={customInserts}
                    onEdit={handleEditInsert}
                    onDelete={handleDeleteInsert}
                    handleAddInsert={handleAddInsert}
                    onToggleCollapse={handleToggleGroup}
                    onDragEnd={handleGroupDragEnd}
                    groups={groups}
                    onChangeGroup={handleChangeGroup}
                    modelGroupAssignments={modelGroupAssignments}
                    setModelGroupAssignments={setModelGroupAssignments}
                    fetchGroupsAndModels={fetchGroupsAndModels}
                    setToast={setToast}
                    setModels={setModels}
                  />
                ))
              ) : (
                // Render flat list when grouping is disabled or no groups exist
                <>
                  <InsertMenu
                    onInsert={(type) => handleAddInsert(type, 0)}
                    className="my-1"
                    isExpanded={isExpanded}
                  />
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={orderedModels.map((model) => model._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {orderedModels.map((user, index) => (
                        <div
                          key={user._id}
                          onClick={(e) => handleModelClick(user._id, e)}
                        >
                          <SortableModel
                            user={user}
                            index={index}
                            isExpanded={isExpanded}
                            customInserts={customInserts}
                            onEdit={handleEditInsert}
                            onDelete={handleDeleteInsert}
                            handleAddInsert={handleAddInsert}
                            groups={[]}
                            currentGroupId="ungrouped"
                            onChangeGroup={() => {}}
                          />
                        </div>
                      ))}
                    </SortableContext>
                  </DndContext>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          {isExpanded ? (
            <>
              <Link to="/support/help_desk">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-yellow-600/20 text-yellow-400"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-gray-600/20 text-gray-400"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </>
          ) : (
            <>
              <Tooltip text="Help">
                <Link to="/support/help_desk">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full hover:bg-yellow-600/20"
                  >
                    <HelpCircle className="h-5 w-5 text-yellow-400" />
                  </Button>
                </Link>
              </Tooltip>
              <Tooltip text="Settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full hover:bg-gray-600/20"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-5 w-5 text-gray-400" />
                </Button>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SidebarSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isGroupingEnabled={isGroupingEnabled}
        onToggleGrouping={handleToggleGrouping}
        groups={groups}
        onUpdateGroups={handleUpdateGroups}
      />

      {/* Search Modal */}
      {/* <Modal open={isSearchOpen} onClose={closeSearch}>
        <div className="flex justify-end p-4 pb-2">
          <Button variant="ghost" size="icon" onClick={closeSearch}>
            <X size={18} className="text-gray-400" />
          </Button>
        </div>
        <div className="px-6 pb-6">
          {/* Modern Search Input */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          size={20}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleGlobalModelSearch(e.target.value)}
          placeholder="Search models and users..."
          className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          autoFocus
        />
      </div>

      <div className="mt-6 max-h-[calc(100vh-280px)] overflow-y-auto">
        {searchLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-3">
            {searchResults.map((result) => (
              <div
                key={result._id}
                className="flex items-center p-3 rounded-xl bg-gray-800/30 border border-gray-700/30 backdrop-blur-sm group"
              >
                <Avatar
                  src={result.profilePhoto}
                  alt={result.fullName}
                  fallback={result.fullName?.[0] || "U"}
                  className="w-12 h-12 mr-4 border-2 border-blue-600/50 shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <span className="dark:text-white  font-medium block truncate">
                    {result.fullName}
                  </span>
                  {result.username && (
                    <span className="dark:text-gray-400 text-sm block truncate">
                      @{result.username}
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => handleAddModelToAgency(result)}
                  disabled={isAddingModel}
                  className="ml-4 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingModel ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </div>
                  ) : (
                    "Add Model"
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12 px-4">
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
              <Search className="h-8 w-8 mx-auto mb-3 text-gray-500" />
              <p className="text-gray-400">
                No results found for "{searchQuery}"
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 backdrop-blur-sm">
              <Search className="h-8 w-8 mx-auto mb-3 text-gray-500" />
              <p className="text-gray-400">
                Start typing to search models and users
              </p>
            </div>
          </div>
        )}
      </div>
      {/* </div> */}
      {/* </Modal> */}

      {/* Add Model Modal */}
      <AddModelModal
        open={isAddModalOpen}
        onClose={closeModal}
        onAdd={handleAddModelToAgency}
        onSearch={handleGlobalModelSearch}
        searchLoading={searchLoading}
        searchResults={searchResults}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Add loading indicator component */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
          <span>Saving changes...</span>
        </div>
      )}
    </>
  );
};

export default Sidebar;
