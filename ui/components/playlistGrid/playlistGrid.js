import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import LibraryWindow from "../../windows/library/library.js";

export default class PlaylistGrid extends HTMLDivElement {

    /**
     * @type {Playlist}
     */
    playlist = null;


    /**
     * 
     * @param {Playlist} playlist 
     */
    constructor(playlist) {
        super();
        this.playlist = playlist
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/playlistGrid/playlistGrid" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                this.shadowRoot.getElementById("title").innerText = this.playlist.name
                this.shadowRoot.getElementById("img").style.backgroundImage = "url('" + this.playlist.imgUrl + "')"
                this.addEventListener("mouseover", function () {
                    this.shadowRoot.getElementById("img").style.transform = "scale(1.1)"
                    this.shadowRoot.getElementById("cache").style.opacity = "1"
                });
                this.addEventListener("mouseout", function () {
                    this.shadowRoot.getElementById("img").style.transform = "scale(1)"
                    if (Utils.queueManager.currentObject != null && "pl_" + playlist.id != Utils.queueManager.currentObject.id) this.shadowRoot.getElementById("cache").style.opacity = "0"
                });
                this.addEventListener("click", function () {
                    if (!this.shadowRoot.getElementById("svg").matches(':hover')) {
                        if (playlist.userID === Utils.actualAccount.id) {
                            Utils.menu.changeWindow(Utils.menu.UserWindows.Library, "Library", false)
                            /**
                             * @type {LibraryWindow}
                             */
                            let win = Utils.menu.anWindow.win
                            Array.from(win.shadowRoot.getElementById("menu").children).forEach((x, y) => {
                                if (x.dataset && x.dataset["plid"] == playlist.id) win.changeView(y)
                            })
                        }
                        else {
                            Utils.musicViewer.changeView("pl_" + playlist.id)
                        }
                    }
                });
                Utils.player.onSongChange(async () => {
                    let isPlay = Utils.queueManager.currentObject != null && "pl_" + playlist.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                    shadow.getElementById("svg").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                    this.shadowRoot.getElementById("cache").style.opacity = Utils.queueManager.currentObject != null && "pl_" + playlist.id == Utils.queueManager.currentObject.id ? "1" : "0"
                })
                Utils.player.onPlay(async () => {
                    let isPlay = Utils.queueManager.currentObject != null && "pl_" + playlist.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                    shadow.getElementById("svg").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                    this.shadowRoot.getElementById("cache").style.opacity = Utils.queueManager.currentObject != null && "pl_" + playlist.id == Utils.queueManager.currentObject.id ? "1" : "0"
                })
                Utils.player.onPause(async () => {
                    let isPlay = Utils.queueManager.currentObject != null && "pl_" + playlist.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                    shadow.getElementById("svg").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                    this.shadowRoot.getElementById("cache").style.opacity = Utils.queueManager.currentObject != null && "pl_" + playlist.id == Utils.queueManager.currentObject.id ? "1" : "0"
                })
                shadow.getElementById("svg").addEventListener("click", async () => {
                    if (Utils.queueManager.currentObject != null && "pl_" + playlist.id == Utils.queueManager.currentObject.id) {
                        if (await Utils.player.getState()) Utils.player.pause()
                        else Utils.player.play()
                    }
                    else {
                        Utils.queueManager.changeQueue(playlist)
                    }
                })
                let isPlay = Utils.queueManager.currentObject != null && "pl_" + playlist.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                shadow.getElementById("svg").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                this.shadowRoot.getElementById("cache").style.opacity = Utils.queueManager.currentObject != null && "pl_" + playlist.id == Utils.queueManager.currentObject.id ? "1" : "0"
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
            }
        })
    }
}