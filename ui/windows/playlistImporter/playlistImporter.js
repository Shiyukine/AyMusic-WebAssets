import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import PlatformHandler from "../../../class/player/platformHandler.js";
import TaskHandler from "../../../class/taskHandler.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import PlaylistPicker from "../playlistPicker/playlistPicker.js";

export default class PlaylistImporter extends HTMLDivElement {
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

    platform = null;
    selectedDiv = null;
    selectedPlaylist = null;
    step = 0;
    curTaskUrl = "";

    constructor(platform) {
        super(platform);
        var shadow = this.attachShadow({ mode: 'open' });
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.3s"
        Import.getData("/ui/windows/playlistImporter/playlistImporter" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.#textEl = shadow.getElementById("text");
            this.#subtextEl = shadow.getElementById("subtext");
            this.#svg = shadow.getElementById("svg");
            this.#btnList = shadow.getElementById("btnList");
            this.#progressBar = shadow.getElementById("progressBar");
            this.changeText("{playlistImporter.title}", "{playlistImporter.wait}");
            this.changeloading(true);
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                this.shadowRoot.getElementById("panelInfoBG").ontransitionend = () => { };
                this.shadowRoot.getElementById("panelInfoBG").style = "";
                this.#loaded = true;
                new Translations(this.shadowRoot.children[1])
                new ThemeColor(this.shadowRoot.children[1])
                this.beginImport(platform)
                this.shadowRoot.getElementById("next").onclick = async () => {
                    if (this.step == 1) {
                        this.shadowRoot.getElementById("plList").innerHTML = ""
                        this.step == 2
                        let plPicker = new PlaylistPicker();
                        shadow.getElementById("panelInfoBG").appendChild(plPicker)
                        /**
                         * @type {Playlist|string}
                         */
                        let pl = await plPicker.showDialog()
                        if (pl != "canceled") {
                            this.step = 3
                            this.changeText("{playlistImporter.title}", "{playlistImporter.importing}");
                            this.changeloading(true);
                            this.shadowRoot.getElementById("next").innerText = "{playlistImporter.wait}"
                            this.shadowRoot.getElementById("next").disabled = true
                            this.shadowRoot.getElementById("cancel").style.display = "none"
                            let url = await PlatformHandler.getPlatformUrl(platform, "GetPlaylistItemsUrl");
                            url = url.replace("%url%", this.selectedPlaylist.url)
                            url = url.replace("%itemsNb%", this.selectedPlaylist.songs)
                            if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform) {
                                url = url.split("%token%").join((await PlatformHandler.getPlatformSettings(platform)).Token)
                            }
                            this.curTaskUrl = url;
                            let script = await Utils.app.httpRequestGET(await PlatformHandler.getPlatformUrl(platform, "GetPlaylistItemsScript"))
                            TaskHandler.addTask(url, script, false, true, true, async (data) => {
                            }, false)
                        }
                    }
                    if (this.step == 4) {
                        this.close()
                    }
                }
                this.shadowRoot.getElementById("cancel").onclick = () => {
                    this.close();
                }
                window.addEventListener("message", (e) => {
                    if (/*e.origin == Utils.servURL.slice(0, -1) &&*/ e.data.message == "jseventcbdata") {
                        if (e.data.cb == "progressupdate") {
                            console.log(e.data.data)
                            // add songs to db
                            // and add songs to requested pl
                            if (e.data.data.itemNumber == this.selectedPlaylist.songs) {
                                TaskHandler.stopWebTaskManually(this.curTaskUrl, true)
                                this.changeText("{playlistImporter.title}", "{playlistImporter.imported}");
                                this.changeloading(false);
                                this.shadowRoot.getElementById("next").innerText = "{close}"
                                this.shadowRoot.getElementById("next").disabled = false
                                this.step = 4
                            }
                        }
                    }
                }, { signal: this.controller.signal })
            }
            this.shadowRoot.getElementById("panelInfoBG").style.zIndex = "100"
            this.style.opacity = "1"
        })
    }

    async beginImport(platform) {
        if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform &&
            (await PlatformHandler.getPlatformSettings(platform)).Token == "") {
            console.log("Platform need refresh token")
            await PlatformHandler.refreshTokenForPlatform(platform)
            console.log("Platform token refreshed")
        }
        let url = await PlatformHandler.getPlatformUrl(platform, "GetPlaylistsUrl");
        if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform) {
            url = url.split("%token%").join((await PlatformHandler.getPlatformSettings(platform)).Token)
        }
        let script = await Utils.app.httpRequestGET(await PlatformHandler.getPlatformUrl(platform, "GetPlaylistsScript"))
        TaskHandler.addTask(url, script, false, true, false, async (data) => {
            if (data == "Error" && (await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform) {
                console.log("Platform need refresh token")
                await PlatformHandler.refreshTokenForPlatform(platform)
                console.log("Platform token refreshed")
                this.beginImport(platform)
            }
            else {
                this.changeText("{playlistImporter.title}", "{playlistImporter.choosePl}");
                this.changeloading(false);
                this.shadowRoot.getElementById("next").innerText = "{next}"
                this.shadowRoot.getElementById("next").disabled = false
                let json = JSON.parse(data)
                json.forEach(pl => {
                    let div = document.createElement("div")
                    div.classList.add("pl")
                    let img = document.createElement("img")
                    img.src = pl.imgUrl
                    div.appendChild(img)
                    let plTitle = document.createElement("p")
                    plTitle.classList.add("plTitle")
                    plTitle.innerText = pl.title
                    div.appendChild(plTitle)
                    let plInfo = document.createElement("p")
                    plInfo.classList.add("plInfo")
                    plInfo.innerText = pl.songs + " songs"
                    div.appendChild(plInfo)
                    div.onclick = () => {
                        this.selectedPlaylist = pl
                        div.classList.add("selected")
                        if (this.selectedDiv != null) this.selectedDiv.classList.remove("selected")
                        this.selectedDiv = div
                        this.step = 1
                    }
                    this.shadowRoot.getElementById("plList").appendChild(div)
                });
            }
        }, false)
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
                    if (!this.#svg.parentElement) this.shadowRoot.getElementById("panelInfo").insertBefore(this.#svg, this.shadowRoot.getElementById("btnList"));
                    this.#svg.classList.add("playSVG");
                    this.shadowRoot.getElementById("plList").classList.remove("noSVG");
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