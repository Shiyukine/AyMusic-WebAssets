import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Playlist from "../../../class/music/playlist.js";
import Singer from "../../../class/music/singer.js";
import Song from "../../../class/music/song.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import AlbumGrid from "../../components/albumGrid/albumGrid.js";
import ContextMenu from "../../components/contextMenu/contextMenu.js";
import InfoPanel from "../../components/infoPanel/infoPanel.js";
import PlaylistGrid from "../../components/playlistGrid/playlistGrid.js";
import SingerGrid from "../../components/singerGrid/singerGrid.js";
import SongGrid from "../../components/songGrid/songGrid.js";
import TextBox from "../../components/textBox/textBox.js";

export default class LibraryWindow extends HTMLDivElement {
    selectedIndex = 0;
    selectedIndexMyLib = -1;
    isClosed = false;
    modifyingPl = false;

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
            this.changeView(this.selectedIndex)
            this.changeViewMyLib(0)
            this.style.opacity = "1"
            this.refreshUserPlaylists()
            shadow.getElementById("addPl").onclick = async () => {
                this.changeView(1)
            }
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
                    if (!name.getText().includes("{") && !name.getText().includes("}")) {
                        if (!this.modifyingPl) {
                            await Utils.libManager.addPlaylist(name.getText(), desc.getText(), imgUrl.getText(), isPriv.value === "1")
                        }
                        else {
                            await Utils.libManager.updatePlaylist(this.selectedPl.id, name.getText(), desc.getText(), imgUrl.getText(), isPriv.value === "1", 0)
                        }
                        this.refreshUserPlaylists()
                        this.changeView(this.shadowRoot.getElementById("menu").children.length - 1)
                    }
                    else {
                        Utils.newError("Can't create a playlist", "Please don't put \"{\" or \"}\" in the name of this playlist.")
                    }
                }
                else {
                    Utils.newError("Can't create a playlist", "Please put a name to this playlist !")
                }
            }
            var cm = new ContextMenu()
            shadow.getElementById("plContextMenu").onclick = (e) => {
                cm.addElement("{wt.addQueue}", () => {
                    Utils.newError("Not implemented", "Feature will be here soon !")
                })
                cm.addElement("{plInfo.edit}", () => {
                    this.changeView(1)
                    this.prepareCreateModifPanel(true)
                })
                cm.addElement("{plInfo.remove}", async () => {
                    var confirm = new InfoPanel("Delete this playlist ?",
                        "Are you sure to delete this playlist ?\nYou will not be able to retrieve this playlist !",
                        [{
                            text: "Yes", isPositive: true, onclick: async () => {
                                await Utils.libManager.removePlaylist(this.selectedPl.id)
                                confirm.close()
                                this.changeView(0)
                                this.refreshUserPlaylists()
                            }
                        }, {
                            text: "No", isPositive: false, onclick: () => {
                                confirm.close()
                            }
                        }], false)
                    document.getElementById("main").appendChild(confirm)
                    await confirm.showDialog()
                })
                cm.show(e)
                cm.resetElements()
            }
            cm.hidden = () => {
                cm.resetElements()
            }
            shadow.querySelectorAll("*").forEach((x) => {
                if (x.tagName == "INPUT" && x.max == "1") {
                    x.oninput = () => {
                        x.style.backgroundColor = x.value == "1" ? "" : "gray"
                    }
                }
            })
        })
    }

    anIndexMyLib = -1

    async changeView(newIndex) {
        try {
            if (newIndex !== this.selectedIndex) {
                this.shadowRoot.getElementById("menu").children[this.selectedIndex].classList.remove("selected")
                this.shadowRoot.getElementById("view").children[this.selectedIndex > 2 ? 2 : this.selectedIndex].classList.remove("selected")
                this.shadowRoot.getElementById("menu").children[newIndex].classList.add("selected")
                this.shadowRoot.getElementById("view").children[newIndex > 2 ? 2 : newIndex].classList.add("selected")
                if (newIndex === 0) {
                    this.changeViewMyLib(this.anIndexMyLib)
                }
                else {
                    if (this.selectedIndexMyLib > -1)
                        this.anIndexMyLib = this.selectedIndexMyLib
                    this.changeViewMyLib(-1)
                }
                if (newIndex === 1) {
                    this.prepareCreateModifPanel(false)
                }
                if (this.shadowRoot.getElementById("menu").children[newIndex].dataset["plid"] !== undefined) {
                    while (this.shadowRoot.getElementById("mylib_list").firstChild) {
                        this.shadowRoot.getElementById("mylib_list").removeChild(this.shadowRoot.getElementById("mylib_list").lastChild)
                    }
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
                                songsList.appendChild(new SongGrid(new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName), pl))
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
                if (this.selectedIndexMyLib > -1)
                    this.shadowRoot.getElementById("mylib_topbar").children[this.selectedIndexMyLib].classList.remove("selected")
                if (newIndex > -1)
                    this.shadowRoot.getElementById("mylib_topbar").children[newIndex].classList.add("selected")
                let objs = this.shadowRoot.getElementById("mylib_list")
                if (newIndex == 0) {
                    let result = await Utils.apiManager.doPostRequest({
                        act: "getPlaylistSongs",
                        playlistID: Utils.libManager.userInfo.likedSongsPlId,
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
                        objs.appendChild(new SongGrid(new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName), Utils.libManager.userLikedPl))
                    }
                }
                else {
                    let result = await Utils.apiManager.doPostRequest({
                        act: "getObjectsInPlaylist",
                        playlistID: Utils.libManager.userInfo.likedSongsPlId,
                        orderByDesc: true,
                        offset: 0,
                        size: 50
                    })
                    objs.classList.add("obj")
                    while (objs.firstChild) {
                        objs.removeChild(objs.lastChild);
                    }
                    if (newIndex == 1) {
                        for (let i in Utils.libManager.userPlaylists) {
                            let pl = Utils.libManager.userPlaylists[i]
                            if (!pl.name.includes("}") && !pl.name.includes("{"))
                                objs.appendChild(new PlaylistGrid(pl))
                        }
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
            this.selectedIndexMyLib = newIndex
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

    prepareCreateModifPanel(isForModification) {
        if (isForModification) {
            this.shadowRoot.getElementById("pl_modifcreate").innerText = "{lib.modifyPlaylist}"
            this.shadowRoot.getElementById("pl_name").setText(this.selectedPl.name)
            this.shadowRoot.getElementById("pl_desc").setText(this.selectedPl.desc)
            this.shadowRoot.getElementById("pl_imgUrl").setText(this.selectedPl.imgUrl != "/resources/icon.ico" ? this.selectedPl.imgUrl : "")
            this.shadowRoot.getElementById("pl_isPriv").value = this.selectedPl.isPrivate ? "1" : "0"
            this.shadowRoot.getElementById("pl_isPriv").style.backgroundColor = this.shadowRoot.getElementById("pl_isPriv").value == "1" ? "" : "gray"
            this.shadowRoot.getElementById("pl_create").innerText = "{lib.modifyBtn}"
        }
        else {
            this.shadowRoot.getElementById("pl_modifcreate").innerText = "{lib.addPlaylist}"
            this.shadowRoot.getElementById("pl_name").setText("")
            this.shadowRoot.getElementById("pl_desc").setText("")
            this.shadowRoot.getElementById("pl_imgUrl").setText("")
            this.shadowRoot.getElementById("pl_isPriv").value = "1"
            this.shadowRoot.getElementById("pl_create").innerText = "{lib.createBtn}"
            this.shadowRoot.getElementById("pl_isPriv").style.backgroundColor = this.shadowRoot.getElementById("pl_isPriv").value == "1" ? "" : "gray"
        }
        this.modifyingPl = isForModification
    }
}