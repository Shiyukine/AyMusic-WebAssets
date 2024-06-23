import React from "react";
import Utils from "../class/utils/utils";
import PropTypes from 'prop-types';
import ImageCacheHandler from "../class/imageCacheHandler";
import { useSpring, animated } from "@react-spring/web";

export default function Login({ isForModification, onFinished, beginLogin }) {
    Login.propTypes = {
        beginLogin: PropTypes.bool.isRequired,
        onFinished: PropTypes.func.isRequired,
        isForModification: PropTypes.string.isRequired
    }
    const [springs, api] = useSpring(() => ({
        from: {
            opacity: 0,
            width: "45%",
            height: "55%"
        }
    }))
    const startAnim = () => {
        api.start({
            to: {
                opacity: 1,
                width: "50%",
                height: "60%"
            }
        })
    }

    const startAnimRemove = () => {
        api.start({
            to: {
                opacity: 0,
                width: "40%",
                height: "40%"
            }
        })
    }

    async function oniFrameLoad(e) {
        let url = await getIframeUrl(e);
        console.log(url)
        if (url.includes("islogged.php")) {
            let data = await getIframeHtml(e)
            let text = data.split("<br>").join("\n");
            let params = text.split("\n")
            let value = i => params[i].split(" = ")[1]
            Utils.actualAccount = {
                name: value(2),
                id: value(3),
                email: value(0),
                apiKey: value(7),
                avatarUrl: await ImageCacheHandler.getCacheForImageUrl(Utils.servURL + "account/" + value(3) + "/pp.gif", isForModification == "modify")
            }
            Utils.apiManager.refreshApiKey()
            console.log("Welcome " + Utils.actualAccount.id + " to AyMusic !")
            if (isForModification == "modify") {
                document.getElementById("menu_win").changeAccountAvatar()
                document.getElementById("menu_win").anWindow.win.changeAccount();
            }
            onFinished(isForModification)
            startAnimRemove()
        }
        if (url.includes("/login/index.php") && isForModification == "logout") {
            console.log(await Utils.app.remoteClient.removeCache("Image/"))
            ImageCacheHandler.cache = {}
            console.log(await Utils.app.remoteClient.removeCache("API/"))
            Utils.apiManager.cache = {}
            location.reload()
        }
        if ((url.includes("login/?inapp=1") || url.includes("confirm.php")) && (isForModification == "login" || isForModification == "refresh")) {
            startAnim()
        }
    }

    function addScript() {
        try {
            let origin = Utils.getOrigin()
            Utils.app.remoteClient.registerIframeUrl(Utils.servURL, `addEventListener('message', (e) =>
            {
                if(e.origin.includes('` + origin + `'))
                {
                    if(e.data.message == 'getURL')
                    {
                        parent.postMessage({message: 'callbackURL', data: document.location.toString(), id: e.data.id}, '` + origin + `')
                    }
                    if(e.data.message == 'html')
                    {
                        parent.postMessage({message: 'callbackHTML', data: document.body.innerHTML, id: e.data.id}, '` + origin + `')
                    }
                }
            })`)
        }
        catch {
            console.warn("Login script already added")
        }
    }

    /**
     * 
     * @param {Event} e 
     * @returns 
     */
    function getIframeUrl(e) {
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
            e.target.contentWindow.postMessage({ message: "getURL", id: messID }, Utils.servURL)
        })
    }

    /**
     * 
     * @param {Event} e 
     * @returns 
     */
    function getIframeHtml(e) {
        let jsctrl = new AbortController();
        let messID = "log2_" + Date.now() + (Math.random() + 1).toString(36).substring(7)
        return new Promise((resolve) => {
            window.addEventListener("message", (e) => {
                if (e.origin == Utils.servURL.slice(0, -1) && e.data.id == messID) {
                    if (e.data.message == "callbackHTML") {
                        jsctrl.abort()
                        resolve(e.data.data)
                    }
                }
            }, { signal: jsctrl.signal })
            e.target.contentWindow.postMessage({ message: "html", id: messID }, Utils.servURL)
        })
    }

    if (beginLogin) {
        addScript()

        return (
            <animated.div className="login" style={{
                ...springs,
            }}>
                <iframe className="login__iframe" src={Utils.servURL + "/login/?inapp=1"} onLoad={oniFrameLoad}></iframe>
            </animated.div>
        );
    }
    else return (
        <></>
    )
}