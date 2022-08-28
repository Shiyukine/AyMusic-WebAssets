import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";

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
    #eventEl = null;

    isClosed = false;
    controller = new AbortController();

    #getIframeUrl = () => {
        return new Promise((resolve) => {
            this.#iframe.contentWindow.postMessage({ message: "getURL" }, Utils.servURL)
            window.addEventListener("message", (e) => {
                if (e.origin == Utils.servURL.slice(0, -1)) {
                    if (e.data.message == "callbackURL") {
                        resolve(e.data.data)
                    }
                }
            })
        })
    }

    constructor(isForModification) {
        super(isForModification);
        var shadow = this.attachShadow({ mode: "open" })
        this.logged = function () { }
        this.isForModification = isForModification;
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/components/loginPanel/loginPanel.html").then((html) => {
            shadow.innerHTML = html
            this.#iframe = this.shadowRoot.getElementById("iframe")
            this.#cache = this.shadowRoot.getElementById("cache")
            this.#svg = this.shadowRoot.getElementById("svg")
            this.shadowRoot.getElementById("cssImport").onload = () => {
                this.shadowRoot.getElementById("loginBG").ontransitionend = () => { };
                if (document.getElementById("menu_win"))
                    document.getElementById("menu_win").style.zIndex = "0"
                this.style.opacity = "1"
            }
            let loaded = false;
            this.addScript()
            this.#iframe.onload = async () => {
                let url = await this.#getIframeUrl();
                loaded = true;
                if (url.includes("islogged.php")) {
                    this.#iframe.contentWindow.postMessage({ message: "html" }, Utils.servURL)
                }
                if (url.includes("/login/index.php") && isForModification == "logout") {
                    Utils.app.remoteClient.refreshApp()
                }
            }
            window.addEventListener("message", (e) => {
                if (e.origin == Utils.servURL.slice(0, -1)) {
                    if (e.data.message == "callbackHTML") {
                        let text = e.data.data.split("<br>").join("\n");
                        let params = text.split("\n")
                        let value = i => params[i].split(" = ")[1]
                        Utils.actualAccount = {
                            name: value(2),
                            id: value(3),
                            email: value(0),
                            apiKey: value(7),
                            avatarUrl: Utils.servURL + "account/" + value(3) + "/pp.gif?date=" + Date.now().toString()
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
            })
            setTimeout(() => {
                if (!loaded) Utils.newError("Unable to reach the server :(", "The server is not accessible or there is an internal error when posting message to the iframe.")
            }, 21500)
            if (isForModification == "") {
                this.#iframe.src = Utils.servURL + "login/?inapp=1&date=" + Date.now().toString()
            }
            if (isForModification == "modify") {
                this.#iframe.src = Utils.servURL + "account/?inapp=1&date=" + Date.now().toString()
                this.shadowRoot.getElementById("loginBG").style.zIndex = "inherit"
            }
            if (isForModification == "logout") {
                this.#iframe.src = Utils.servURL + "login/logout.php?inapp=1&date=" + Date.now().toString()
            }
            this.style.opacity = "1"
        })
    }

    set logged(callback) {
        this.#eventEl = document.createElement("event")
        this.#eventEl.addEventListener("logged", callback)
    }

    close(triggerEvent = true) {
        this.shadowRoot.getElementById("loginBG").ontransitionend = () => {
            this.shadowRoot.getRootNode().host.parentElement.removeChild(this)
            if (document.getElementById("menu_win"))
                document.getElementById("menu_win").style.zIndex = ""
            this.isClosed = true
            while (this.firstChild) {
                this.removeChild(this.lastChild);
            }
            this.controller.abort()
        };
        if (triggerEvent) this.#eventEl.dispatchEvent(new CustomEvent("logged"));
        this.shadowRoot.getElementById("loginBG").style.opacity = "0%"
    }

    addScript() {
        try {
            Utils.app.remoteClient.registerIframeUrl(Utils.servURL, `addEventListener('message', (e) =>
            {
                if(e.origin.includes('myapp://root'))
                {
                    if(e.data.message == 'getURL')
                    {
                        parent.postMessage({message: 'callbackURL', data: document.location.toString()}, 'myapp://root')
                    }
                    if(e.data.message == 'html')
                    {
                        parent.postMessage({message: 'callbackHTML', data: document.body.innerHTML}, 'myapp://root')
                    }
                }
            })`)
        }
        catch {
            console.warn("Login script already added")
        }
    }
}