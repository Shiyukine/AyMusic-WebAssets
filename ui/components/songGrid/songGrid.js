import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import Song from "../../../class/music/song.js";
import Utils from "../../../class/utils/utils.js";
import ContextMenu from "../contextMenu/contextMenu.js";
import ThemeColor from "../../../class/themeColor.js";
import Album from "../../../class/music/album.js";
import Singer from "../../../class/music/singer.js";
import PlatformHandler from "../../../class/player/platformHandler.js";
import ImageCacheHandler from "../../../class/imageCacheHandler.js";

export default class SongGrid extends HTMLDivElement {

    /**
     * @type {Song}
     */
    song = null;
    /**
     * @type {Playlist|Album|Singer}
     */
    object = null;

    changeRequested = false

    controller = new AbortController()

    /**
     * @type {ContextMenu}
     */
    cm = null;
    /**
     * @type {ContextMenu}
     */
    cm2 = null;

    /**
     * 
     * @param {Song} song 
     * @param {Playlist|Album|Singer} object
     */
    constructor(song, object = null, dontShow) {
        super();
        this.object = object;
        var shadow = this.attachShadow({ mode: "open" })
        if (song !== null) this.changeSong(song, dontShow)
        else {
            shadow.innerHTML = `<div></div>`
        }
        //DON'T FORGET TO CHANGE IF NECESSARY!!
        if (!dontShow) this.style.height = "70px"
    }

    disconnectedCallback() {
        this.controller.abort()
        if (this.shadowRoot) {
            while (this.shadowRoot.firstChild) {
                this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }
            this.shadowRoot.innerHTML = ""
        }
        this.innerHTML = ""
        this.__proto__ = null
        if (this.cm) this.cm.close()
        this.cm = null
        if (this.cm2) this.cm2.close()
        this.cm2 = null
    }

    isMySong() {
        let b = this.object == null || (Utils.queueManager.currentObject != null && Utils.queueManager.currentObject.id == "pl_" + this.object.id && this.object.constructor == Playlist)
        b = b || this.object == null || (Utils.queueManager.currentObject != null && Utils.queueManager.currentObject.id == "al_" + this.object.id && this.object.constructor == Album)
        b = b || this.object == null || (Utils.queueManager.currentObject != null && Utils.queueManager.currentObject.id == "si_" + this.object.id && this.object.constructor == Singer)
        return Utils.queueManager.currentSong != null && this.song != null && Utils.queueManager.currentSong.id == this.song.id && b
    }

    /**
     * 
     * @param {Song} song 
     */
    async updateGrid(song) {
        this.shadowRoot.getElementById("title").innerText = this.song.aliasTitle != null ? song.aliasTitle : this.song.title
        this.shadowRoot.getElementById("artist").innerHTML = ""
        let span = document.createElement("span")
        span.innerText = this.song.aliasSingerName != null ? song.aliasSingerName : this.song.singerName
        span.classList.add("link")
        span.onclick = async function () {
            if (!(Utils.app.platform == "Android" || Utils.app.platform == "iOS") && song.imgUrl !== "localImg") {
                Utils.musicViewer.changeView("si_" + song.singerID)
            }
        }
        this.shadowRoot.getElementById("artist").appendChild(span)
        if (song.imgUrl !== "localImg") {
            for (let sing of song.additionalSingers) {
                let sep = document.createElement("span")
                sep.innerText = " • "
                this.shadowRoot.getElementById("artist").appendChild(sep)
                let span2 = document.createElement("span")
                span2.innerText = sing.aliasSingerName != null ? sing.aliasSingerName : sing.singerName
                span2.classList.add("link")
                span2.onclick = async function () {
                    if (!(Utils.app.platform == "Android" || Utils.app.platform == "iOS"))
                        Utils.musicViewer.changeView("si_" + sing.singerID)
                }
                this.shadowRoot.getElementById("artist").appendChild(span2)
            }
        }
        this.shadowRoot.getElementById("time").innerText = this.song.time == -1 ? "--:--:--" : Utils.msToTime(this.song.time)
        if (Utils.libManager.isSongIsInLikedSongs(song)) {
            this.shadowRoot.getElementById("like").children[0].setAttribute("d", Utils.pathsData["Heart"])
        }
        else {
            this.shadowRoot.getElementById("like").children[0].setAttribute("d", Utils.pathsData["HeartOutline"])
        }
        if (song.isExplicit) {
            this.shadowRoot.getElementById("svg_explicit").style.display = "block"
        }
        else {
            this.shadowRoot.getElementById("svg_explicit").style.display = ""
        }
        let plat = song.imgUrl == "localImg" ? "iconround" : await PlatformHandler.getPlatformBySongUrl(song.url)
        plat = plat.toLowerCase()
        this.shadowRoot.getElementById("platform").style.backgroundImage = "url('/resources/" + plat + ".ico')"
        if (this.song.imgUrl === "localImg") {
            if (this.song.canBeLoaded) {
                var imge = this.shadowRoot.getElementById("img");
                let imgU = "app://data"
                if (Utils.app.platform == "Android") imgU = "https://mydata";
                imge.style.backgroundImage = "url('" + imgU + "/Image/" + this.song.id + ".png'), url('/resources/icon.ico')"
            }
            else {
                this.shadowRoot.getElementById("img").style.backgroundImage = "url('/resources/icon.ico')"
            }
        }
        else {
            let iUrl = await ImageCacheHandler.getCacheForImageUrl(this.song.imgUrl)
            this.shadowRoot.getElementById("img").style.backgroundImage = "url('" + iUrl + "')"
        }
        if (Utils.app.platform != "Android" && Utils.app.platform != "iOS") {
            if (song.imgUrl === "localImg") {
                this.shadowRoot.getElementById("title").classList.add("nohover")
                this.shadowRoot.getElementById("artist").classList.add("nohover")
            }
            this.shadowRoot.getElementById("title").addEventListener("click", async function () {
                if (song.imgUrl !== "localImg") {
                    Utils.musicViewer.changeView("al_" + song.albumID)
                }
            });
        }
    }

