import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const skillMatrixAPI = axios.create({
  baseURL: `${API_BASE_URL}/skill-matrix`,
  withCredentials: true,
});

// Skill Categories
export const skillCategoryService = {
  create: (data) => skillMatrixAPI.post("/categories", data),
  getAll: () => skillMatrixAPI.get("/categories"),
  update: (id, data) => skillMatrixAPI.put(`/categories/${id}`, data),
  delete: (id) => skillMatrixAPI.delete(`/categories/${id}`),
};

// Skills
export const skillService = {
  create: (data) => skillMatrixAPI.post("/skills", data),
  getAll: (params = {}) => skillMatrixAPI.get("/skills", { params }),
  update: (id, data) => skillMatrixAPI.put(`/skills/${id}`, data),
  delete: (id) => skillMatrixAPI.delete(`/skills/${id}`),
};

// User Skills
export const userSkillService = {
  update: (data) => skillMatrixAPI.post("/user-skills", data),
  getByUser: (userId, params = {}) =>
    skillMatrixAPI.get(`/user-skills/${userId}`, { params }),
  endorse: (userSkillId) =>
    skillMatrixAPI.post(`/user-skills/${userSkillId}/endorse`),
  getGaps: (userId, params = {}) =>
    skillMatrixAPI.get(`/gaps/${userId}`, { params }),
};

// Skill Matrix
export const skillMatrixService = {
  getMatrix: (agencyId, params = {}) =>
    skillMatrixAPI.get(`/matrix/${agencyId}`, { params }),
};

export default {
  skillCategoryService,
  skillService,
  userSkillService,
  skillMatrixService,
};
