import Import from "../../../class/import.js";

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
        Import.getData("/ui/components/infoPanel/infoPanel.html").then((html) => {
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
        if (text != null) this.#textEl.innerHTML = text;
        if (subtext != null) this.#subtextEl.innerHTML = subtext.toString().split("\n").join("<br>");
    }

    changeloading(newLoading = false) {
        if (typeof newLoading === 'number') {
            this.#progressBar.style.width = newLoading + "%";
            this.#svg.classList.remove("playSVG");
            this.#svg.parentElement.removeChild(this.#svg);
        }
        else {
            if (!newLoading) {
                this.#svg.classList.remove("playSVG");
                this.#svg.parentElement.removeChild(this.#svg);
            }
            else {
                this.#svg.classList.add("playSVG");
                this.shadowRoot.getElementById("panelInfo").insertBefore(this.shadowRoot.getElementById("panelInfo").firstChild, this.#svg);
            }
        }
    }

    hide() {
        this.shadowRoot.getElementById("panelInfoBG").style.opacity = "0%";
        this.shadowRoot.getElementById("panelInfoBG").style.zIndex = "0"
        if (document.getElementById("menu_win"))
            document.getElementById("menu_win").style.zIndex = ""
    }

    close() {
        this.shadowRoot.getElementById("panelInfoBG").ontransitionend = () => {
            if (this.shadowRoot.getRootNode().host.parentElement)
                this.shadowRoot.getRootNode().host.parentElement.removeChild(this);
            this.isClosed = true
            while (this.firstChild) {
                this.removeChild(this.lastChild);
            }
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
}