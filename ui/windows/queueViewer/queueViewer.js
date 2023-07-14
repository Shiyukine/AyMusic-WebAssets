import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import PlaylistGrid from "../../components/playlistGrid/playlistGrid.js";
import AlbumGrid from "../../components/albumGrid/albumGrid.js";
import SingerGrid from "../../components/singerGrid/singerGrid.js"
import Album from "../../../class/music/album.js";
import Singer from "../../../class/music/singer.js";
import Playlist from "../../../class/music/playlist.js";
import SongGrid from "../../components/songGrid/songGrid.js";
import ThemeColor from "../../../class/themeColor.js";

export default class QueueViewerWindow extends HTMLDivElement {
    isClosed = true;

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.position = "absolute"
        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
            this.style.width = "calc(100% - 10px)"
            this.style.marginLeft = "5px"
            this.style.height = "calc(100% - 200px)"
        }
        else {
            this.style.width = "calc(100% - 5px)"
            this.style.height = "calc(100% - 135px)"
        }
        this.style.top = window.innerHeight + "px"
        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") this.style.zIndex = "4"
        Import.getData("/ui/windows/queueViewer/queueViewer" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                Utils.queueManager.onQueueChanged(() => {
                    this.refresh()
                })
                Utils.player.onSongChange(() => {
                    this.refresh()
                })
                let dragInfo = {
                    drag: false,
                    yBase: 0
                };
                shadow.getElementById("close").addEventListener("pointerdown", (e) => {
                    this.style.transition = ""
                    dragInfo.drag = true
                    dragInfo.yBase = e.y
                })
                window.addEventListener("pointermove", (e) => {
                    if (dragInfo.drag && !this.isClosed) {
                        let mov = e.y - dragInfo.yBase
                        if (Utils.app.platform != "Android" && Utils.app.platform != "iOS" && mov < dragInfo.yBase - 70) mov = dragInfo.yBase - 70
                        this.style.top = ((Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? 200 : 45) + mov) + "px"
                    }
                })
                window.addEventListener("pointerup", (e) => {
                    if (dragInfo.drag && !this.isClosed) {
                        if (e.y - dragInfo.yBase > 100) {
                            this.style.transition = "0.7s"
                            this.hide()
                        }
                        else {
                            this.style.transition = "0.3s"
                            this.style.top = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "200px" : "45px"
                        }
                        dragInfo.drag = false
                        dragInfo.yBase = 0
                    }
                })
                let mouseHover = false
                this.addEventListener("pointerenter", () => mouseHover = true)
                this.addEventListener("pointerleave", () => mouseHover = false)
                window.addEventListener("pointerdown", (e) => {
                    var rect = e.target.getBoundingClientRect();
                    var y = rect.bottom - e.clientY
                    if (!this.isClosed && !mouseHover && y >= 0) {
                        this.hide()
                    }
                })
            }
        })
    }

    async refresh() {
        if (!this.isClosed) {
            console.log("Refreshing queueViewer")
            this.clearAll()
            var curI = Utils.queueManager.currentIndex
            for (let i in Utils.queueManager.allSongs) {
                let song = Utils.queueManager.allSongs[i].song
                let pl = Utils.queueManager.allSongs[i].obj
                if (i == curI) {
                    this.shadowRoot.getElementById("cur").appendChild(new SongGrid(song, pl))
                }
                if (i > curI && i - curI < 50) {
                    this.shadowRoot.getElementById("next").appendChild(new SongGrid(song, pl))
                }
            }
            console.log("queueViewer refreshed")
        }
    }

    show() {
        document.getElementById("main").appendChild(this)
        this.clientWidth //wait element loaded
        this.style.transition = "0.3s"
        this.style.top = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "200px" : "45px"
        this.isClosed = false
        this.refresh()
    }

    hide() {
        this.style.transition = "0.3s"
        this.ontransitionend = () => {
            this.isClosed = true
            this.clearAll()
            this.ontransitionend = () => { }
            this.parentElement.removeChild(this)
        }
        this.style.top = window.innerHeight + "px"
    }

    clearAll() {
        while (this.shadowRoot.getElementById("cur").firstChild) {
            this.shadowRoot.getElementById("cur").removeChild(this.shadowRoot.getElementById("cur").lastChild);
        }
        while (this.shadowRoot.getElementById("next").firstChild) {
            this.shadowRoot.getElementById("next").removeChild(this.shadowRoot.getElementById("next").lastChild);
        }
    }
}