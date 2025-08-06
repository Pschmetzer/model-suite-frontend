import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const getToken = () => {
  const auth = JSON.parse(localStorage.getItem("auth"));
  return auth?.token;
};

const boardApi = {
  // Board operations
  createBoard: async (boardData) => {
    try {
      const response = await axios.post(
        `${baseURL}/board/creat-board`,
        boardData,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create board:", error);
      throw error;
    }
  },

  deleteBoard: async (boardId) => {
    try {
      const response = await axios.delete(
        `${baseURL}/board/boards/${boardId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to delete board:", error);
      throw error;
    }
  },

  getAllBoards: async (modelId) => {
    try {
      const response = await axios.get(
        `${baseURL}/board/boards?modelId=${modelId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get boards:", error);
      throw error;
    }
  },

  getBoardById: async (boardId) => {
    try {
      const response = await axios.get(`${baseURL}/board/boards/${boardId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to get board:", error);
      throw error;
    }
  },

  updateBoard: async (boardId, updates) => {
    try {
      const response = await axios.put(
        `${baseURL}/board/boards/${boardId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to update board:", error);
      throw error;
    }
  },

  // List operations
  createList: async (boardId, listData) => {
    try {
      const response = await axios.post(
        `${baseURL}/board/boards/${boardId}/lists`,
        listData,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create list:", error);
      throw error;
    }
  },

  deleteList: async (listId) => {
    try {
      const response = await axios.delete(`${baseURL}/board/lists/${listId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to delete list:", error);
      throw error;
    }
  },

  // Card operations
  createCard: async (listId, cardData) => {
    try {
      // Ensure priority is set to 'medium' if not provided
      const cardDataWithPriority = {
        ...cardData,
        priority: cardData.priority || "medium",
      };

      const response = await axios.post(
        `${baseURL}/board/lists/${listId}/cards`,
        cardDataWithPriority,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create card:", error);
      throw error;
    }
  },

  // Individual tasks operations
  getIndividualTasks: async (modelId) => {
    try {
      const response = await axios.get(
        `${baseURL}/tasks/list?modelId=${modelId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get individual tasks:", error);
      throw error;
    }
  },

  createIndividualTask: async (taskData) => {
    try {
      // Ensure priority is set to 'medium' if not provided
      const taskDataWithPriority = {
        ...taskData,
        priority: taskData.priority || "medium",
      };

      const response = await axios.post(
        `${baseURL}/tasks/create`,
        taskDataWithPriority,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create individual task:", error);
      throw error;
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const response = await axios.put(`${baseURL}/tasks/${taskId}`, taskData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      const response = await axios.delete(`${baseURL}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error;
    }
  },

  putTaskOnHold: async (taskId, reason) => {
    try {
      const response = await axios.put(
        `${baseURL}/tasks/${taskId}/hold`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to put task on hold:", error);
      throw error;
    }
  },

  deleteCard: async (cardId) => {
    try {
      const response = await axios.delete(`${baseURL}/board/cards/${cardId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to delete card:", error);
      throw error;
    }
  },

  putCardOnHold: async (cardId, reason) => {
    try {
      const response = await axios.put(
        `${baseURL}/board/cards/${cardId}/hold`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to put card on hold:", error);
      throw error;
    }
  },

  updateCard: async (cardId, cardData) => {
    try {
      // Ensure priority is valid if provided
      const cardDataWithPriority = {
        ...cardData,
        priority: cardData.priority || "medium",
      };

      const response = await axios.put(
        `${baseURL}/board/cards/${cardId}`,
        cardDataWithPriority,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to update card:", error);
      throw error;
    }
  },

  moveCard: async (cardId, { targetListId, position }) => {
    try {
      const response = await axios.put(
        `${baseURL}/board/cards/${cardId}/move`,
        { targetListId, position },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to move card:", error);
      throw error;
    }
  },

  // Attachment operations
  getAttachments: async (cardId) => {
    try {
      const response = await axios.get(
        `${baseURL}/board/cards/${cardId}/attachments`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get attachments:", error);
      throw error;
    }
  },

  uploadAttachment: async (cardId, formData) => {
    try {
      const response = await axios.post(
        `${baseURL}/board/cards/${cardId}/attachments`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to upload attachment:", error);
      throw error;
    }
  },

  deleteAttachment: async (cardId, attachmentId) => {
    try {
      const response = await axios.delete(
        `${baseURL}/board/cards/${cardId}/attachments/${attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      throw error;
    }
  },

  // Comment operations
  getCardComments: async (cardId) => {
    try {
      const response = await axios.get(
        `${baseURL}/board/cards/${cardId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get comments:", error);
      throw error;
    }
  },

  addComment: async (cardId, commentData) => {
    try {
      const response = await axios.post(
        `${baseURL}/board/cards/${cardId}/comments`,
        commentData,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw error;
    }
  },

  // Task Attachments
  getTaskAttachments: async (taskId) => {
    try {
      const response = await axios.get(
        `${baseURL}/tasks/${taskId}/attachments`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get task attachments:", error);
      throw error;
    }
  },

  uploadTaskAttachment: async (taskId, formData) => {
    try {
      const response = await axios.post(
        `${baseURL}/tasks/${taskId}/attachments`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to upload task attachment:", error);
      throw error;
    }
  },

  deleteTaskAttachment: async (taskId, attachmentId) => {
    try {
      const response = await axios.delete(
        `${baseURL}/tasks/${taskId}/attachments/${attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to delete task attachment:", error);
      throw error;
    }
  },

  // Task Comments
  getTaskComments: async (taskId) => {
    try {
      const response = await axios.get(`${baseURL}/tasks/${taskId}/comments`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to get task comments:", error);
      throw error;
    }
  },

  addTaskComment: async (taskId, data) => {
    try {
      const response = await axios.post(
        `${baseURL}/tasks/${taskId}/comments`,
        data,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to add task comment:", error);
      throw error;
    }
  },

  deleteTaskComment: async (taskId, commentId) => {
    try {
      const response = await axios.delete(
        `${baseURL}/tasks/${taskId}/comments/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to delete task comment:", error);
      throw error;
    }
  },
};

export default boardApi;
