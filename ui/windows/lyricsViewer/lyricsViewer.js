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
import TaskHandler from "../../../class/taskHandler.js";
import GestureHandler from "../../../class/gestureHandler.js";

export default class LyricsViewerWindow extends HTMLElement {
    isClosed = true;
    refreshing = false;
    currendSongId = "";
    abort = new AbortController();

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
            this.style.left = "105px"
            this.style.height = "calc(100% - 135px)"
        }
        this.style.zIndex = "1"
        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") this.style.zIndex = "4"
        Import.getData("/ui/windows/lyricsViewer/lyricsViewer" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then(async (html) => {
            let insets = JSON.parse(await Utils.app.remoteClient.getWindowInsets());
            this.style.top = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? (200 - insets.bottom / devicePixelRatio) + "px" : "45px"
            this.style.transform = "translateY(" + window.innerHeight + "px)"
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                this.translation = new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.abort = new AbortController();
                window.addEventListener("popstate", (e) => {
                    console.log(e.state)
                    if (e.state.where != "lyricsViewer") {
                        this.hide()
                    }
                    else {
                        this.show(false)
                    }
                }, { signal: this.abort.signal })
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
                    if (!this.isClosed && !mouseHover && y >= 0) {
                        history.back()
                    }
                }, { signal: this.abort.signal })
            }
        })
    }

    async refresh() {
        if (!this.isClosed && !this.refreshing && this.currendSongId != Utils.queueManager.currentSong.id.replace("so_", "")) {
            this.currendSongId = Utils.queueManager.currentSong.id.replace("so_", "")
            this.refreshing = true
            this.shadowRoot.getElementById("lyrics").innerText = '{lv.fetching}'
            console.log("Refreshing lyricsViewer")
            let script = await (await fetch(Utils.servURL + "/dl/AyMusic/scripts/MusixMatch/google.js")).text()
            let title = Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title
            let artist = Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName
            title = title.split("(")[0]
            if (artist.includes("Various Artists") && Utils.queueManager.currentSong.additionalSingers.length > 0) artist = Utils.queueManager.currentSong.additionalSingers[0].singerName
            artist = artist.split(",")[0].split("(")[0]
            if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                title = encodeURIComponent(title)
                artist = encodeURIComponent(artist)
            }
            /**/
            TaskHandler.addTask("https://www.google.com/search?hl=en&q=" + (title + " " + artist + " lyrics").split(" ").join("+"), script, "fetchLyrics", true, false, async (data) => {
                if (data instanceof Error) {
                    console.error(data)
                    this.shadowRoot.getElementById("lyrics").innerText = "{lv.noData}"
                }
                else this.shadowRoot.getElementById("lyrics").innerText = data
                this.refreshing = false
                window.history.replaceState({ where: "lyricsViewer" }, "")
                /*if (data != "{lv.noData}") {
                        this.shadowRoot.getElementById("lyrics").innerText = data
                        this.refreshing = false
                    }
                    else {
                        let script = "";
                        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") script = Utils.app.remoteClient.httpRequestGET(Utils.servURL + "/dl/AyMusic/scripts/MusixMatch/lyrics.js")
                        else script = await Utils.app.remoteClient.httpRequestGET(Utils.servURL + "/dl/AyMusic/scripts/MusixMatch/lyrics.js", {
                            headers: {
                                "pragma": "no-cache",
                                "cache-control": "no-cache"
                            }
                        })
                        let script2 = "";
                        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") script2 = Utils.app.remoteClient.httpRequestGET(Utils.servURL + "/dl/AyMusic/scripts/MusixMatch/search.js")
                        else script2 = await Utils.app.remoteClient.httpRequestGET(Utils.servURL + "/dl/AyMusic/scripts/MusixMatch/search.js", {
                            headers: {
                                "pragma": "no-cache",
                                "cache-control": "no-cache"
                            }
                        })
                        TaskHandler.addTask("https://www.musixmatch.com/search/" + encodeURI(Utils.queueManager.currentSong.title + " " + Utils.queueManager.currentSong.singerName), script2, "fetchLyrics", true, false, (nurl) => {
                            if (nurl == "ERROR") {
                                this.shadowRoot.getElementById("lyrics").innerText = "{lv.noData}"
                                this.refreshing = false
                            }
                            else {
                                TaskHandler.addTask(nurl, script, "fetchLyrics", true, false, (data) => {
                                    this.shadowRoot.getElementById("lyrics").innerText = data
                                    this.refreshing = false
                                })
                            }
                        })
                    }*/
            }, false)
            console.log("lyricsViewer refreshed")
        }
    }

    show(updateHistory = true) {
        if (!this.isClosed) return
        document.getElementById("main").appendChild(this)
        if (updateHistory) window.history.pushState({ where: "lyricsViewer" }, "")
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
            this.ontransitionend = () => { }
            this.parentElement.removeChild(this)
            this.abort.abort();
        }
        this.style.transform = "translateY(" + window.innerHeight + "px)"
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