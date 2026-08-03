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
import GestureHandler from "../../../class/gestureHandler.js";

export default class QueueViewerWindow extends HTMLElement {
    isClosed = true;
    abort = new AbortController();

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.position = "absolute"
        this.style.zIndex = "1"
        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
            this.style.width = "calc(100% - 10px)"
            this.style.marginLeft = "5px"
            this.style.height = "calc(100% - 200px)"
        }
        else {
            this.style.width = "calc(100% - 5px)"
            this.style.left = "105px"
            this.style.height = "calc(100% - 135px)"
        }
        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") this.style.zIndex = "4"
        Import.getData("/ui/windows/queueViewer/queueViewer" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then(async (html) => {
            let insets = JSON.parse(await Utils.app.remoteClient.getWindowInsets());
            this.style.top = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? (200 - insets.bottom / devicePixelRatio) + "px" : "45px"
            this.style.transform = "translateY(" + window.innerHeight + "px)"
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                this.translation = new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.abort = new AbortController();
                window.addEventListener("popstate", (e) => {
                    if (e.state.where != "queueViewer") {
                        this.hide()
                    }
                    else {
                        this.show(false)
                    }
                }, { signal: this.abort.signal })
                Utils.queueManager.onQueueChanged(() => {
                    this.refresh()
                })
                Utils.player.onSongChange(() => {
                    this.refresh()
                })
                let gesture2 = new GestureHandler(this, true, 100)
                let quitViewer = () => {
                    gesture2.acceptGesture()
                    history.back()
                }
                gesture2.addEventListener("bottom", quitViewer)
                gesture2.blockSwipeFrom("bottom")
                shadow.getElementById("scroll").addEventListener("scroll", () => {
                    if (shadow.getElementById("scroll").scrollTop > 0) gesture2.blockSwipeFrom("top")
                    else gesture2.dontBlockSwipeFrom("top")
                })
                shadow.getElementById("close").addEventListener("pointerenter", () => {
                    gesture2.dontBlockSwipeFrom("top")
                })
                shadow.getElementById("close").addEventListener("pointerleave", () => {
                    if (shadow.getElementById("scroll").scrollTop > 0) gesture2.blockSwipeFrom("top")
                })
                shadow.getElementById("close").addEventListener("touchstart", () => {
                    gesture2.dontBlockSwipeFrom("top")
                })
                shadow.getElementById("close").addEventListener("touchend", () => {
                    if (shadow.getElementById("scroll").scrollTop > 0) gesture2.blockSwipeFrom("top")
                })
                let mouseHover = false
                this.addEventListener("pointerenter", () => mouseHover = true)
                this.addEventListener("pointerleave", () => mouseHover = false)
                window.addEventListener("pointerdown", (e) => {
                    var rect = e.target.getBoundingClientRect();
                    var y = rect.bottom - e.clientY
                    if (!this.isClosed && !mouseHover && e.target != this && y >= 0) {
                        if (e.target.tagName != 'CONTEXT-MENU') {
                            history.back()
                        }
                        else {
                            setTimeout(() => {
                                this.hide()
                            }, 300);
                        }
                    }
                }, { signal: this.abort.signal })
            }
        })
    }

    async refresh() {
        if (!this.isClosed) {
            console.log("Refreshing queueViewer")
            if (this.translation) this.translation.pause()
            this.clearAll()
            var curI = Utils.queueManager.currentIndex
            for (let i in Utils.queueManager.allSongs) {
                let song = Utils.queueManager.allSongs[i].song
                let pl = Utils.queueManager.allSongs[i].obj
                if (i == curI) {
                    this.shadowRoot.getElementById("cur").appendChild(new SongGrid(song, pl))
                }
                if (i > curI && i - curI < 50) {
                    let songGrid = new SongGrid(song, pl)
                    songGrid.overrideClick = () => {
                        Utils.queueManager.seekToSong(song)
                    }
                    songGrid.contextMenuAddItems.push({
                        name: "{qv.removeFromQueue}",
                        action: () => {
                            Utils.queueManager.removeFromQueue(parseInt(i))
                        }
                    })
                    this.shadowRoot.getElementById("next").appendChild(songGrid)
                }
            }
            if (this.translation) this.translation.resume()
            console.log("queueViewer refreshed")
        }
    }

    show(updateHistory = true) {
        if (!this.isClosed) return
        document.getElementById("main").appendChild(this)
        if (updateHistory) window.history.pushState({ where: "queueViewer" }, "")
        this.clientWidth //wait element loaded
        this.style.transition = "0.3s"
        this.style.transform = "translateY(0px)"
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
            this.abort.abort();
        }
        this.style.transform = "translateY(" + window.innerHeight + "px)"
    }

    clearAll() {
        while (this.shadowRoot.getElementById("cur").firstChild) {
            this.shadowRoot.getElementById("cur").removeChild(this.shadowRoot.getElementById("cur").lastChild);
        }
        while (this.shadowRoot.getElementById("next").firstChild) {
            this.shadowRoot.getElementById("next").removeChild(this.shadowRoot.getElementById("next").lastChild);
        }
    }

    disconnectedCallback() {
        /* no close function, so do not do this
        this.translation.end()
        //this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""*/
    }
}