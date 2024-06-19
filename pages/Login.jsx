import React from "react";
import Utils from "../class/utils/utils";
import PropTypes from 'prop-types';

export default function Login({ onConnected }) {
    Login.propTypes = {
        onConnected: PropTypes.func.isRequired
    }

    function oniFrameLoad(e) {

    }

    function getIframeUrl() {
        let jsctrl = new AbortController();
        let messID = "log_" + Date.now() + (Math.random() + 1).toString(36).substring(7)
        return new Promise((resolve) => {
            window.addEventListener("message", (e) => {
                if (e.origin == Utils.servURL.slice(0, -1) && e.data.id == messID) {
                    if (e.data.message == "callbackURL") {
                        jsctrl.abort()
                        resolve(e.data.data)
                    }
                }
            }, { signal: jsctrl.signal })
            this.#iframe.contentWindow.postMessage({ message: "getURL", id: messID }, Utils.servURL)
        })
    }

    return (
        <div className="login">
            <iframe className="login__iframe" src={Utils.servURL + "/login/?inapp=1"} onLoad={oniFrameLoad}></iframe>
        </div>
    );
}