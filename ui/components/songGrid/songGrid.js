import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import Song from "../../../class/music/song.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import ContextMenu from "../contextMenu/contextMenu.js";

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
            this.shadowRoot.getElementById("img").style.backgroundImage = "url('" + this.song.imgUrl + "')"
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
                            Utils.libManager.removeSongFromAPlaylist(this.playlist.id, "so_" + song.id)
                            this.parentElement.removeChild(this)
                        })
                    }
                }
                cm.addElement(Utils.libManager.userLikedSongs.includes(this.song.id) ? "{lib.removeLikedSong}" : "{lib.addLikedSong}", () => {
                    if (Utils.libManager.userLikedSongs.includes(this.song.id)) {
                        Utils.libManager.removeObjFromLikedSongs("so_" + song.id)
                        if (this.playlist.id == Utils.libManager.userInfo.likedSongsPlId)
                            this.parentElement.removeChild(this)
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
                                Utils.libManager.addSongToAPlaylist(pl.id, "so_" + song.id)
                            })
                        }
                    }
                }
                cm.addSubContextMenu("{lib.addToPl}", cm2)
            }
        }
    }
}