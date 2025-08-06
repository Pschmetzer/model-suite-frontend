import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Automatically attach Bearer token if exists
instance.interceptors.request.use(
  (config) => {
    const token = JSON.parse(localStorage.getItem("auth"))?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// GET
export const getDataAPI = async (url) => {
  const res = await instance.get(url);
  return res;
};

// POST
export const postDataAPI = async (url, data) => {
  const res = await instance.post(url, data);
  return res;
};

// PUT
export const putDataAPI = async (url, data) => {
  const res = await instance.put(url, data);
  return res;
};

// PATCH
export const patchDataAPI = async (url, data) => {
  const res = await instance.patch(url, data);
  return res;
};

// DELETE
export const deleteDataAPI = async (url) => {
  const res = await instance.delete(url);
  return res;
};

export default instance;
