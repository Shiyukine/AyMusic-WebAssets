import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import App from "./App.jsx";
import Utils from "./class/utils/utils.js";

window.app = Utils.app;
document.getElementById("root").ondragstart = () => { return false; };

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);