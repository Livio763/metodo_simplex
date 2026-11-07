import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@fontsource/anybody/700.css";
import "@fontsource/literata/400.css";
import "@fontsource/literata/600.css";
import "@fontsource/fragment-mono/400.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
