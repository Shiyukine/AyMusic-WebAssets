import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";
import ThemeColor from "../../../class/themeColor.js";
import ImageCacheHandler from "../../../class/imageCacheHandler.js";

export default class LoginPanel extends HTMLDivElement {
    /**
     * @type {HTMLIFrameElement}
     */
    #iframe = null
    /**
     * @type {HTMLElement}
     */
    #cache = null
    /**
     * @type {HTMLElement}
     */
    #svg = null
    /**
    * @type {HTMLElement}
    */
    #eventEl = document.createElement("event");

    isClosed = false;
    controller = new AbortController();

    #getIframeUrl = () => {
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

    #getIframeHtml = () => {
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
            this.#iframe.contentWindow.postMessage({ message: "html", id: messID }, Utils.servURL)
        })
    }

    constructor(isForModification) {
        super(isForModification);
        var shadow = this.attachShadow({ mode: "open" })
        this.isForModification = isForModification;
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.3s"
        //this.style.zIndex = "101"
        Import.getData("/ui/components/loginPanel/loginPanel" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.#iframe = this.shadowRoot.getElementById("iframe")
            this.#cache = this.shadowRoot.getElementById("cache")
            this.#svg = this.shadowRoot.getElementById("svg")
            this.shadowRoot.getElementById("cssImport").onload = () => {
                this.shadowRoot.getElementById("loginBG").ontransitionend = () => { };
                if (document.getElementById("menu_win"))
                    document.getElementById("menu_win").style.zIndex = "0"
                this.translation = new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
            }
            this.shadowRoot.getElementById("loginBG").onclick = () => {
                if (isForModification == "modify") {
                    history.back()
                }
            }
            let loaded = false;
            this.addScript()
            this.#iframe.onload = async () => {
                let url = await this.#getIframeUrl();
                loaded = true;
                if (url.includes("islogged.php")) {
                    let data = await this.#getIframeHtml()
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
                        this.#eventEl.dispatchEvent(new CustomEvent("changedinfos"));
                    }
                    this.close()
                }
                if (url.includes("/login/index.php") && isForModification == "logout") {
                    console.log(await Utils.app.remoteClient.removeCache("Image/"))
                    ImageCacheHandler.cache = {}
                    console.log(await Utils.app.remoteClient.removeCache("API/"))
                    Utils.apiManager.cache = {}
                    location.reload()
                }
                if ((url.includes("login/?inapp=1") || url.includes("confirm.php")) && (isForModification == "" || isForModification == "refresh")) {
                    this.#eventEl.dispatchEvent(new CustomEvent("notconnected"));
                    this.style.opacity = "1"
                }
            }
            setTimeout(() => {
                if (!loaded && !this.isClosed) Utils.newError("Unable to reach the server :(", "The server is not accessible or there is an internal error when posting message to the iframe.")
            }, 21500)
            if (isForModification == "" || isForModification == "refresh") {
                this.#iframe.src = Utils.servURL + "login/?inapp=1&" + (Utils.app.platform == "Android" ? "injectscript=1" : "") + "&date=" + Date.now().toString()
            }
            //wait panel load
            this.clientWidth
            if (isForModification == "modify") {
                this.#iframe.src = Utils.servURL + "account/?inapp=1&date=" + Date.now().toString()
                this.style.opacity = "1"
            }
            if (isForModification == "logout") {
                this.#iframe.src = Utils.servURL + "login/logout.php?inapp=1&date=" + Date.now().toString()
                this.style.opacity = "1"
            }
        })
    }

    set logged(callback) {
        this.#eventEl.addEventListener("logged", callback)
    }

    set notConnected(callback) {
        this.#eventEl.addEventListener("notconnected", callback)
    }

    set onChangedInfos(callback) {
        this.#eventEl.addEventListener("changedinfos", callback)
    }

    close(triggerEvent = true) {
        this.shadowRoot.getElementById("loginBG").ontransitionend = () => {
            this.#endLogin();
        };
        if (triggerEvent) this.#eventEl.dispatchEvent(new CustomEvent("logged"));
        if (this.isForModification == "refresh") this.#endLogin()
        else this.shadowRoot.getElementById("loginBG").style.opacity = "0%"
    }

    #endLogin = () => {
        this.shadowRoot.getRootNode().host.parentElement.removeChild(this)
        if (document.getElementById("menu_win"))
            document.getElementById("menu_win").style.zIndex = ""
        this.isClosed = true
        this.controller.abort()
    }

    addScript() {
        try {
            let origin = "app://root"
            if (Utils.app.platform == "Android") origin = "https://myapp"
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

    disconnectedCallback() {
        this.translation.end()
        this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
        this.innerHTML = ""
        this.__proto__ = null
    }
}