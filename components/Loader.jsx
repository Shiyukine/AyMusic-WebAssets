import React from "react";
import mainLogo from "../public/icon.ico";
import Utils from "../class/utils/utils";
import PropTypes from 'prop-types';

export default function Loader({ onLoaded }) {
    Loader.propTypes = {
        onLoaded: PropTypes.func.isRequired
    }
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
            <img
                alt=""
                src={mainLogo}
            />
        </div>
    );
}