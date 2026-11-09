import { createRoot } from "react-dom/client";
import App from "../apps/champion";

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
