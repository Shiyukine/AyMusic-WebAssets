import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import Song from "../../../class/music/song.js";
import Translations from "../../../class/translations.js";
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
            //new Translations(shadow.children[1])
            if (song !== null) this.changeSong(song)
            this.song = song
        })
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
                this.shadowRoot.getElementById("svg").style.opacity = "0"
                this.shadowRoot.getElementById("cache").style.opacity = "0"
            });
            this.shadowRoot.getElementById("svg").addEventListener("click", function () {
                console.log("clicked")
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
                    Utils.newError("Can't do this", "This feature will be added soon :)")
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
                            if (LocalMusicHandler.isMusicInLocalLibrary(this.song)) {
                                LocalMusicHandler.removeMusicInPlaylist(this.playlist.id, "so_" + song.id)
                            }
                            else {
                                Utils.libManager.removeSongFromAPlaylist(this.playlist.id, "so_" + song.id)
                            }
                            this.parentElement.removeChild(this)
                        })
                    }
                }
                cm.addElement(Utils.libManager.userLikedSongs.includes(this.song.id) && LocalMusicHandler.isMusicInLocalLibrary(this.song.id) ? "{lib.removeLikedSong}" : "{lib.addLikedSong}", () => {
                    if (Utils.libManager.userLikedSongs.includes(this.song.id)) {
                        Utils.libManager.removeObjFromLikedSongs("so_" + song.id)
                        if (this.playlist.id == Utils.libManager.userInfo.likedSongsPlId)
                            this.parentElement.removeChild(this)
                    }
                    else if (LocalMusicHandler.isMusicInLocalLibrary(this.song)) {
                        var ip = new InfoPanel("Confirmation", "Do you want to remove this song ?", [{
                            text: "Yes", isPositive: true, onclick: () => {
                                LocalMusicHandler.removeMusic(this.song.id)
                                ip.close()
                                if (this.playlist.id == Utils.libManager.userInfo.likedSongsPlId)
                                    this.parentElement.removeChild(this)
                            }
                        }, {
                            text: "No", isPositive: false, onclick: () => {
                                ip.close()
                            }
                        }])
                        document.getElementById("main").appendChild(ip)
                        ip.show()
                    }
                    else {
                        Utils.libManager.addObjToLikedSongs("so_" + song.id)
                    }
                })
                var cm2 = new ContextMenu()
                cm2.beforeShow = () => {
                    for (let pl of Utils.libManager.userPlaylists) {
                        if (!pl.name.includes("{") && !pl.name.includes("}")) {
                            cm2.addElement(pl.name, () => {
                                if (LocalMusicHandler.isMusicInLocalLibrary(this.song)) {
                                    LocalMusicHandler.addMusicToPlaylist(pl.id, "so_" + song.id)
                                }
                                else Utils.libManager.addSongToAPlaylist(pl.id, "so_" + song.id)
                            })
                        }
                    }
                }
                cm.addSubContextMenu("{lib.addToPl}", cm2)
            }
        }
    }
}