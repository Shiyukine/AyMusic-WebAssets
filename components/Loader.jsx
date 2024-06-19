import React from "react";
import mainLogo from "../public/icon.ico";
import Utils from "../class/utils/utils";
import PropTypes from 'prop-types';

export default function Loader({ onLoaded }) {
    Loader.propTypes = {
        onLoaded: PropTypes.func.isRequired
    }
    Utils.app.loaded = async () => {
        if (!window.loaded) {
            window.loaded = true;
            try {
                console.log("AyMusic client registered : " + Utils.app.platform + ", version : " + Utils.app.versionName + " (" + Utils.app.versionId + "), isRelease : " + Utils.app.isRelease);
                Utils.realServURL = (await Utils.app.httpRequestGET("https://raw.githubusercontent.com/Shiyukine/Shiyukine/main/serv.txt")).replace("\n", "");
                if (Utils.app.isRelease)
                    Utils.servURL = Utils.realServURL;
                else
                    Utils.servURL = "https://192.168.0.33/";
                await Utils.app.remoteClient.changeServURL(Utils.servURL)
                console.log("Server URL : " + Utils.servURL);
                onLoaded(true);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    return (
        <div className="load">
            <img
                alt=""
                className="load__logo"
                src={mainLogo}
            />
        </div>
    );
}