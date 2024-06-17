import React from "react";
import mainLogo from "../public/icon.ico";
import Utils from "../class/utils/utils";

export default function Loader({ onLoaded }) {
  Utils.app.loaded = () => {
    if (!window.loaded) {
      window.loaded = true;
      try {
        console.log("AyMusic client registered : " + Utils.app.platform + ", version : " + Utils.app.versionName + " (" + Utils.app.versionId + "), isRelease : " + Utils.app.isRelease);
        onLoaded(true);
      }
      catch (e) {
        console.error(e);
      }
    }
  }
  return (
    <div className="load">
      <img src={mainLogo} alt="" />
    </div>
  );
}