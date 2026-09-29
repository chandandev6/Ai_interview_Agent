// user ke server calls — returns { success, message, data }
import api from "./axios.js";

export const getCurrentUser = () => api.get("/api/user/current-user").then((response) => response.data);
