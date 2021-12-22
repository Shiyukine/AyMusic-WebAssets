import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";

export default class loginPanel
{
    /**
     * @type {HTMLElement}
     */
    #bg = document.createElement("div");
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

    constructor(parent, isForModification)
    {
        this.logged = function () { }
        this.isForModification = isForModification;
        this.#bg.innerHTML = Import.loadHTML("/ui/components/loginPanel/loginPanel.html")
        this.#bg.style.width = "100%"
        this.#bg.style.height = "100%"
        this.#bg.style.position = "absolute"
        this.parent = parent
        this.#iframe = this.#bg.getElementsByClassName("iframe")[0]
        this.#cache = this.#bg.getElementsByClassName("cache")[0]
        this.#svg = this.#bg.getElementsByClassName("svg")[0]
        this.parent.appendChild(this.#bg)
        this.#bg.getElementsByClassName("cssImport")[0].onload = () =>
        {
            this.#bg.getElementsByClassName("loginBG")[0].ontransitionend = (ev) => { };
            this.#bg.getElementsByClassName("loginBG")[0].style = ""
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
                    this.#bg.getElementsByClassName("loginBG")[0].ontransitionend = (ev) =>
                    {
                        this.parent.removeChild(this.#bg)
                        this.#eventEl.dispatchEvent(new CustomEvent("logged"));
                    };
                    this.#bg.getElementsByClassName("loginBG")[0].style.opacity = "0%"
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