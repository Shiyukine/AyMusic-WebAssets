import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Playlist from "../../../class/music/playlist.js";
import Singer from "../../../class/music/singer.js";
import Song from "../../../class/music/song.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import AlbumGrid from "../../components/albumGrid/albumGrid.js";
import PlaylistGrid from "../../components/playlistGrid/playlistGrid.js";
import SingerGrid from "../../components/singerGrid/singerGrid.js";
import SongGrid from "../../components/songGrid/songGrid.js";
import TextBox from "../../components/textBox/textBox.js";

export default class LibraryWindow extends HTMLDivElement {
    selectedIndex = 0;
    selectedIndexMyLib = -1;
    plLikedID = "";
    isClosed = false;

    /**
     * @type {Playlist}
     */
    selectedPl = null;

    controller = new AbortController();

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/library/library.html").then(async (html) => {
            shadow.innerHTML = html
            /*shadow.getElementById("menu").addEventListener("wheel", (ev) => {
                let newIndex;
                if (ev.deltaY > 0) newIndex = this.selectedIndex + 1
                else newIndex = this.selectedIndex - 1
                if (newIndex > shadow.getElementById("menu").children.length - 1) newIndex -= 1
                if (newIndex < 0) newIndex += 1
                this.changeView(newIndex)
            }, { passive: true });*/
            Array.from(shadow.getElementById("mylib_topbar").children).forEach((x, y) => {
                x.onclick = () => {
                    this.changeViewMyLib(y)
                }
            })
            new Translations(shadow.children[1])
            Utils.libManager.userPlaylists.forEach(pl => {
                if (pl.name === "{pl.liked}" && pl.desc === "{pl.liked.desc}") {
                    this.plLikedID = pl.id
                }
            });
            this.changeView(this.selectedIndex)
            this.changeViewMyLib(0)
            this.style.opacity = "1"
            this.refreshUserPlaylists()
            shadow.getElementById("pl_create").onclick = async () => {
                /**
                 * @type {TextBox}
                 */
                let name = shadow.getElementById("pl_name")
                /**
                 * @type {TextBox}
                 */
                let desc = shadow.getElementById("pl_desc")
                /**
                 * @type {TextBox}
                 */
                let imgUrl = shadow.getElementById("pl_imgUrl")
                /**
                 * @type {HTMLInputElement}
                 */
                let isPriv = shadow.getElementById("pl_isPriv")
                if (name.getText() != "") {
                    await Utils.libManager.addPlaylist(name.getText(), desc.getText(), imgUrl.getText(), isPriv.value === 1)
                    this.refreshUserPlaylists()
                    this.changeView(this.shadowRoot.getElementById("menu").children.length - 1)
                }
                else {
                    Utils.newError("Can't create a playlist", "Please put a name to this new playlist !")
                }
            }
        })
    }

    async changeView(newIndex) {
        try {
            if (newIndex !== this.selectedIndex) {
                this.shadowRoot.getElementById("menu").children[this.selectedIndex].classList.remove("selected")
                this.shadowRoot.getElementById("view").children[this.selectedIndex > 2 ? 2 : this.selectedIndex].classList.remove("selected")
                this.shadowRoot.getElementById("menu").children[newIndex].classList.add("selected")
                this.shadowRoot.getElementById("view").children[newIndex > 2 ? 2 : newIndex].classList.add("selected")
                if (this.shadowRoot.getElementById("menu").children[newIndex].dataset["plid"] !== undefined) {
                    for (let i in Utils.libManager.userPlaylists) {
                        let pl = Utils.libManager.userPlaylists[i]
                        if (pl.id == this.shadowRoot.getElementById("menu").children[newIndex].dataset["plid"]) {
                            this.selectedPl = pl
                            this.shadowRoot.getElementById("playlist_name").innerText = pl.name
                            let songsList = this.shadowRoot.getElementById("playlist_songs")
                            let result = await Utils.apiManager.doPostRequest({
                                act: "getPlaylistSongs",
                                playlistID: pl.id,
                                orderByDesc: false,
                                offset: 0
                            })
                            while (songsList.firstChild) {
                                songsList.removeChild(songsList.lastChild);
                            }
                            let songs = result["songs"]
                            for (let i in songs) {
                                let obj = songs[i]
                                songsList.appendChild(new SongGrid(new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName)))
                            }
                        }
                    }
                }
                this.selectedIndex = newIndex
            }
        } catch { }
    }

    async changeViewMyLib(newIndex) {
        try {
            if (newIndex !== this.selectedIndexMyLib) {
                if (this.selectedIndexMyLib != -1)
                    this.shadowRoot.getElementById("mylib_topbar").children[this.selectedIndexMyLib].classList.remove("selected")
                this.shadowRoot.getElementById("mylib_topbar").children[newIndex].classList.add("selected")
                this.selectedIndexMyLib = newIndex
                let objs = this.shadowRoot.getElementById("mylib_list")
                if (newIndex == 0) {
                    let result = await Utils.apiManager.doPostRequest({
                        act: "getPlaylistSongs",
                        playlistID: this.plLikedID,
                        orderByDesc: true,
                        offset: 0
                    })
                    objs.classList.remove("obj")
                    while (objs.firstChild) {
                        objs.removeChild(objs.lastChild);
                    }
                    let songs = result["songs"]
                    for (let i in songs) {
                        let obj = songs[i]
                        objs.appendChild(new SongGrid(new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName)))
                    }
                }
                else {
                    let result = await Utils.apiManager.doPostRequest({
                        act: "getObjectsInPlaylist",
                        playlistID: this.plLikedID,
                        orderByDesc: true,
                        offset: 0,
                        size: 50
                    })
                    objs.classList.add("obj")
                    while (objs.firstChild) {
                        objs.removeChild(objs.lastChild);
                    }
                    if (newIndex == 1) {
                        for (let i in result) {
                            let obj = result[i]
                            if (obj.id.includes("pl_")) {
                                let id = obj.id.replace("pl_", "")
                                objs.appendChild(new PlaylistGrid(new Playlist(id, obj.name, obj.userID, obj.desc, obj.imgUrl, obj.isPrivate, obj.rank, obj.dateAdded)))
                            }
                        }
                    }
                    else if (newIndex == 2) {
                        for (let i in result) {
                            let obj = result[i]
                            if (obj.id.includes("si_")) {
                                let id = obj.id.replace("si_", "")
                                objs.appendChild(new SingerGrid(new Singer(id, obj.name, obj.imgUrl, obj.dateAdded)))
                            }
                        }
                    }
                    else if (newIndex == 3) {
                        for (let i in result) {
                            let obj = result[i]
                            if (obj.id.includes("al_")) {
                                let id = obj.id.replace("al_", "")
                                objs.appendChild(new AlbumGrid(new Album(id, obj.name, obj.singerID, obj.type, obj.imgUrl, obj.dateAdded)))
                            }
                        }
                    }
                }
            }
        } catch { }
    }

    close() {
        this.isClosed = true
        this.controller.abort()
        while (this.firstChild) {
            this.removeChild(this.lastChild);
        }
    }

    refreshUserPlaylists() {
        while (this.shadowRoot.getElementById("menu").lastChild.dataset &&
            this.shadowRoot.getElementById("menu").lastChild.dataset["plid"]) {
            var el = this.shadowRoot.getElementById("menu").lastChild
            this.shadowRoot.getElementById("menu").removeChild(el);
        }
        let pls = Utils.libManager.userPlaylists
        for (let i in pls) {
            let pl = pls[i]
            if (!pl.name.includes("{") && !pl.name.includes("}")) {
                let paragraph = document.createElement("p")
                paragraph.innerText = pl.name
                paragraph.setAttribute("data-plid", pl.id)
                this.shadowRoot.getElementById("menu").appendChild(paragraph)
            }
        }
        Array.from(this.shadowRoot.getElementById("menu").children).forEach((x, y) => {
            x.onclick = () => {
                this.changeView(y)
            }
        })
    }
}