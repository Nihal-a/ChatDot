import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Store } from "./Components/Redux/Store.jsx";
import App from "./App.jsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import "primereact/resources/themes/lara-light-cyan/theme.css"; // choose your theme
import "primereact/resources/primereact.min.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={Store}>
        <App />
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
