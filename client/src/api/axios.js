// ek hi axios instance — baseURL + cookie (withCredentials) ek jagah set, har call me repeat nahi
import axios from "axios";
import { serverUrl } from "../config/server.js";
import { setUserData } from "../redux/userSlice.js";

const api = axios.create({
    baseURL: serverUrl,
    withCredentials: true, // login cookie har request ke saath jaaye
});

// in URLs ka 401 "session khatam" nahi hai:
// - /api/auth/* → galat password / link — form khud error dikhata hai
// - current-user → app start par "logged in nahi" — App.jsx khud sambhalta hai (aur late aaya to naya login na mite)
const IGNORE_401 = ["/api/auth/", "/api/user/current-user"];

// interceptor = har response component tak pahunchne se pehle yaha se guzarta hai
// store yaha import nahi karte (store → slice → ... circular import) — main.jsx store pass karta hai
export const setupInterceptors = (store) => {
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            const url = error.config?.url || "";
            const isSessionExpired = error.response?.status === 401 && !IGNORE_401.some((path) => url.startsWith(path));

            // cookie expire/invalid ho gayi — app me bhi logged out dikhao (ProtectedRoute login par bhej dega)
            if (isSessionExpired && store.getState().user.userData) {
                store.dispatch(setUserData(null));
            }
            return Promise.reject(error); // component ka catch bhi chale
        },
    );
};

export default api;
