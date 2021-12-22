import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";

export default class loginPanel extends HTMLDivElement
{
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

    #getIframeUrl = () =>
    {
        return new Promise((resolve) =>
        {
            this.#iframe.contentWindow.postMessage({ message: "getURL" }, Utils.servURL)
            window.addEventListener("message", (e) =>
            {
                if (e.origin == Utils.servURL.slice(0, -1))
                {
                    if (e.data.message == "callbackURL")
                    {
                        resolve(e.data.data)
                    }
                }
            })
        })
    }

    constructor(isForModification)
    {
        super(isForModification);
        var shadow = this.attachShadow({ mode: "open" })
        this.logged = function () { }
        this.isForModification = isForModification;
        shadow.innerHTML = Import.loadHTML("/ui/components/loginPanel/loginPanel.html")
        this.#iframe = this.shadowRoot.getElementById("iframe")
        this.#cache = this.shadowRoot.getElementById("cache")
        this.#svg = this.shadowRoot.getElementById("svg")
        this.shadowRoot.getElementById("cssImport").onload = () =>
        {
            this.shadowRoot.getElementById("loginBG").ontransitionend = (ev) => { };
            this.shadowRoot.getElementById("loginBG").style = ""
        }
        this.#iframe.onload = async (ifr) =>
        {
            if ((await this.#getIframeUrl()).includes("islogged.php"))
            {
                this.#iframe.style.visibility = "collapse"
                this.#iframe.contentWindow.postMessage({ message: "html" }, Utils.servURL)
            }
        }
        window.addEventListener("message", async (e) =>
        {
            if (e.origin == Utils.servURL.slice(0, -1))
            {
                if (e.data.message == "callbackHTML")
                {
                    let text = e.data.data.split("<br>").join("\n");
                    let params = text.split("\n")
                    let value = i => params[i].split(" = ")[1]
                    Utils.actualAccount = {
                        name: value(2),
                        avatarUrl: Utils.servURL + "account/" + value(3) + "/pp.gif"
                    }
                    console.log("Welcome " + Utils.actualAccount.name + " on AyMusic !")
                    this.shadowRoot.getElementById("loginBG").ontransitionend = (ev) =>
                    {
                        this.shadowRoot.getRootNode().host.parentElement.removeChild(this)
                        this.#eventEl.dispatchEvent(new CustomEvent("logged"));
                    };
                    this.shadowRoot.getElementById("loginBG").style.opacity = "0%"
                }
            }
        })
        if (!isForModification)
        {
            this.#iframe.src = Utils.servURL + "login/?inapp=1&date=" + Date.now().toString()
        }
    }

    set logged(callback)
    {
        this.#eventEl = document.createElement("event")
        this.#eventEl.addEventListener("logged", callback)
    }
}