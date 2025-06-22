import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import Song from "../../../class/music/song.js";
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
    /**
     * @type {Playlist}
     */
    selectedPlaylistPicker = null;
    step = 0;
    curTaskUrl = "";

    urlsExist = [];
    songsToAdd = []
    songsToAddPl = []
    songsIDs = []
    currentItemNumber = 0
    errors = false;

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
                this.translation = new Translations(this.shadowRoot.children[1])
                new ThemeColor(this.shadowRoot.children[1])
                window.addEventListener("popstate", (e) => {
                    if (e.state.where == "playlistImporter") {
                    }
                    else {
                        if (this.shadowRoot.getElementById("cancel").style.display != "none" || this.step == 4)
                            this.close()
                    }
                }, { signal: this.controller.signal })
                this.shadowRoot.getElementById("next").disabled = true
                this.beginImport(platform)
                this.errors = false;
                this.songsToAdd = []
                this.currentItemNumber = 0
                this.songsIDs = []
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
                        if (pl != null) {
                            await Utils.player.pause()
                            this.step = 3
                            this.selectedPlaylistPicker = pl;
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
                            this.urlsExist = await Utils.apiManager.doPostRequest({
                                act: "getSongsUrl",
                                filter: (await PlatformHandler.getPlatformSettings(platform)).FilterSearch
                            })
                            let script = await Utils.app.httpRequestGET(await PlatformHandler.getPlatformUrl(platform, "GetPlaylistItemsScript"))
                            TaskHandler.addTask(url, script, false, true, true, async (data) => {
                            }, false)
                        }
                        else {
                            history.back()
                        }
                    }
                    if (this.step == 4) {
                        history.back()
                    }
                }
                this.shadowRoot.getElementById("cancel").onclick = () => {
                    TaskHandler.stopWebTaskManually(this.curTaskUrl, true)
                    history.back()
                }
                window.addEventListener("message", async (e) => {
                    if (/*e.origin == Utils.servURL.slice(0, -1) &&*/ e.data.message == "jseventcbdata") {
                        if (e.data.cb == "fatalerror") {
                            console.error(e.data.data.error)
                            this.changeText("{playlistImporter.title}", "{playlistImporter.importFatalError}");
                            this.changeloading(false);
                            this.shadowRoot.getElementById("next").innerText = "{close}"
                            this.shadowRoot.getElementById("next").disabled = false
                            // don't stop task when debugging
                            if (Utils.app.isRelease) TaskHandler.stopWebTaskManually(this.curTaskUrl, true)
                            this.step = 4
                        }
                        if (e.data.cb == "error") {
                            console.error(e.data.data.error)
                            this.errors = true
                        }
                        if (e.data.cb == "progressupdate") {
                            console.log("received items from " + platform)
                            for (let song of e.data.data.items) {
                                let songID = null
                                for (let songDB of this.urlsExist) {
                                    if (songDB["url"] == song.url) {
                                        songID = songDB["songID"]
                                    }
                                }
                                if (!songID) {
                                    // 2 last items in list: id, index
                                    this.songsToAdd.push([song.url, song.title, song.imgUrl, song.time, song.isExplicit, song.cropStart, song.cropEnd,
                                    song.albumName, song.albumType, song.albumImgUrl, song.albumUrl, song.singerName, song.singerImgUrl, song.singerUrl, song.singerNameAlias, song.additionalSingers, song.additionalAlbumSingers, null, this.currentItemNumber])
                                }
                                else {
                                    this.songsIDs.push([songID, this.currentItemNumber])
                                }
                                this.currentItemNumber++
                            }
                            this.changeloading(e.data.data.itemNumber / this.selectedPlaylist.songs * 50)
                            if (e.data.data.itemNumber == this.selectedPlaylist.songs) {
                                TaskHandler.stopWebTaskManually(this.curTaskUrl, true)
                                if (this.songsToAdd.length > 0) {
                                    for (let i = 0; i < this.songsToAdd.length; i += 50) {
                                        let nsongsID = await Utils.apiManager.doPostRequest({
                                            act: "addMultipleSongsDB",
                                            songs: this.songsToAdd.slice(i, i + 50)
                                        })
                                        for (let j in nsongsID) {
                                            let id = nsongsID[parseInt(j)]["songID"]
                                            this.songsToAdd[i + parseInt(j)][this.songsToAdd[i + parseInt(j)].length - 2] = id
                                        }
                                    }
                                }
                                let allSongs = this.songsToAdd.concat(this.songsIDs)
                                allSongs.sort((a, b) => a[a.length - 1] - b[b.length - 1])
                                for (let i = 0; i < allSongs.length; i += 50) {
                                    let songsIdsTmp = [];
                                    for (let song of allSongs.slice(i, i + 50)) {
                                        let id = song[song.length - 2]
                                        songsIdsTmp.push("so_" + id)
                                    }
                                    if (this.selectedPlaylistPicker.id == Utils.libManager.userLikedPl.id) this.errors = !(await Utils.libManager.addBatchObjsToLikedSongs(songsIdsTmp, true)) || this.errors
                                    else this.errors = !(await Utils.libManager.addBatchSongsToAPlaylist(this.selectedPlaylistPicker.id, songsIdsTmp, true)) || this.errors
                                    this.changeloading(50 + (i / allSongs.length * 50))
                                    await Utils.delay(100)
                                }
                                this.changeloading(100)
                                if (!this.errors) this.changeText("{playlistImporter.title}", "{playlistImporter.importedSuccess}");
                                else this.changeText("{playlistImporter.title}", "{playlistImporter.importedWithErrors}");
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
        this.curTaskUrl = url;
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
                        if (this.selectedDiv != null && this.selectedDiv != div) this.selectedDiv.classList.remove("selected")
                        this.selectedDiv = div
                        this.step = 1
                        this.shadowRoot.getElementById("next").disabled = false
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
            window.history.pushState({ where: "playlistImporter" }, "", "/index.html")
        });
    }

    changeText(text, subtext) {
        try {
            if (text != null) this.#textEl.innerHTML = text;
            if (subtext != null) this.#subtextEl.innerHTML = subtext.toString().split("\n").join("<br>");
        }
        catch {
            console.error("PlaylistImporter not initialized!")
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
            console.error("PlaylistImporter not initialized!")
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
            console.error("PlaylistImporter not initialized!")
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

    disconnectedCallback() {
        this.translation.end()
        this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
        this.__proto__ = null
    }
}