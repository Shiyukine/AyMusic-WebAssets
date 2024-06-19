import { Outlet } from "react-router-dom";
import React from "react";
import TopBar from "../components/topbar/TopBar.jsx";
import Navigation from "../components/Navigation.jsx";

const Layout = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <Outlet />
    </>
  )
};

export default Layout;