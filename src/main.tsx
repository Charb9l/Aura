import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Lock orientation to portrait on supported devices
try {
  screen.orientation?.lock?.("portrait").catch(() => {});
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
