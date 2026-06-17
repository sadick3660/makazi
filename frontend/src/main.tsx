import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "leaflet/dist/leaflet.css";
import App from "./App";

// Fix Leaflet's default marker icon path resolution with Vite
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl:      markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:    markerShadow,
});

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
