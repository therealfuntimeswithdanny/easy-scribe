import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import { Auth } from "@/pages/Auth.tsx";
import { NotesApp } from "@/pages/NotesApp.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/notes" element={<NotesApp />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
