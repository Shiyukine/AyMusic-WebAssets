import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import Song from "../../../class/music/song.js";
import LocalMusicHandler from "../../../class/utils/localMusicHandler.js";
import Utils from "../../../class/utils/utils.js";
import ContextMenu from "../contextMenu/contextMenu.js";
import * as id3 from "../../../plugins/id3/id3.js"
import InfoPanel from "../infoPanel/infoPanel.js";

export default class SongGrid extends HTMLDivElement {

    /**
     * @type {Song}
     */
    song = null;
    /**
     * @type {Playlist}
     */
    playlist = null;

    /**
     * 
     * @param {Song} song 
     * @param {Playlist} playlist
     */
    constructor(song, playlist = null) {
        super();
        this.playlist = playlist;
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/songGrid/songGrid.html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                //new Translations(shadow.children[1])
                if (song !== null) this.changeSong(song)
                Utils.player.onSongChange(() => {
                    if (this.isMySong()) {
                        this.shadowRoot.getElementById("title").style.color = "#00ccff"
                        if (Utils.player.getState()) this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Pause"])
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
                    if (e.detail.objId == "so_" + song.id && e.detail.playlistId == playlist.id && this.parentElement) {
                        this.parentElement.removeChild(this)
                    }
                });
                this.song = song
            }
        })
    }

    isMySong() {
        return Utils.queueManager.currentSong != null && Utils.queueManager.currentSong.id == this.song.id &&
            (this.playlist == null || (Utils.queueManager.currentObject != null && Utils.queueManager.currentObject.id == "pl_" + this.playlist.id.replace("pl_", "")))
    }

    changeSong(song) {
        if (this.song === null) {
            this.song = song;
            this.shadowRoot.getElementById("title").innerText = this.song.title
            this.shadowRoot.getElementById("artist").innerText = this.song.singerName
            this.shadowRoot.getElementById("time").innerText = Utils.msToTime(this.song.time)
            if (this.song.imgUrl === "localImg") {
                if (this.song.canBeLoaded) {
                    var request = new XMLHttpRequest();
                    var imge = this.shadowRoot.getElementById("img");
                    request.open('GET', this.song.url, true);
                    request.responseType = 'blob';
                    request.onload = function () {
                        var reader = new FileReader();
                        reader.readAsArrayBuffer(request.response);
                        reader.onload = function (e) {
                            id3.fromFile(new File([e.target.result], song.url.split("\\")[song.url.split("\\") - 1])).then((tags) => {
                                if (tags != null && tags.images != null) {
                                    var blob = new Blob([tags.images[0].data])
                                    var uu = URL.createObjectURL(blob)
                                    imge.style.backgroundImage = "url('" + uu + "')"
                                    setTimeout(() => {
                                        URL.revokeObjectURL(uu)
                                    }, 10000)
                                }
                                else {
                                    imge.style.backgroundImage = "url('/resources/icon.ico')"
                                }
                            });
                        };
                    };
                    request.send();
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
            let pl = this.playlist;
            let curThis = this;
            this.shadowRoot.getElementById("svg").addEventListener("click", async function () {
                if (curThis.isMySong()) {
                    if (Utils.player.getState()) Utils.player.pause()
                    else Utils.player.play()
                }
                else {
                    if (pl != null) await Utils.queueManager.changeQueue(pl, curThis.song.id)
                    else await Utils.queueManager.changeQueue(curThis.song)
                }
            });
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
                    Utils.newError("Can't do this", "This feature will be added soon :)")
                })
                cm.addElement("{lib.goAlbum}", () => {
                    Utils.newError("Can't do this", "This feature will be added soon :)")
                })
                if (this.playlist != null && this.playlist.id != Utils.libManager.userInfo.likedSongsPlId && Utils.libManager.userPlaylists.includes(this.playlist)) {
                    let result = await Utils.apiManager.doPostRequest({
                        act: "getIdSongsInPlaylist",
                        playlistID: this.playlist.id,
                        orderByDesc: false
                    })
                    if (result.includes(song.id)) {
                        cm.addElement("{lib.removeFromPl}", () => {
                            Utils.libManager.removeSongFromAPlaylist(this.playlist.id, "so_" + song.id)
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
                if (Utils.player.getState()) this.shadowRoot.getElementById("svg").children[0].setAttribute("d", Utils.pathsData["Pause"])
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