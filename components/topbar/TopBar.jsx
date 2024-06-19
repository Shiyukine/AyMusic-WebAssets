import React from "react";
import TopBarWindowItem from "./TopBarWindowItem.jsx";
import wmin from "../../public/wmin.png";
import wmax from "../../public/wchange.png";
import wclose from "../../public/wclose.png";
import Utils from "../../class/utils/utils.js";

export default function TopBar() {
    return (
        <div className="topbar">
            <div className="topbar__left">
            </div>
            <div className="topbar__middle">
            </div>
            <div className="topbar__right">
                <TopBarWindowItem icon={wmin} onClick={() => Utils.app.remoteClient.hideWindow()} />
                <TopBarWindowItem icon={wmax} onClick={changeWindowSizeMode} />
                <TopBarWindowItem icon={wclose} onClick={() => Utils.app.remoteClient.closeWindow()} />
            </div>
        </div>
    );
}

function changeWindowSizeMode() {
    if (Utils.app.remoteClient.getWindowState()) {
        Utils.app.remoteClient.normalWindow();
    } else {
        Utils.app.remoteClient.maxWindow();
    }
}