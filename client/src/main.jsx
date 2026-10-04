import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { setupInterceptors } from "./api/axios.js";
import { initSentry } from "./config/sentry.js";

initSentry(); // production me errors report karo (VITE_SENTRY_DSN na ho to off)

// har API response par 401 check (session expire → logout) — app render se pehle ek baar
setupInterceptors(store);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <Provider store={store}>
                <App />
            </Provider>
        </BrowserRouter>
    </StrictMode>,
);