    /**
     * 
     * @param {Song} song 
     */
    async changeSong(song, dontShow = false) {
        if (!dontShow) {
            if (this.song === null) {
                Import.getData("/ui/components/songGrid/songGrid" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
                    this.controller = new AbortController()
                    this.shadowRoot.innerHTML = html
                    this.shadowRoot.getElementById("cssImport").onload = async () => {
                        //new Translations(shadow.children[1])
                        this.song = song;
                        this.updateGrid(song)
                        this.addEventListener("mouseover", function () {
                            this.shadowRoot.getElementById("svg").style.opacity = "1"
                            this.shadowRoot.getElementById("cache").style.opacity = "1"
                        }, { signal: this.controller.signal });
                        this.addEventListener("mousemove", function () {
                            this.shadowRoot.getElementById("svg").style.opacity = "1"
                            this.shadowRoot.getElementById("cache").style.opacity = "1"
                        }, { signal: this.controller.signal });
                        this.addEventListener("mouseout", function () {
                            if (!this.isMySong()) {
                                this.shadowRoot.getElementById("svg").style.opacity = "0"
                                this.shadowRoot.getElementById("cache").style.opacity = "0"
                            }
                        }, { signal: this.controller.signal });
                        this.shadowRoot.getElementById("like").addEventListener("click", async function () {
                            Utils.libManager.addOrRemoveSongLikedSongs(song)
                        }, { signal: this.controller.signal });
                        let pl = this.object;
                        let curThis = this;
                        let elToClick = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? this : this.shadowRoot.getElementById("svg")
                        elToClick.addEventListener("click", async function () {
                            if ((Utils.app.platform != "Android" && Utils.app.platform != "iOS") ||
                                (!this.shadowRoot.getElementById("context").matches(":hover") && !this.shadowRoot.getElementById("like").matches(":hover"))) {
                                if (curThis.isMySong()) {
                                    if (await Utils.player.getState()) Utils.player.pause()
                                    else Utils.player.play()
                                }
                                else {
                                    if (pl != null) await Utils.queueManager.changeQueue(pl, curThis.song.id)
                                    else await Utils.queueManager.changeQueue(curThis.song)
                                }
                            }
                        }, { signal: this.controller.signal });
                        if (this.cm == null)
                            this.cm = new ContextMenu()
                        let cm = this.cm
                        this.shadowRoot.getElementById("context").onclick = async (e) => {
                            cm.show(e)
                        }
                        this.addEventListener("pointerup", async (e) => {
                            if (e.button == 2) {
                                cm.show(e)
                            }
                        }, { signal: this.controller.signal });
                        cm.beforeShow = async () => {
                            cm.addElement("{wt.addQueue}", () => {
                                //Utils.newError("Can't do this", "This feature will be added soon :)")
                                Utils.queueManager.addToQueue(song)
                            })
                            if (this.song.imgUrl !== "localImg") {
                                cm.addElement("{lib.goArtist}", () => {
                                    Utils.musicViewer.changeView("si_" + song.singerID)
                                })
                                cm.addElement("{lib.goAlbum}", () => {
                                    Utils.musicViewer.changeView("al_" + song.albumID)
                                })
                                cm.addElement("{lib.openLink}", () => {
                                    Utils.app.remoteClient.openLink(song.url)
                                })
                            }
                            cm.addElement("{lib.modifySong}", () => {
                                Utils.musicViewer.changeView("so_" + song.id)
                            })
                            if (this.object != null && this.object.id != Utils.libManager.userInfo.likedSongsPlId && Utils.libManager.userPlaylists.includes(this.object)) {
                                let result = await Utils.apiManager.doPostRequest({
                                    act: "getIdSongsInPlaylist",
                                    playlistID: this.object.id,
                                    orderByDesc: false
                                })
                                if (result.includes("so_" + song.id)) {
                                    cm.addElement("{lib.removeFromPl}", () => {
                                        Utils.libManager.removeSongFromAPlaylist(this.object.id, "so_" + song.id)
                                        //this.parentElement.removeChild(this)
                                    })
                                }
                            }
                            cm.addElement(Utils.libManager.isSongIsInLikedSongs(song) ? "{lib.removeLikedSong}" : "{lib.addLikedSong}", () => {
                                Utils.libManager.addOrRemoveSongLikedSongs(song)
                            })
                            if (this.cm2 == null)
                                this.cm2 = new ContextMenu()
                            let cm2 = this.cm2
                            cm2.beforeShow = () => {
                                let havePl = false;
                                for (let pl of Utils.libManager.userPlaylists) {
                                    if (!pl.name.includes("{") && !pl.name.includes("}")) {
                                        havePl = true
                                        cm2.addElement(pl.name, () => {
                                            Utils.libManager.addSongToAPlaylist(pl.id, "so_" + song.id)
                                        })
                                    }
                                }
                                if (!havePl) {
                                    cm2.addElement("No playlists available", () => { })
                                }
                            }
                            cm.addSubContextMenu("{lib.addToPl}", cm2)
                        }
                        if (this.isMySong()) {
                            this.shadowRoot.getElementById("title").style.color = "#00ccff"
                            if (await Utils.player.getState()) this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Pause"])
                            this.shadowRoot.getElementById("svg").style.opacity = "1"
                            this.shadowRoot.getElementById("cache").style.opacity = "1"
                        }
                        else {
                            this.shadowRoot.getElementById("title").style.color = "white"
                            this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Play"])
                            this.shadowRoot.getElementById("svg").style.opacity = "0"
                            this.shadowRoot.getElementById("cache").style.opacity = "0"
                        }
                    }
                    Utils.libManager.addEventListener("addsongtolikedsongs", (e) => {
                        if (song != null && e.detail.objId == "so_" + song.id) {
                            this.shadowRoot.getElementById("like").children[0].setAttribute("d", Utils.pathsData["Heart"])
                        }
                    }, { signal: this.controller.signal });
                    Utils.libManager.addEventListener("removesongfromlikedsongs", (e) => {
                        if (song != null && e.detail.objId == "so_" + song.id) {
                            this.shadowRoot.getElementById("like").children[0].setAttribute("d", Utils.pathsData["HeartOutline"])
                        }
                    }, { signal: this.controller.signal });
                    Utils.player.addEventListener("songchange", async () => {
                        if (this.isMySong()) {
                            this.shadowRoot.getElementById("title").style.color = "#00ccff"
                            //if (await Utils.player.getState()) this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Pause"])
                            this.shadowRoot.getElementById("svg").style.opacity = "1"
                            this.shadowRoot.getElementById("cache").style.opacity = "1"
                        }
                        else {
                            this.shadowRoot.getElementById("title").style.color = "white"
                            this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Play"])
                            this.shadowRoot.getElementById("svg").style.opacity = "0"
                            this.shadowRoot.getElementById("cache").style.opacity = "0"
                        }
                    }, { signal: this.controller.signal })
                    Utils.player.addEventListener("play", () => {
                        if (this.isMySong()) {
                            this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Pause"])
                        }
                    }, { signal: this.controller.signal })
                    Utils.player.addEventListener("pause", () => {
                        if (this.isMySong()) {
                            this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Play"])
                        }
                    }, { signal: this.controller.signal })
                    Utils.musicViewer.addEventListener("songchange", (e) => {
                        if (e.detail.objId.startsWith("so_") && song.id == e.detail.objId.replace("so_", "")) {
                            this.shadowRoot.getElementById("title").innerText = e.detail.aliasTitle ? e.detail.aliasTitle : song.title
                            this.shadowRoot.getElementById("artist").innerText = e.detail.aliasSongSingerName ? e.detail.aliasSongSingerName : (song.aliasSingerName ? song.aliasSingerName : song.singerName)
                            if (e.detail.isExplicit) {
                                this.shadowRoot.getElementById("svg_explicit").style.display = "block"
                            }
                            else {
                                this.shadowRoot.getElementById("svg_explicit").style.display = ""
                            }
                        }
                    }, { signal: this.controller.signal })
                    Utils.libManager.addEventListener("removesongfromplaylist", (e) => {
                        if (e.detail.objId == "so_" + song.id && this.object != null && e.detail.playlistId == this.object.id && this.parentElement) {
                            this.parentElement.removeChild(this)
                        }
                    }, { signal: this.controller.signal });
                    Utils.player.addEventListener("loadedmetadata", async () => {
                        if (this.isMySong() && await Utils.player.getState()) {
                            this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Pause"])
                        }
                    }, { signal: this.controller.signal })
                    new ThemeColor(this.shadowRoot.children[1])
                })
            }
            else {
                this.song = song;
                this.updateGrid(song)
            }
        }
        else {
            if (this.song != null) {
                this.shadowRoot.innerHTML = `<div></div>`
                this.song = song;
                this.controller.abort()
            }
        }
    }
}