import GestureHandler from "../../../class/gestureHandler.js";
import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Playlist from "../../../class/music/playlist.js";
import Singer from "../../../class/music/singer.js";
import Song from "../../../class/music/song.js";
import OverscrollHandler from "../../../class/overscrollHandler.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import LocalMusicHandler from "../../../class/utils/localMusicHandler.js";
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

    scrolls = {};
    lastOffsets = {};

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.4s"
        Import.getData("/ui/windows/library/library" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then(async (html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
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
                this.translation = new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.changeView(this.selectedIndex, false)
                this.changeViewMyLib(0)
                this.style.opacity = "1"
                this.refreshUserPlaylists()
                if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                    shadow.getElementById("libBack").onclick = () => {
                        history.back()
                    }
                    shadow.getElementById("libBack2").onclick = () => {
                        history.back()
                    }
                }
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
                cm.beforeShow = () => {
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
                }
                shadow.getElementById("plContextMenu").onclick = (e) => {
                    cm.show(e)
                }
                shadow.querySelectorAll("*").forEach((x) => {
                    if (x.tagName == "INPUT" && x.max == "1") {
                        x.onmousedown = (e) => {
                            x.value = x.value == 0 ? 1 : 0
                            x.style.backgroundColor = x.value == "1" ? "" : "gray"
                        }
                        x.ontouchstart = (e) => {
                            x.value = x.value == 0 ? 1 : 0
                            x.style.backgroundColor = x.value == "1" ? "" : "gray"
                            e.preventDefault()
                            e.stopPropagation()
                        }
                    }
                })
                var gest = new GestureHandler(shadow.getElementById("mylib_list"))
                gest.addEventListener("right", () => {
                    if (this.selectedIndexMyLib + 1 < this.shadowRoot.getElementById("mylib_topbar").children.length) {
                        gest.acceptGesture()
                        this.changeViewMyLib(this.selectedIndexMyLib + 1)
                    }
                })
                gest.addEventListener("left", () => {
                    if (this.selectedIndexMyLib - 1 > -1) {
                        gest.acceptGesture()
                        this.changeViewMyLib(this.selectedIndexMyLib - 1)
                    }
                })
                //new OverscrollHandler(shadow.getElementById("mylib_list"))
                window.addEventListener("popstate", (e) => {
                    if (e.state.where == "library") this.changeView(e.state.index, false)
                    if (e.state.where == "menu" && e.state.menu == "Library") this.changeView(0, false)
                })
                this.addScrollEventForList("playlist_songs")
                this.addScrollEventForList("mylib_list")
                Utils.player.addEventListener("songchange", async () => {
                    let isPlay = this.selectedPl != null && Utils.queueManager.currentObject != null && "pl_" + this.selectedPl.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                    shadow.getElementById("plState").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                }, { signal: this.controller.signal })
                Utils.player.addEventListener("play", async () => {
                    let isPlay = this.selectedPl != null && Utils.queueManager.currentObject != null && "pl_" + this.selectedPl.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                    shadow.getElementById("plState").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                }, { signal: this.controller.signal })
                Utils.player.addEventListener("pause", async () => {
                    let isPlay = this.selectedPl != null && Utils.queueManager.currentObject != null && "pl_" + this.selectedPl.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                    shadow.getElementById("plState").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                }, { signal: this.controller.signal })
                shadow.getElementById("plState").onclick = async () => {
                    if (Utils.queueManager.currentObject != null && "pl_" + this.selectedPl.id == Utils.queueManager.currentObject.id) {
                        if (await Utils.player.getState()) Utils.player.pause()
                        else Utils.player.play()
                    }
                    else {
                        Utils.queueManager.changeQueue(this.selectedPl)
                    }
                }
            }
        })
    }

    anIndexMyLib = -1

    async changeView(newIndex, updateHistory = true) {
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
                            let isPlay = Utils.queueManager.currentObject != null && "pl_" + this.selectedPl.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                            this.shadowRoot.getElementById("plState").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                            this.shadowRoot.getElementById("playlist_name").innerText = pl.name
                            let songsList = this.shadowRoot.getElementById("playlist_songs")
                            songsList.scrollTo(0, 0)
                            Utils.apiManager.fetchAPI({
                                act: "getPlaylistSongs",
                                playlistID: pl.id,
                                orderByDesc: false,
                                offset: 0
                            }, (result) => {
                                while (songsList.firstChild) {
                                    songsList.removeChild(songsList.lastChild);
                                }
                                let songs = result["songs"]
                                for (let i in songs) {
                                    let obj = songs[i]
                                    let sng = new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.albumUrl, obj.singerUrl, obj.additionalSingers, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                                    songsList.appendChild(new SongGrid(sng, pl, !sng.canBeLoaded))
                                }
                                let total = parseInt(result["total"])
                                while (songsList.children.length < total) {
                                    songsList.appendChild(new SongGrid(null, pl))
                                }
                            })
                        }
                    }
                }
                if (updateHistory) window.history.pushState({ where: "library", index: newIndex }, "", "/index.html")
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
                    Utils.apiManager.fetchAPI({
                        act: "getPlaylistSongs",
                        playlistID: Utils.libManager.userInfo.likedSongsPlId,
                        orderByDesc: true,
                        offset: 0
                    }, (result) => {
                        objs.classList.remove("obj")
                        while (objs.firstChild) {
                            objs.removeChild(objs.lastChild);
                        }
                        let songs = result["songs"]
                        let counterSongNotLoaded = 0
                        for (let i in songs) {
                            let obj = songs[i]
                            let sng = new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.albumUrl, obj.singerUrl, obj.additionalSingers, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                            let grid = new SongGrid(sng, Utils.libManager.userLikedPl, !sng.canBeLoaded)
                            objs.appendChild(grid)
                        }
                        let total = parseInt(result["total"])
                        while (objs.children.length < total) {
                            objs.appendChild(new SongGrid(null, Utils.libManager.userLikedPl))
                        }
                    })
                }
                else {
                    Utils.apiManager.fetchAPI({
                        act: "getObjectsInPlaylist",
                        playlistID: Utils.libManager.userInfo.likedSongsPlId,
                        orderByDesc: true,
                        offset: 0,
                        size: -1
                    }, (result) => {
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
                        else if (newIndex == 3) {
                            let list = []
                            for (let i in result) {
                                let obj = result[i]
                                if (obj.id.includes("si_")) {
                                    let id = obj.id.replace("si_", "")
                                    list.push(new Singer(id, obj.name, obj.imgUrl, obj.dateAdded, obj.aliasName))
                                }
                            }
                            /*for (let i of LocalMusicHandler.getArtists()) {
                                list.push(i)
                            }*/
                            list.sort((a, b) => {
                                if (a.name > b.name)
                                    return 1;
                                if (a.name < b.name)
                                    return -1;
                                return 0;
                            });
                            for (let i of list) {
                                objs.appendChild(new SingerGrid(i))
                            }
                        }
                        else if (newIndex == 2) {
                            let list = []
                            for (let i in result) {
                                let obj = result[i]
                                if (obj.id.includes("al_")) {
                                    let id = obj.id.replace("al_", "")
                                    list.push(new Album(id, obj.name, obj.singerID, obj.type, obj.imgUrl, obj.dateAdded))
                                }
                            }
                            /*for (let i of LocalMusicHandler.getAlbums()) {
                                list.push(i)
                            }*/
                            list.sort((a, b) => {
                                if (a.name > b.name)
                                    return 1;
                                if (a.name < b.name)
                                    return -1;
                                return 0;
                            });
                            for (let i of list) {
                                objs.appendChild(new AlbumGrid(i))
                            }
                        }
                    })
                }
            }
            this.selectedIndexMyLib = newIndex
        } catch { }
    }

    close() {
        this.isClosed = true
        /*this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""*/
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

    addScrollEventForList(listId) {
        this.lastOffsets[listId] = { last: 0, toRemove: -1 }
        this.shadowRoot.getElementById(listId).addEventListener("scroll", async (e) => {
            let isScrollDown = this.scrolls[listId] < this.shadowRoot.getElementById(listId).scrollTop
            let slice = 50 * 70
            let offset = parseInt((this.shadowRoot.getElementById(listId).scrollTop + (isScrollDown ? 15 : -15) * 70) / slice)
            let realOffsetToRemove = (this.shadowRoot.getElementById(listId).scrollTop + (isScrollDown ? -105 : 115) * 70) / slice
            let offsetToRemove = parseInt(realOffsetToRemove)
            if (realOffsetToRemove >= 0) isScrollDown ? offsetToRemove++ : offsetToRemove--
            if (this.lastOffsets[listId].toRemove != offsetToRemove) {
                this.lastOffsets[listId].toRemove = offsetToRemove
                let elToHide = this.shadowRoot.getElementById(listId).children[(offsetToRemove) * 50]
                if (elToHide) {
                    elToHide.changeRequested = false
                    for (let i = 0; i < 50; i++) {
                        /**
                         * @type {SongGrid}
                         */
                        let el = this.shadowRoot.getElementById(listId).children[(offsetToRemove) * 50 + i]
                        if (el) {
                            el.changeSong(null, true)
                        }
                    }
                }
            }
            if (this.lastOffsets[listId].last != offset) {
                this.lastOffsets[listId].last = offset
                /**
                 * @type {SongGrid}
                 */
                let el = this.shadowRoot.getElementById(listId).children[offset * 50]
                if (el && el.song === null && !el.changeRequested) {
                    el.changeRequested = true
                    Utils.apiManager.fetchAPI({
                        act: "getPlaylistSongs",
                        playlistID: this.selectedPl && this.selectedIndex != 0 ? this.selectedPl.id : Utils.libManager.userInfo.likedSongsPlId,
                        orderByDesc: !(this.selectedPl && this.selectedIndex != 0),
                        offset: offset
                    }, (result) => {
                        let i = 0;
                        for (let obj of result["songs"]) {
                            /**
                             * @type {SongGrid}
                             */
                            let grid = this.shadowRoot.getElementById(listId).children[offset * 50 + i]
                            let song = new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.albumUrl, obj.singerUrl, obj.additionalSingers, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                            grid.changeSong(song, !song.canBeLoaded)
                            i++;
                        }
                    })
                }
            }
            this.scrolls[listId] = this.shadowRoot.getElementById(listId).scrollTop
        })
    }

    disconnectedCallback() {
        this.translation.end()
        this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
    }
}