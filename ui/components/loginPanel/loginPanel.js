import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";
import ThemeColor from "../../../class/themeColor.js";

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

    messID = "log_" + Date.now()

    #getIframeUrl = () => {
        return new Promise((resolve) => {
            this.#iframe.contentWindow.postMessage({ message: "getURL", id: this.messID }, Utils.servURL)
            window.addEventListener("message", (e) => {
                if (e.origin == Utils.servURL.slice(0, -1) && e.data.id == this.messID) {
                    if (e.data.message == "callbackURL") {
                        resolve(e.data.data)
                    }
                }
            }, { signal: this.controller.signal })
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
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
            }
            let loaded = false;
            this.addScript()
            this.#iframe.onload = async () => {
                let url = await this.#getIframeUrl();
                loaded = true;
                if (url.includes("islogged.php")) {
                    this.#iframe.contentWindow.postMessage({ message: "html", id: this.messID }, Utils.servURL)
                }
                if (url.includes("/login/index.php") && isForModification == "logout") {
                    location.reload()
                }
                if ((url.includes("login/?inapp=1") || url.includes("confirm.php")) && isForModification == "") {
                    this.#eventEl.dispatchEvent(new CustomEvent("notconnected"));
                    this.style.opacity = "1"
                }
            }
            window.addEventListener("message", (e) => {
                if (e.origin == Utils.servURL.slice(0, -1) && e.data.id == this.messID) {
                    if (e.data.message == "callbackHTML") {
                        let text = e.data.data.split("<br>").join("\n");
                        let params = text.split("\n")
                        let value = i => params[i].split(" = ")[1]
                        Utils.actualAccount = {
                            name: value(2),
                            id: value(3),
                            email: value(0),
                            apiKey: value(7),
                            avatarUrl: Utils.servURL + "account/" + value(3) + "/pp.gif" + (Utils.app.platform != "Android" && Utils.app.platform != "iOS" ? "?date=" + Date.now().toString() : "")
                        }
                        Utils.apiManager.refreshApiKey()
                        console.log("Welcome " + Utils.actualAccount.id + " to AyMusic !")
                        if (isForModification == "modify") {
                            document.getElementById("menu_win").changeAccountAvatar()
                            document.getElementById("menu_win").anWindow.win.changeAccount();
                        }
                        this.close()
                    }
                }
            }, { signal: this.controller.signal })
            setTimeout(() => {
                if (!loaded) Utils.newError("Unable to reach the server :(", "The server is not accessible or there is an internal error when posting message to the iframe.")
            }, 21500)
            if (isForModification == "" || isForModification == "refresh") {
                this.#iframe.src = Utils.servURL + "login/?inapp=1&" + (Utils.app.platform == "Android" ? "injectscript=1" : "") + "&date=" + Date.now().toString()
            }
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
        while (this.firstChild) {
            this.removeChild(this.lastChild);
        }
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
}