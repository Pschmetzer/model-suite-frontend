import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Loader2,
  Plus,
  X,
  Clock,
  CheckCircle2,
  PlayCircle,
  Trash2,
  AlertTriangle,
  PauseCircle,
} from "lucide-react";
import boardApi from "../../../utils/boardApi";
import CardModal from "./CardModal";
import { usePermissions } from "../../../hooks/usePermissions";
import PermissionGuard from "../../common/PermissionGuard";

const BoardView = ({ board: initialBoard, onBoardUpdate }) => {
  const [board, setBoard] = useState(initialBoard);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [addingCardToList, setAddingCardToList] = useState(null);
  const [onHoldCard, setOnHoldCard] = useState(null);
  const [onHoldReason, setOnHoldReason] = useState("");
  const [isSubmittingHold, setIsSubmittingHold] = useState(false);
  const [deletingCard, setDeletingCard] = useState(null);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);

  const { hasPermission, hasFullAccess, isModel } = usePermissions();

  useEffect(() => {
    if (initialBoard?._id) {
      fetchBoard();
    }
  }, [initialBoard?._id]);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardApi.getBoardById(initialBoard._id);
      setBoard(data);
    } catch (err) {
      console.error("Failed to fetch board:", err);
      setError("Failed to load board. Please try again.");
      toast.error("Failed to load board. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddList = async () => {
    if (!hasPermission("tasks.create") && !hasFullAccess) return;

    if (!newListTitle.trim()) return;
    try {
      const newList = await boardApi.createList(board._id, {
        title: newListTitle.trim(),
      });

      // Update local state
      setBoard((prevBoard) => ({
        ...prevBoard,
        lists: [...prevBoard.lists, { ...newList, cards: [] }],
      }));

      setNewListTitle("");
      setIsAddingList(false);
      toast.success("List added successfully");
    } catch (error) {
      console.error("Failed to add list", error);
      toast.error("Failed to add list");
    }
  };

  const handleDeleteList = async (listId, listTitle) => {
    if (isModel) return;

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete the list "${listTitle}"? This will also delete all cards in this list. This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await boardApi.deleteList(listId);

      // Update local state
      setBoard((prevBoard) => ({
        ...prevBoard,
        lists: prevBoard.lists.filter((list) => list._id !== listId),
      }));
      toast.success("List deleted successfully");
    } catch (error) {
      console.error("Failed to delete list", error);
      toast.error("Failed to delete list");
    }
  };

  const handleCardUpdate = async (listId, cardData) => {
    if (isModel && !cardData.isComplete) return;

    try {
      let updatedCard;
      if (cardData._id) {
        // Update existing card
        updatedCard = await boardApi.updateCard(cardData._id, cardData);

        // Update local state
        setBoard((prevBoard) => ({
          ...prevBoard,
          lists: prevBoard.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card._id === updatedCard._id ? updatedCard : card,
            ),
          })),
        }));
      } else {
        // Create new card
        updatedCard = await boardApi.createCard(listId, cardData);

        // Update local state
        setBoard((prevBoard) => ({
          ...prevBoard,
          lists: prevBoard.lists.map((list) =>
            list._id === listId
              ? {
                  ...list,
                  cards: [...(list.cards || []), updatedCard],
                }
              : list,
          ),
        }));
      }

      // Close the modal
      setSelectedCard(null);
      setAddingCardToList(null);
      toast.success(
        cardData._id
          ? "Card updated successfully"
          : "Card created successfully",
      );
    } catch (error) {
      console.error("Failed to update card", error);
      toast.error("Failed to update or create card");
    }
  };

  const handleMarkAsComplete = async (card, currentListId) => {
    if (!isModel) return;

    try {
      // Find the "Done" list
      const doneList = board.lists.find(
        (list) => list.title.toLowerCase() === "done",
      );

      if (!doneList) {
        console.error("No Done list found");
        return;
      }

      // Update the card
      const updatedCard = {
        ...card,
        isComplete: true,
      };

      // Move the card to the Done list
      await boardApi.moveCard(card._id, {
        sourceListId: currentListId,
        targetListId: doneList._id,
        position: 0,
      });

      // Update the card's completion status
      await boardApi.updateCard(card._id, updatedCard);

      // Update local state
      setBoard((prevBoard) => ({
        ...prevBoard,
        lists: prevBoard.lists.map((list) => {
          if (list._id === currentListId) {
            return {
              ...list,
              cards: list.cards.filter((c) => c._id !== card._id),
            };
          }
          if (list._id === doneList._id) {
            return {
              ...list,
              cards: [{ ...updatedCard }, ...(list.cards || [])],
            };
          }
          return list;
        }),
      }));
      toast.success("Card marked as complete");
    } catch (error) {
      console.error("Failed to mark card as complete:", error);
      toast.error("Failed to mark card as complete");
    }
  };

  const handleMoveToInProgress = async (card, currentListId) => {
    if (!isModel) return;

    try {
      // Find the "In Progress" list
      const inProgressList = board.lists.find(
        (list) => list.title.toLowerCase() === "in progress",
      );

      if (!inProgressList) {
        console.error("No In Progress list found");
        return;
      }

      // Move the card to the In Progress list
      await boardApi.moveCard(card._id, {
        sourceListId: currentListId,
        targetListId: inProgressList._id,
        position: 0,
      });

      // Update local state
      setBoard((prevBoard) => ({
        ...prevBoard,
        lists: prevBoard.lists.map((list) => {
          if (list._id === currentListId) {
            return {
              ...list,
              cards: list.cards.filter((c) => c._id !== card._id),
            };
          }
          if (list._id === inProgressList._id) {
            return {
              ...list,
              cards: [{ ...card }, ...(list.cards || [])],
            };
          }
          return list;
        }),
      }));
      toast.success("Card moved to In Progress");
    } catch (error) {
      console.error("Failed to move card to in progress:", error);
      toast.error("Failed to move card to In Progress");
    }
  };

  const handlePutOnHold = async (card, currentListId) => {
    try {
      setIsSubmittingHold(true);
      await boardApi.putCardOnHold(card._id, onHoldReason);

      // Find the "On Hold" list
      const onHoldList = board.lists.find(
        (list) => list.title.toLowerCase() === "on hold",
      );

      if (!onHoldList) {
        console.error("No On Hold list found");
        return;
      }

      // Update local state
      setBoard((prevBoard) => ({
        ...prevBoard,
        lists: prevBoard.lists.map((list) => {
          if (list._id === currentListId) {
            return {
              ...list,
              cards: list.cards.filter((c) => c._id !== card._id),
            };
          }
          if (list._id === onHoldList._id) {
            return {
              ...list,
              cards: [
                { ...card, isOnHold: true, onHoldReason },
                ...(list.cards || []),
              ],
            };
          }
          return list;
        }),
      }));

      // Reset state
      setOnHoldCard(null);
      setOnHoldReason("");
      toast.success("Card put on hold");
    } catch (error) {
      console.error("Failed to put card on hold:", error);
      toast.error("Failed to put card on hold");
    } finally {
      setIsSubmittingHold(false);
    }
  };

  const handleDeleteCard = async (card, listId) => {
    try {
      // Confirm deletion
      const confirmed = window.confirm(
        `Are you sure you want to delete this card "${card.title}"? This action cannot be undone.`,
      );

      if (!confirmed) return;

      // Show loading state
      setDeletingCard(card._id);

      await boardApi.deleteCard(card._id);

      // Update local state
      setBoard((prevBoard) => ({
        ...prevBoard,
        lists: prevBoard.lists.map((list) =>
          list._id === listId
            ? {
                ...list,
                cards: list.cards.filter((c) => c._id !== card._id),
              }
            : list,
        ),
      }));

      // Reset loading state
      setDeletingCard(null);
      toast.success("Card deleted successfully");
    } catch (error) {
      console.error("Failed to delete card:", error);
      toast.error("Failed to delete card. Please try again.");
      setDeletingCard(null);
    }
  };

  const handleDeleteBoard = async () => {
    try {
      // Confirm deletion
      const confirmed = window.confirm(
        `Are you sure you want to delete the board "${board.title}"? This will delete all lists and cards in this board. This action cannot be undone.`,
      );

      if (!confirmed) return;

      setIsDeletingBoard(true);
      await boardApi.deleteBoard(board._id);

      // Redirect to boards page
      toast.success("Board deleted successfully");
      window.location.href = "/agency/dashboard";
    } catch (error) {
      console.error("Failed to delete board:", error);
      toast.error("Failed to delete board. Please try again.");
      setIsDeletingBoard(false);
    }
  };

  const formatDueDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (isNaN(d.getTime())) return "";

    if (d.toDateString() === now.toDateString()) {
      return "Today";
    }

    if (d.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDueDateStatus = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();

    if (isNaN(d.getTime())) return "";

    if (d < now) {
      return "text-red-500"; // overdue
    }

    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    if (d <= twoDaysFromNow) {
      return "text-yellow-500"; // due soon
    }

    return "text-green-500"; // due later
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex items-center gap-2 text-blue-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading board...</span>
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

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-gray-400 text-center">
          <p className="text-xl font-semibold mb-2">Board not found</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-full flex flex-col bg-cover bg-center ${board.background || "bg-gray-900"}`}
    >
      {/* Board Header */}
      <div className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">{board.title}</h1>
        <PermissionGuard permission="tasks.delete" fallback={hasFullAccess}>
          <button
            onClick={handleDeleteBoard}
            disabled={isDeletingBoard}
            className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete board"
          >
            {isDeletingBoard ? (
              <Loader2 className="w-5 h-5 animate-spin text-red-400" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </button>
        </PermissionGuard>
      </div>

      {/* Lists Container */}
      <div className="flex-1 flex gap-4 overflow-x-auto p-4 items-start">
        {board.lists?.map((list) => (
          <div
            key={list._id}
            className="w-[280px] flex-shrink-0 bg-gray-800/90 rounded-xl shadow-md flex flex-col max-h-full"
          >
            {/* List Header */}
            <div className="p-3 font-semibold text-white border-b border-gray-700/50 flex items-center justify-between group">
              <span>{list.title}</span>
              <PermissionGuard
                permission="tasks.delete"
                fallback={hasFullAccess}
              >
                <button
                  onClick={() => handleDeleteList(list._id, list.title)}
                  className="p-1 text-gray-400 hover:text-red-400 rounded-full hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                  title={`Delete list "${list.title}"`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </PermissionGuard>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {list.cards?.map((card) => (
                <div
                  key={card._id}
                  className={`bg-gray-700 rounded-lg p-3 shadow-sm hover:bg-gray-600 transition-colors cursor-pointer relative group ${
                    card.isComplete
                      ? "border-l-4 border-green-500"
                      : card.isOnHold
                        ? "border-l-4 border-yellow-500"
                        : ""
                  }`}
                >
                  <div
                    onClick={() =>
                      setSelectedCard({ ...card, listTitle: list.title })
                    }
                  >
                    {/* Card Content */}
                    <div className="space-y-2">
                      {/* Status Indicators */}
                      <div className="flex items-center gap-2">
                        <PermissionGuard
                          permission="tasks.view"
                          fallback={hasFullAccess}
                        >
                          {card.isComplete && (
                            <div className="flex-shrink-0">
                              <CheckCircle2 className="w-5 h-5 text-green-400 fill-green-400" />
                            </div>
                          )}
                        </PermissionGuard>
                        {card.isOnHold && (
                          <div className="flex-shrink-0">
                            <PauseCircle className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-white text-sm font-medium truncate ${card.isComplete ? "line-through text-gray-400" : ""}`}
                          >
                            {card.title}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {card.description && (
                        <p
                          className={`text-gray-400 text-sm line-clamp-2 ${card.isComplete ? "line-through" : ""}`}
                        >
                          {card.description}
                        </p>
                      )}

                      {/* Due Date */}
                      {card.dueDate && (
                        <div className="flex items-center gap-1.5">
                          <Clock
                            className={`w-3.5 h-3.5 ${card.isComplete ? "text-green-400" : getDueDateStatus(card.dueDate)}`}
                          />
                          <span
                            className={`text-xs ${card.isComplete ? "text-green-400" : getDueDateStatus(card.dueDate)}`}
                          >
                            {formatDueDate(card.dueDate)}
                          </span>
                        </div>
                      )}

                      {/* Action Buttons - Now at bottom */}
                      <div className="flex items-center justify-end gap-1 pt-2 mt-2 border-t border-gray-600">
                        {/* Complete Button - Only for models */}
                        {isModel && list.title.toLowerCase() !== "done" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsComplete(card, list._id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-400 rounded-full hover:bg-green-400/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Mark as complete"
                          >
                            <CheckCircle2
                              className={`w-4 h-4 ${card.isComplete ? "text-green-400 fill-green-400" : ""}`}
                            />
                          </button>
                        )}
                        {/* In Progress Button - Only for models */}
                        {isModel &&
                          list.title.toLowerCase() !== "in progress" &&
                          list.title.toLowerCase() !== "done" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveToInProgress(card, list._id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-400 rounded-full hover:bg-blue-400/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Move to In Progress"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}
                        {/* On Hold Button - For both agency and model */}
                        <PermissionGuard
                          permission="tasks.edit"
                          fallback={hasFullAccess}
                        >
                          {list.title.toLowerCase() !== "on hold" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOnHoldCard({ ...card, listId: list._id });
                              }}
                              className="p-1.5 text-gray-400 hover:text-yellow-400 rounded-full hover:bg-yellow-400/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Put on hold"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}
                        </PermissionGuard>
                        {/* Delete Button - Only for agency */}
                        <PermissionGuard
                          permission="tasks.delete"
                          fallback={hasFullAccess}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCard(card, list._id);
                            }}
                            disabled={deletingCard === card._id}
                            className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete card"
                          >
                            {deletingCard === card._id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </PermissionGuard>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* List Footer */}
            <PermissionGuard permission="tasks.create" fallback={hasFullAccess}>
              <div className="p-2">
                <button
                  onClick={() => setAddingCardToList(list)}
                  className="w-full text-left flex items-center gap-2 text-gray-400 hover:bg-gray-700/80 p-2 rounded-lg transition-colors"
                >
                  <Plus size={16} /> Add a card
                </button>
              </div>
            </PermissionGuard>
          </div>
        ))}

        {/* Add List Component */}
        <PermissionGuard permission="tasks.create" fallback={hasFullAccess}>
          <div className="w-[280px] flex-shrink-0">
            {isAddingList ? (
              <div className="bg-gray-800 p-2 rounded-xl shadow-md">
                <input
                  type="text"
                  placeholder="Enter list title..."
                  className="w-full mb-2 px-3 py-2 bg-gray-900 border-2 border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddList()}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddList}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add list
                  </button>
                  <button
                    onClick={() => setIsAddingList(false)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-full p-3 text-white flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-colors"
              >
                <Plus size={16} /> Add another list
              </button>
            )}
          </div>
        </PermissionGuard>
      </div>

      {/* Card Modal */}
      {(selectedCard || addingCardToList) && (
        <CardModal
          card={selectedCard}
          listTitle={selectedCard?.listTitle || addingCardToList?.title}
          onClose={() => {
            setSelectedCard(null);
            setAddingCardToList(null);
          }}
          onUpdate={(cardData) =>
            handleCardUpdate(
              selectedCard?.listId || addingCardToList?._id,
              cardData,
            )
          }
        />
      )}

      {/* On Hold Modal */}
      {onHoldCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-gray-800 rounded-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Put Card on Hold
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Card Title
                </label>
                <div className="text-white">{onHoldCard.title}</div>
              </div>
              <div>
                <label
                  htmlFor="holdReason"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Reason for Hold
                </label>
                <textarea
                  id="holdReason"
                  value={onHoldReason}
                  onChange={(e) => setOnHoldReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 focus:border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none h-24"
                  placeholder="Enter the reason for putting this card on hold..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setOnHoldCard(null);
                    setOnHoldReason("");
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePutOnHold(onHoldCard, onHoldCard.listId)}
                  disabled={!onHoldReason.trim() || isSubmittingHold}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingHold ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-4 h-4" />
                      Put on Hold
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardView;
