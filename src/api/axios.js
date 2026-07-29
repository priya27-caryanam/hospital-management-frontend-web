import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:9091/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = "/home";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;