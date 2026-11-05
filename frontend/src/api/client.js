import axios from "axios";
import Cookies from "js-cookie";

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (
        import.meta.env.DEV
            ? "http://localhost:3001/api"
            : "https://bool-me.onrender.com/api"
    ),
    withCredentials: true,           
});
// http://localhost:8080/
// (Optional) CSRF header for non-GET requests, if backend requires it
client.interceptors.request.use((config) => {
    if (String(config.url || "").startsWith("/admin")) {
        const adminToken = localStorage.getItem("adminToken");
        if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
    }
    const userToken = Cookies.get("token");
    if (userToken && !String(config.url || "").startsWith("/admin")) {
        config.headers.Authorization = `Bearer ${userToken}`;
    }
    // Regex-based extraction — handles "=" in the value
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    const csrf = match?.[1];

    if (csrf) {
        try {
            config.headers["X-CSRF-TOKEN"] = decodeURIComponent(csrf);
        } catch {
            config.headers["X-CSRF-TOKEN"] = csrf;
        }
    }

    return config;
});

// Handle expired/invalid sessions
const AUTH_ENDPOINTS = ["/login", "/register", "/refresh"];
let redirecting = false;

client.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url ?? "";
        const isAdminCall = url.startsWith("/admin");
        const isAdminLogin = url.includes("/admin/login");
        const isAuthCall = AUTH_ENDPOINTS.some((p) => url.includes(p));
        const onLoginPage = window.location.pathname === "/login";

        if (status === 401 && isAdminCall && !isAdminLogin && window.location.pathname !== "/admin/login") {
            localStorage.removeItem("adminToken");
            window.location.assign("/admin/login");
        } else if (status === 401 && !isAdminCall && !isAuthCall && !onLoginPage && !redirecting) {
            redirecting = true;
            window.location.assign("/login");
        }

        return Promise.reject(error);
    }
);
export default client;
