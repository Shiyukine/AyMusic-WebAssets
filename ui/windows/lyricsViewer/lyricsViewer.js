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

export default class LyricsViewerWindow extends HTMLDivElement {
    isClosed = true;
    refreshing = false;
    currentArtistName = "";
    currentTitle = "";

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
        this.style.top = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "200px" : "45px"
        this.style.transform = "translateY(" + window.innerHeight + "px)"
        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") this.style.zIndex = "4"
        Import.getData("/ui/windows/lyricsViewer/lyricsViewer" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
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
                        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                            if (mov < dragInfo.yBase - 225) mov = dragInfo.yBase - 225
                        }
                        else {
                            if (mov < dragInfo.yBase - 70) mov = dragInfo.yBase - 70
                        }
                        //this.style.top = ((Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? 200 : 45) + mov) + "px"
                        this.style.transform = "translateY(" + (mov) + "px)"
                    }
                })
                window.addEventListener("pointerup", (e) => {
                    if (dragInfo.drag && !this.isClosed) {
                        if (e.y - dragInfo.yBase > 100) {
                            this.style.transition = "0.4s"
                            this.hide()
                        }
                        else {
                            this.style.transition = "0.3s"
                            //this.style.top = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "200px" : "45px"
                            this.style.transform = "translateY(0px)"
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
        Utils.app.remoteClient.registerIframeUrl("https://consent.google.com/", `setInterval(() => document.getElementsByClassName("saveButtonContainer")[0].children[0].submit(), 100)`)
    }

    async refresh() {
        if (!this.isClosed && !this.refreshing && (this.currentArtistName != Utils.queueManager.currentSong.singerName || this.currentTitle != Utils.queueManager.currentSong.title)) {
            this.currentArtistName = Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName
            this.currentTitle = Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title
            this.refreshing = true
            this.shadowRoot.getElementById("lyrics").innerText = '{lv.fetching}'
            console.log("Refreshing lyricsViewer")
            let script = await Utils.app.httpRequestGET(Utils.servURL + "/dl/AyMusic/scripts/MusixMatch/google.js")
            let title = Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title
            let artist = Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName
            title = title.split("(")[0]
            artist = artist.split(",")[0].split("(")[0]
            if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                title = encodeURIComponent(title)
                artist = encodeURIComponent(artist)
            }
            /**/
            TaskHandler.addTask("https://www.google.com/search?hl=en&q=" + (title + " " + artist + " lyrics").split(" ").join("+"), script, false, true, false, async (data) => {
                this.shadowRoot.getElementById("lyrics").innerText = data
                this.refreshing = false
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
                        TaskHandler.addTask("https://www.musixmatch.com/search/" + encodeURI(Utils.queueManager.currentSong.title + " " + Utils.queueManager.currentSong.singerName), script2, false, true, false, (nurl) => {
                            if (nurl == "ERROR") {
                                this.shadowRoot.getElementById("lyrics").innerText = "{lv.noData}"
                                this.refreshing = false
                            }
                            else {
                                TaskHandler.addTask(nurl, script, false, true, false, (data) => {
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

    show() {
        document.getElementById("main").appendChild(this)
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
        }
        this.style.transform = "translateY(" + window.innerHeight + "px)"
    }
}