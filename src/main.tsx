import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initDevToolsProtection } from "./lib/devtools-protection";

// Initialize developer tools protections (production only)
initDevToolsProtection();

createRoot(document.getElementById("root")!).render(<App />);
