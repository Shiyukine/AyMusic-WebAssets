import Import from "../../../class/import.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";

export default class InfoPanel extends HTMLDivElement {
    /**
     * @type {HTMLElement}
     */
    #textEl = null;
    /**
     * @type {HTMLElement}
     */
    #subtextEl = null;
    /**
     * @type {HTMLElement}
     */
    #svg = null;
    /**
     * @type {HTMLElement}
     */
    #btnList = null;
    /**
     * @type {HTMLElement}
     */
    #progressBar = null;

    #loaded = false;
    controller = new AbortController();
    isClosed = false;

    textReturn = "";

    constructor(text, subtext = null, buttons = null, isloading = false) {
        super(text, subtext, buttons, isloading);
        var shadow = this.attachShadow({ mode: 'open' });
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.3s"
        Import.getData("/ui/components/infoPanel/infoPanel" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.#textEl = shadow.getElementById("text");
            this.#subtextEl = shadow.getElementById("subtext");
            this.#svg = shadow.getElementById("svg");
            this.#btnList = shadow.getElementById("btnList");
            this.#progressBar = shadow.getElementById("progressBar");
            this.changeText(text, subtext);
            this.changeloading(isloading);
            if (buttons) {
                buttons.forEach(el => {
                    this.addButton(el.text, el.isPositive, el.onclick);
                });
            }
            this.shadowRoot.getElementById("cssImport").onload = () => {
                this.shadowRoot.getElementById("panelInfoBG").ontransitionend = () => { };
                this.shadowRoot.getElementById("panelInfoBG").style = "";
                this.#loaded = true;
                this.translation = new Translations(this.shadowRoot.children[1])
                new ThemeColor(this.shadowRoot.children[1])
            }
            this.shadowRoot.getElementById("panelInfoBG").style.zIndex = "100"
            this.style.opacity = "1"
        })
    }

    show() {
        if (this.#loaded) this.shadowRoot.getElementById("cssImport").dispatchEvent(new CustomEvent("load"));
        if (document.getElementById("menu_win"))
            document.getElementById("menu_win").style.zIndex = "0"
    }

    showDialog() {
        return new Promise(resolve => {
            this.show();
            this.style.zIndex = "101";
            setInterval(() => {
                if (this.textReturn != "") {
                    resolve(this.textReturn);
                    return;
                }
            }, 1);
        });
    }

    changeText(text, subtext) {
        try {
            if (text != null) this.#textEl.innerHTML = text;
            if (subtext != null) this.#subtextEl.innerHTML = subtext.toString().split("\n").join("<br>");
        }
        catch {
            console.error("Info panel not initialized !")
        }
    }

    changeloading(newLoading = false) {
        try {
            if (typeof newLoading === 'number') {
                if (this.#progressBar.classList.contains("hidden")) this.#progressBar.classList.remove("hidden");
                this.#progressBar.style.width = newLoading + "%";
                this.#svg.classList.remove("playSVG");
                if (this.#svg.parentElement) this.#svg.parentElement.removeChild(this.#svg);
            }
            else {
                if (!newLoading) {
                    if (this.#progressBar.classList.contains("hidden")) this.#progressBar.classList.remove("hidden");
                    this.#svg.classList.remove("playSVG");
                    if (this.#svg.parentElement) this.#svg.parentElement.removeChild(this.#svg);
                }
                else {
                    if (!this.#progressBar.classList.contains("hidden")) this.#progressBar.classList.add("hidden");
                    if (!this.#svg.parentElement) this.shadowRoot.getElementById("panelInfo").insertBefore(this.#svg, this.shadowRoot.getElementById("panelInfo").children[0]);
                    this.#svg.classList.add("playSVG");
                }
            }
        }
        catch {
            console.error("Info panel not initialized !")
        }
    }

    hide() {
        try {
            this.shadowRoot.getElementById("panelInfoBG").style.opacity = "0%";
            this.shadowRoot.getElementById("panelInfoBG").style.zIndex = "0"
            if (document.getElementById("menu_win"))
                document.getElementById("menu_win").style.zIndex = ""
        }
        catch {
            console.error("Info panel not initialized !")
        }
    }

    close() {
        this.shadowRoot.getElementById("panelInfoBG").ontransitionend = () => {
            if (this.shadowRoot.getRootNode().host.parentElement)
                this.shadowRoot.getRootNode().host.parentElement.removeChild(this);
            this.isClosed = true
            this.controller.abort()
        }
        this.hide()
        //this.changeloading(false)
    }

    addButton(text, isPositive = true, onclick) {
        let btn = document.createElement("button");
        btn.innerText = text;
        if (!isPositive) btn.classList.add("negative");
        btn.addEventListener("click", () => this.textReturn = text);
        btn.addEventListener("click", onclick);
        this.#btnList.appendChild(btn);
    }

    disconnectedCallback() {
        this.translation.end()
        this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
    }
}