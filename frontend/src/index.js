import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "./i18n"; // Import translation configuration
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Ensure any previously-registered service worker is unregistered so old cached
// frontend versions aren't served after this import into the monorepo.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(function (registrations) {
      for (let registration of registrations) {
        registration.unregister();
      }
    })
    .catch(function (err) {
      // fail silently - not critical
      console.warn("ServiceWorker unregister failed:", err);
    });
}
