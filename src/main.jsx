import React from "react";
import ReactDOM from "react-dom/client";
import LetterPuzzle from "./LetterPuzzle";
import "./index.css";
import "./firebase"; // Initialize Firebase Analytics

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LetterPuzzle />
  </React.StrictMode>
);

// Register service worker for offline PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
