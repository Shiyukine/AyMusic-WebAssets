import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import Song from "../../../class/music/song.js";
import LocalMusicHandler from "../../../class/utils/localMusicHandler.js";
import Utils from "../../../class/utils/utils.js";
import ContextMenu from "../contextMenu/contextMenu.js";
import * as id3 from "../../../plugins/id3/id3.js"
import InfoPanel from "../infoPanel/infoPanel.js";
import ThemeColor from "../../../class/themeColor.js";
import Album from "../../../class/music/album.js";
import Singer from "../../../class/music/singer.js";
import PlatformHandler from "../../../class/player/platformHandler.js";

export default class SongGrid extends HTMLDivElement {

    /**
     * @type {Song}
     */
    song = null;
    /**
     * @type {Playlist|Album|Singer}
     */
    object = null;

    /**
     * 
     * @param {Song} song 
     * @param {Playlist|Album|Singer} object
     */
    constructor(song, object = null) {
        super();
        this.object = object;
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/songGrid/songGrid" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                //new Translations(shadow.children[1])
                if (song !== null) this.changeSong(song)
                Utils.player.onSongChange(async () => {
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
                })
                Utils.player.onPlay(() => {
                    if (this.isMySong()) {
                        this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Pause"])
                    }
                })
                Utils.player.onPause(() => {
                    if (this.isMySong()) {
                        this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Play"])
                    }
                })
                Utils.libManager.onRemoveSongFromPlaylist((e) => {
                    if (e.detail.objId == "so_" + song.id && e.detail.playlistId == object.id && this.parentElement) {
                        this.parentElement.removeChild(this)
                    }
                });
                Utils.player.onLoadedMetadata(async () => {
                    if (this.isMySong() && await Utils.player.getState()) {
                        this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Pause"])
                    }
                })
                this.song = song
                new ThemeColor(shadow.children[1])
            }
        })
    }

    isMySong() {
        let b = this.object == null || (Utils.queueManager.currentObject != null && Utils.queueManager.currentObject.id == "pl_" + this.object.id && this.object.constructor == Playlist)
        b = b || this.object == null || (Utils.queueManager.currentObject != null && Utils.queueManager.currentObject.id == "al_" + this.object.id && this.object.constructor == Album)
        b = b || this.object == null || (Utils.queueManager.currentObject != null && Utils.queueManager.currentObject.id == "si_" + this.object.id && this.object.constructor == Singer)
        return Utils.queueManager.currentSong != null && Utils.queueManager.currentSong.id == this.song.id && b
    }

    /**
     * 
     * @param {Song} song 
     */
    async changeSong(song) {
        if (this.song === null) {
            this.song = song;
            this.shadowRoot.getElementById("title").innerText = this.song.title
            this.shadowRoot.getElementById("artist").innerText = this.song.singerName
            this.shadowRoot.getElementById("time").innerText = Utils.msToTime(this.song.time)
            let plat = song.imgUrl == "localImg" ? "icon" : await PlatformHandler.getPlatformBySongUrl(song.url)
            plat = plat.toLowerCase()
            this.shadowRoot.getElementById("platform").style.backgroundImage = "url('/resources/" + plat + ".ico')"
            if (this.song.imgUrl === "localImg") {
                if (this.song.canBeLoaded) {
                    var imge = this.shadowRoot.getElementById("img");
                    imge.style.backgroundImage = "url('app://cache/Image/" + this.song.id + ".png'), url('/resources/icon.ico')"
                }
                else {
                    this.shadowRoot.getElementById("img").style.backgroundImage = "url('/resources/icon.ico')"
                }
            }
            else {
                this.shadowRoot.getElementById("img").style.backgroundImage = "url('" + this.song.imgUrl + "')"
            }
            this.addEventListener("mouseover", function () {
                this.shadowRoot.getElementById("svg").style.opacity = "1"
                this.shadowRoot.getElementById("cache").style.opacity = "1"
            });
            this.addEventListener("mouseout", function () {
                if (!this.isMySong()) {
                    this.shadowRoot.getElementById("svg").style.opacity = "0"
                    this.shadowRoot.getElementById("cache").style.opacity = "0"
                }
            });
            let pl = this.object;
            let curThis = this;
            let elToClick = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? this : this.shadowRoot.getElementById("svg")
            elToClick.addEventListener("click", async function () {
                if ((Utils.app.platform != "Android" && Utils.app.platform != "iOS") || !this.shadowRoot.getElementById("context").matches(":hover")) {
                    if (curThis.isMySong()) {
                        if (await Utils.player.getState()) Utils.player.pause()
                        else Utils.player.play()
                    }
                    else {
                        if (pl != null) await Utils.queueManager.changeQueue(pl, curThis.song.id)
                        else await Utils.queueManager.changeQueue(curThis.song)
                    }
                }
            });
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
                this.shadowRoot.getElementById("artist").addEventListener("click", async function () {
                    if (song.imgUrl !== "localImg") {
                        Utils.musicViewer.changeView("si_" + song.singerID)
                    }
                });
            }
            var cm = new ContextMenu()
            this.shadowRoot.getElementById("context").onclick = async (e) => {
                cm.show(e)
            }
            this.addEventListener("pointerup", async (e) => {
                if (e.button == 2) {
                    cm.show(e)
                }
            });
            cm.beforeShow = async () => {
                cm.addElement("{wt.addQueue}", () => {
                    //Utils.newError("Can't do this", "This feature will be added soon :)")
                    Utils.queueManager.addToQueue(song)
                })
                cm.addElement("{lib.goArtist}", () => {
                    Utils.musicViewer.changeView("si_" + song.singerID)
                })
                cm.addElement("{lib.goAlbum}", () => {
                    Utils.musicViewer.changeView("al_" + song.albumID)
                })
                if (this.object != null && this.object.id != Utils.libManager.userInfo.likedSongsPlId && Utils.libManager.userPlaylists.includes(this.object)) {
                    let result = await Utils.apiManager.doPostRequest({
                        act: "getIdSongsInPlaylist",
                        playlistID: this.object.id,
                        orderByDesc: false
                    })
                    if (result.includes(song.id)) {
                        cm.addElement("{lib.removeFromPl}", () => {
                            Utils.libManager.removeSongFromAPlaylist(this.object.id, "so_" + song.id)
                            //this.parentElement.removeChild(this)
                        })
                    }
                }
                cm.addElement(Utils.libManager.isSongIsInLikedSongs(song) ? "{lib.removeLikedSong}" : "{lib.addLikedSong}", () => {
                    Utils.libManager.addOrRemoveSongLikedSongs(song)
                })
                var cm2 = new ContextMenu()
                cm2.beforeShow = () => {
                    for (let pl of Utils.libManager.userPlaylists) {
                        if (!pl.name.includes("{") && !pl.name.includes("}")) {
                            cm2.addElement(pl.name, () => {
                                Utils.libManager.addSongToAPlaylist(pl.id, "so_" + song.id)
                            })
                        }
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
    }
}