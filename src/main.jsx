import React from "react";

import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import { LanguageProvider } from "./app/i18n/LanguageContext.jsx";
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure there is a <div id=\"root\"></div> in your HTML file.");
}

createRoot(rootElement).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
