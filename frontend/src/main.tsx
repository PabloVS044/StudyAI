import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import App from "./App";
import "./index.css";
import "katex/dist/katex.min.css";
import { AppSettingsProvider } from "./context/AppSettings";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <BrowserRouter>
        <AppSettingsProvider>
          <App />
        </AppSettingsProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
