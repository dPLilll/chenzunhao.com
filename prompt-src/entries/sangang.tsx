import { createRoot } from "react-dom/client";
import App from "../apps/sangang";

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
