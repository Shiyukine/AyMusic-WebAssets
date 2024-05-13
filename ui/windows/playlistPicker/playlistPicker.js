import Import from "../../../class/import.js";
import PlatformHandler from "../../../class/player/platformHandler.js";
import TaskHandler from "../../../class/taskHandler.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";

export default class PlaylistPicker extends HTMLDivElement {
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

    playlistReturn = null;
    selectedPlaylist = null;
    step = 0;

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: 'open' });
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.3s"
        Import.getData("/ui/windows/playlistPicker/playlistPicker" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.#textEl = shadow.getElementById("text");
            this.#subtextEl = shadow.getElementById("subtext");
            this.#svg = shadow.getElementById("svg");
            this.#btnList = shadow.getElementById("btnList");
            this.#progressBar = shadow.getElementById("progressBar");
            this.changeText("{playlistPicker.title}", "{playlistPicker.wait}");
            this.changeloading(true);
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                this.shadowRoot.getElementById("panelInfoBG").ontransitionend = () => { };
                this.shadowRoot.getElementById("panelInfoBG").style = "";
                this.#loaded = true;
                new Translations(this.shadowRoot.children[1])
                new ThemeColor(this.shadowRoot.children[1])
                window.addEventListener("popstate", (e) => {
                    if (e.state.where == "playlistPicker") {
                    }
                    else {
                        if (this.shadowRoot.getElementById("cancel").style.display != "none") {
                            this.playlistReturn = "canceled"
                            this.close()
                        }
                    }
                }, { signal: this.controller.signal })
                this.changeText("{playlistPicker.title}", "{playlistPicker.choosePl}");
                this.changeloading(false);
                let havePl = false;
                for (let pl of Utils.libManager.userPlaylists) {
                    if (pl.name == "{pl.liked}" || (!pl.name.includes("{") && !pl.name.includes("}"))) {
                        havePl = true
                        let div = document.createElement("div")
                        div.classList.add("pl")
                        let img = document.createElement("img")
                        img.src = pl.name != "{pl.liked}" ? pl.imgUrl : "/resources/icon.ico"
                        div.appendChild(img)
                        let plTitle = document.createElement("p")
                        plTitle.classList.add("plTitle")
                        plTitle.innerText = pl.name
                        div.appendChild(plTitle)
                        let plInfo = document.createElement("p")
                        plInfo.classList.add("plInfo")
                        plInfo.innerText = pl.desc
                        div.appendChild(plInfo)
                        div.onclick = () => {
                            this.selectedPlaylist = pl
                            div.classList.add("selected")
                            if (this.selectedDiv != null) this.selectedDiv.classList.remove("selected")
                            this.selectedDiv = div
                            this.step = 1
                        }
                        this.shadowRoot.getElementById("plList").appendChild(div)
                    }
                }
                if (!havePl) {
                    this.changeText("{playlistPicker.title}", "{playlistPicker.noAvailPlaylists}");
                }
                this.shadowRoot.getElementById("next").onclick = () => {
                    if (this.step == 1) {
                        this.playlistReturn = this.selectedPlaylist
                    }
                }
                this.shadowRoot.getElementById("cancel").onclick = () => {
                    history.back()
                }
                window.addEventListener("message", (e) => {
                    if (/*e.origin == Utils.servURL.slice(0, -1) &&*/ e.data.message == "jseventcbdata") {
                        if (e.data.cb == "progressupdate") {
                            this.changeloading(e.data.curItem / e.data.items)
                        }
                    }
                })
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
            window.history.pushState({ where: "playlistImporter" }, "", "/index.html")
            setInterval(() => {
                if (this.playlistReturn != null) {
                    if (this.playlistReturn != "canceled") {
                        resolve(this.playlistReturn);
                        this.close();
                    }
                    else {
                        resolve(null)
                    }
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
            console.error("PlaylistPicker not initialized !")
        }
    }

    changeloading(newLoading = false) {
        try {
            if (typeof newLoading === 'number') {
                if (this.#progressBar.classList.contains("hidden")) this.#progressBar.classList.remove("hidden");
                this.#progressBar.style.width = newLoading + "%";
                this.#svg.classList.remove("playSVG");
                this.shadowRoot.getElementById("plList").classList.add("noSVG");
                if (this.#svg.parentElement) this.#svg.parentElement.removeChild(this.#svg);
            }
            else {
                if (!newLoading) {
                    if (this.#progressBar.classList.contains("hidden")) this.#progressBar.classList.remove("hidden");
                    this.#svg.classList.remove("playSVG");
                    this.shadowRoot.getElementById("plList").classList.add("noSVG");
                    if (this.#svg.parentElement) this.#svg.parentElement.removeChild(this.#svg);
                }
                else {
                    if (!this.#progressBar.classList.contains("hidden")) this.#progressBar.classList.add("hidden");
                    if (!this.#svg.parentElement) this.shadowRoot.getElementById("panelInfo").insertBefore(this.#svg, this.shadowRoot.getElementById("panelInfo").children[0]);
                    this.#svg.classList.add("playSVG");
                    this.shadowRoot.getElementById("plList").classList.remove("noSVG");
                }
            }
        }
        catch {
            console.error("PlaylistPicker not initialized !")
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
            console.error("PlaylistPicker not initialized !")
        }
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