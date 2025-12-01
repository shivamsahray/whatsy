import axios from "axios"

export const API = axios.create({
    baseURL:
        import.meta.env.MODE === "development" ? `${import.meta.env.VITE_API_URL}/api`: '/api',
        withCredentials: true,
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});