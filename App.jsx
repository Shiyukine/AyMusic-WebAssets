import React from "react";
import Loader from "./components/Loader.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./pages/Layout.jsx";
import Home from "./pages/Home.jsx";
import NoPage from "./pages/NoPage.jsx";
import Utils from "./class/utils/utils.js";

function App() {
  const [isLoaded, setLoaded] = React.useState(false);
  if (!isLoaded) {
    return (
      <Loader onLoaded={(val) => setLoaded(val)}/>
    )
  }
  else {
    return (
      <>
        <BrowserRouter basename="/main_window">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="*" element={<NoPage />} />
            </Route>
          </Routes>
          <Navigate to="/" replace={true} />
        </BrowserRouter>
      </>
    );
  }
}

export default App;