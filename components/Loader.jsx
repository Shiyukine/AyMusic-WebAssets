import React, { useEffect } from "react";
import mainLogo from "../public/icon.ico";
import Utils from "../class/utils/utils";
import PropTypes from 'prop-types';
import ImageCacheHandler from "../class/imageCacheHandler";
import Login from "../pages/Login";

export default function Loader({ onLoaded }) {
    Loader.propTypes = {
        onLoaded: PropTypes.func.isRequired
    }
    const [loaded, setLoaded] = React.useState(false);
    useEffect(() => {
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
                    // Register the service worker
                    const registerServiceWorker = async () => {
                        // Check if the browser supports service workers
                        if ("serviceWorker" in navigator) {
                            try {
                                // Register the service worker
                                const registration = await navigator.serviceWorker.register("service-worker.js", {
                                    // Define the scope of the service worker
                                    scope: "/",
                                });
                                // Check if the service worker is active
                                if (registration.installing) {
                                    console.log("Service worker installing");
                                } else if (registration.waiting) {
                                    console.log("Service worker installed");
                                } else if (registration.active) {
                                    console.log("Service worker active");
                                }
                            } catch (error) {
                                console.error(`Registration failed with ${error}`);
                            }
                        }
                    };
                    registerServiceWorker();
                    //
                    await ImageCacheHandler.init()
                    //
                    //LocalMusicHandler.init()
                    //await LocalMusicHandler.getLocalLibrary()
                    //
                    await Utils.apiManager.init()
                    // add all consent links here
                    Utils.app.remoteClient.registerIframeUrl("https://consent.google.com/", `setInterval(() => document.getElementsByClassName("saveButtonContainer")[0].children[0].submit(), 100)`)
                    Utils.app.remoteClient.registerIframeUrl("https://consent.youtube.com/", `let alrE = false; setInterval(async () => { 
                        if(alrE) return
                        let data = {}
                        let dataStr = ""
                        document.querySelectorAll("form")[1].querySelectorAll("input").forEach(x => {
                            data[x.name] = x.value
                            dataStr += x.name + "=" + x.value + "&"
                        })
                        dataStr = dataStr.slice(0, -1)
                        if(data["continue"]) alrE = true
                        if(${Utils.app.platform == "Android"}) boundobject.addInterceptAllWebRequest("https://consent.youtube.com/save")
                        if(${Utils.app.platform == "Android"}) boundobject.addInterceptAllWebRequest("https://consent.youtube.com/")
                        console.log(window.boundobject.httpRequestPOST("https://consent.youtube.com/save", dataStr, "application/x-www-form-urlencoded"))
                        location.href = data["continue"]
                    }, 100)`)
                    //
                    setLoaded(true);
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
    }, [])
    return (
        <>
            <div className="load">
                <img
                    alt=""
                    className="load__logo"
                    src={mainLogo}
                />
            </div>
            <Login beginLogin={loaded} onFinished={() => { onLoaded(true) }} isForModification="login" />
        </>
    );
}