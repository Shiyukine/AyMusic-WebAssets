import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Playlist from "../../../class/music/playlist.js";
import Singer from "../../../class/music/singer.js";
import Song from "../../../class/music/song.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import AlbumGrid from "../../components/albumGrid/albumGrid.js";
import SongGrid from "../../components/songGrid/songGrid.js";
import TextBox from "../../components/textBox/textBox.js";

export default class MusicViewerWindow extends HTMLDivElement {
    selectedIndex = 0;
    isClosed = false;
    loaded = false;
    controller = new AbortController();
    fullObjId = "";
    /**
     * @type {Album|Singer|Playlist|Song}
     */
    object = null;
    crops = {
        start: 0,
        end: -1
    }

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.ontransitionend = () => { };
        this.style.opacity = "0%"
        this.style.width = "100%"
        this.style.position = "relative"
        this.style.zIndex = "1"
        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
            this.style.marginTop = "0px"
            this.style.height = "calc(100% - 138px)"
        }
        else {
            this.style.marginTop = "0px"
            this.style.height = "calc(100% - 125px)"
        }
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/musicViewer/musicViewer" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            new Translations(shadow.children[1])
            new ThemeColor(shadow.children[1])
            window.addEventListener("popstate", (e) => {
                if (e.state.where == "musicViewer") {
                    if (e.state.panel == "main") {
                        this.changeView(e.state.objId, false)
                        shadow.getElementById("edit").style.display = "none"
                    }
                    if (e.state.panel == "edit") {
                        shadow.getElementById("edit").style.display = ""
                    }
                }
                else {
                    this.close()
                }
            }, { signal: this.controller.signal })
            Utils.libManager.onAddSongToLikedSongs((e) => {
                if (this.fullObjId != "" && e.detail.objId == this.fullObjId) {
                    shadow.getElementById("like").children[0].setAttribute("d", Utils.libManager.isObjectIDIsInLikedSongs(this.fullObjId) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
                }
            });
            Utils.libManager.onRemoveSongFromLikedSongs((e) => {
                if (this.fullObjId != "" && e.detail.objId == this.fullObjId) {
                    shadow.getElementById("like").children[0].setAttribute("d", Utils.libManager.isSongIsInLikedSongs(this.fullObjId) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
                }
            });
            shadow.getElementById("like").onclick = () => {
                Utils.libManager.addOrRemoveObjectIDLikedSongs(this.fullObjId)
            }
            shadow.getElementById("edit_btn").onclick = () => {
                shadow.getElementById("edit").style.display = ""
                window.history.pushState({ where: "musicViewer", panel: "edit" }, "", "/index.html")
            }
            shadow.getElementById("edit_curT1").onclick = async () => {
                if (this.object.id == Utils.queueManager.currentSong.id) {
                    this.crops.start = await Utils.player.getCurrentTime()
                    shadow.getElementById("edit_cropS").innerText = Utils.msToTime(this.crops.start)
                }
                else
                    Utils.showMiniError("mv_errcur", "Please play this song to do that.")
            }
            shadow.getElementById("edit_curT2").onclick = async () => {
                if (this.object.id == Utils.queueManager.currentSong.id) {
                    this.crops.end = await Utils.player.getCurrentTime()
                    shadow.getElementById("edit_cropE").innerText = Utils.msToTime(this.crops.end)
                }
                else
                    Utils.showMiniError("mv_errcur", "Please play this song to do that.")
            }
            shadow.getElementById("edit_resetT1").onclick = async () => {
                if (this.object.id == Utils.queueManager.currentSong.id) {
                    this.crops.start = 0
                    shadow.getElementById("edit_cropS").innerText = Utils.msToTime(this.crops.start)
                }
                else
                    Utils.showMiniError("mv_errcur", "Please play this song to do that.")
            }
            shadow.getElementById("edit_resetT2").onclick = async () => {
                if (this.object.id == Utils.queueManager.currentSong.id) {
                    this.crops.end = -1
                    shadow.getElementById("edit_cropE").innerText = this.crops.end != -1 ? Utils.msToTime(this.crops.end) : "{mv.endOfSong}"
                }
                else
                    Utils.showMiniError("mv_errcur", "Please play this song to do that.")
            }
            shadow.getElementById("edit_cancel").onclick = () => {
                history.back()
            }
            shadow.getElementById("edit_save").onclick = async () => {
                if (this.object instanceof Song) {
                    await Utils.apiManager.doPostRequest({
                        act: "updateSong",
                        id: this.fullObjId,
                        isExplicit: shadow.getElementById("edit_explicit").value,
                        aliasTitle: shadow.getElementById("edit_title").getText(),
                        aliasSongSingerName: shadow.getElementById("edit_artist").getText(),
                        cropStart: this.crops.start,
                        cropEnd: this.crops.end
                    })
                    history.back()
                }
                else if (this.object instanceof Singer) {
                    await Utils.apiManager.doPostRequest({
                        act: "updateSinger",
                        id: this.fullObjId.split("si_").join(""),
                        aliasName: shadow.getElementById("edit_artist").getText()
                    })
                }
                else {
                    Utils.showMiniError("mv_err", "Failed to change info", true)
                }
                shadow.getElementById("edit").style.display = "none"
                Utils.showMiniError("mv_success", "Success! Please change the current song to refresh.", true, "rgb(0, 204, 255)", "#000")
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
            Utils.player.onSongChange(async () => {
                let isPlay = this.fullObjId != "" && Utils.queueManager.currentObject != null && this.fullObjId == Utils.queueManager.currentObject.id && await Utils.player.getState()
                shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
            })
            Utils.player.onPlay(async () => {
                let isPlay = this.fullObjId != "" && Utils.queueManager.currentObject != null && this.fullObjId == Utils.queueManager.currentObject.id && await Utils.player.getState()
                shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
            })
            Utils.player.onPause(async () => {
                let isPlay = this.fullObjId != "" && Utils.queueManager.currentObject != null && this.fullObjId == Utils.queueManager.currentObject.id && await Utils.player.getState()
                shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
            })
            shadow.getElementById("changeState").onclick = async () => {
                if (Utils.queueManager.currentObject != null && this.fullObjId == Utils.queueManager.currentObject.id) {
                    if (await Utils.player.getState()) Utils.player.pause()
                    else Utils.player.play()
                }
                else {
                    if (this.object != null)
                        Utils.queueManager.changeQueue(this.object)
                }
            }
            if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                shadow.getElementById("back").onclick = () => {
                    history.back()
                }
            }
        })
    }

    addList(title, isSong = true) {
        let h1 = document.createElement("h3")
        h1.innerText = title
        h1.classList.add("sublistTitle")
        this.shadowRoot.getElementById("list").appendChild(h1)
        let div = document.createElement("div")
        div.classList.add("sublist")
        this.shadowRoot.getElementById("list").appendChild(div)
        if (isSong) this.addScrollEventForList(div)
        return div
    }

    /**
     * 
     * @param {String} objectID 
     */
    async changeView(objectID, updateHistory = true) {
        if (!this.parentElement) document.getElementById("main").appendChild(this)
        //wait
        this.clientWidth
        //
        this.style.opacity = "1"
        if (this.fullObjId != objectID) {
            this.fullObjId = objectID
            this.object = null
            this.shadowRoot.getElementById("edit").style.display = "none"
            this.shadowRoot.getElementById("edit_btn").style.display = "none"
            for (let el of this.shadowRoot.getElementById("editor").children) {
                el.style.display = ""
            }
            while (this.shadowRoot.getElementById("list").firstChild) {
                this.shadowRoot.getElementById("list").removeChild(this.shadowRoot.getElementById("list").lastChild);
            }
            this.shadowRoot.getElementById("like").children[0].setAttribute("d", Utils.libManager.isObjectIDIsInLikedSongs(this.fullObjId) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
            let isPlay = this.fullObjId != "" && Utils.queueManager.currentObject != null && this.fullObjId == Utils.queueManager.currentObject.id && await Utils.player.getState()
            this.shadowRoot.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
            if (objectID.startsWith("pl_")) {
                if (!this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.add("nohover")
                Utils.apiManager.fetchAPI({
                    act: "getPlaylistInfo",
                    id: objectID.split("pl_").join(""),
                    offset: 0
                }, (info) => {
                    this.shadowRoot.getElementById("title").innerText = info["playlistInfo"]["name"]
                    this.shadowRoot.getElementById("subtitle").innerText = "By " + info["playlistInfo"]["userID"]
                    this.shadowRoot.getElementById("cover").src = info["playlistInfo"]["imgUrl"] != "" ? info["playlistInfo"]["imgUrl"] : "/resources/icon.ico"
                    let div = this.addList("Songs in this playlist:")
                    let songs = info["songs"]["songs"]
                    let counterSongNotLoaded = 0
                    let pl = new Playlist(info["playlistInfo"]["id"], info["playlistInfo"]["name"], info["playlistInfo"]["userID"], info["playlistInfo"]["desc"], info["playlistInfo"]["imgUrl"], info["playlistInfo"]["isPrivate"], info["playlistInfo"]["rank"])
                    this.object = pl
                    for (let i in songs) {
                        let obj = songs[i]
                        let sng = new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                        if (sng.canBeLoaded) div.appendChild(new SongGrid(sng, pl))
                        else counterSongNotLoaded++
                    }
                    let total = parseInt(info["songs"]["total"])
                    while (div.children.length < total - counterSongNotLoaded) {
                        div.appendChild(new SongGrid(null, pl))
                    }
                })
            }
            if (objectID.startsWith("al_")) {
                if (this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.remove("nohover")
                Utils.apiManager.fetchAPI({
                    act: "getAlbumInfo",
                    id: objectID.split("al_").join(""),
                    offset: 0
                }, (info) => {
                    this.shadowRoot.getElementById("title").innerText = info["albumInfo"]["name"]
                    this.shadowRoot.getElementById("subtitle").innerText = "By " + info["albumInfo"]["singerID"]
                    this.shadowRoot.getElementById("subtitle").onclick = () => {
                        if (!Utils.queueManager.currentSong.imgUrl !== "localImg") {
                            Utils.musicViewer.changeView("si_" + info["albumInfo"]["singerID"])
                        }
                    }
                    this.shadowRoot.getElementById("cover").src = info["albumInfo"]["imgUrl"] != "" ? info["albumInfo"]["imgUrl"] : "/resources/icon.ico"
                    let div = this.addList("Songs in this album added on AyMusic's database:")
                    let songs = info["songs"]["songs"]
                    let counterSongNotLoaded = 0
                    let pl = new Album(info["albumInfo"]["id"], info["albumInfo"]["name"], info["albumInfo"]["singerID"], info["albumInfo"]["type"], info["albumInfo"]["imgUrl"])
                    this.object = pl
                    for (let i in songs) {
                        let obj = songs[i]
                        this.shadowRoot.getElementById("subtitle").innerText = "By " + obj.singerName
                        let sng = new Song(obj.songID.replace("so_", ""), obj.url, obj.albumPosition, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, pl.name, pl.id, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                        if (sng.canBeLoaded) div.appendChild(new SongGrid(sng, pl))
                        else counterSongNotLoaded++
                    }
                    let total = parseInt(info["songs"]["total"])
                    while (div.children.length < total - counterSongNotLoaded) {
                        div.appendChild(new SongGrid(null, pl))
                    }
                })
            }
            if (objectID.startsWith("si_")) {
                this.shadowRoot.getElementById("edit_btn").style.display = ""
                this.shadowRoot.getElementById("editTitle").innerText = "{mv.modifySinger}"
                this.shadowRoot.getElementById("editHelp").innerText = "{mv.modifySingerHelp}"
                if (!this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.add("nohover")
                Utils.apiManager.fetchAPI({
                    act: "getSingerInfo",
                    id: objectID.split("si_").join(""),
                    offset: 0
                }, (info) => {
                    this.shadowRoot.getElementById("title").innerText = info["singerInfo"]["name"]
                    this.shadowRoot.getElementById("subtitle").innerText = info["singerInfo"]["aliasName"] && info["singerInfo"]["aliasName"] != "" ? info["singerInfo"]["aliasName"] : "Artist"
                    this.shadowRoot.getElementById("cover").src = info["singerInfo"]["imgUrl"] != "" ? info["singerInfo"]["imgUrl"] : "/resources/icon.ico"
                    let div = this.addList("Latest added song on AyMusic's database of this artist:")
                    let songs = info["songs"]
                    let pl = new Singer(info["singerInfo"]["id"], info["singerInfo"]["name"], info["singerInfo"]["imgUrl"], info["singerInfo"]["aliasName"])
                    this.object = pl
                    for (let i in songs) {
                        let obj = songs[i]
                        let sng = new Song(obj.songID.replace("so_", ""), obj.url, obj.albumPosition, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, pl.id, pl.name, obj.albumName, obj.albumID, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                        if (sng.canBeLoaded) div.appendChild(new SongGrid(sng, pl))
                    }
                    let div2 = this.addList("Albums of this artist added on AyMusic's database:", false)
                    let als = info["singerAlbums"]
                    for (let i in als) {
                        let obj = als[i]
                        let al = new Album(obj.id, obj.name, pl.id, obj.type, obj.imgUrl)
                        div2.appendChild(new AlbumGrid(al))
                    }
                    /**
                     * @type {TextBox}
                     */
                    let a = this.shadowRoot.getElementById("edit_artist")
                    a.setText(info["singerInfo"]["aliasName"])
                    this.shadowRoot.getElementById("edit_title").style.display = "none"
                    this.shadowRoot.getElementById("edit_inline1").style.display = "none"
                    this.shadowRoot.getElementById("edit_inline2").style.display = "none"
                    this.shadowRoot.getElementById("edit_inline3").style.display = "none"
                })
            }
            if (objectID.startsWith("so_")) {
                this.shadowRoot.getElementById("editTitle").innerText = "{mv.modifySong}"
                this.shadowRoot.getElementById("editHelp").innerText = "{mv.modifySongHelp}"
                if (!this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.add("nohover")
                Utils.apiManager.fetchAPI({
                    act: "getSongInfo",
                    id: objectID.split("so_").join("")
                }, (info) => {
                    this.shadowRoot.getElementById("edit").style.display = ""
                    this.shadowRoot.getElementById("title").innerText = info["title"]
                    this.shadowRoot.getElementById("subtitle").innerText = info["singerName"]
                    this.shadowRoot.getElementById("cover").src = info["imgUrl"] != "" ? info["imgUrl"] : "/resources/icon.ico"
                    /**
                     * @type {TextBox}
                     */
                    let a = this.shadowRoot.getElementById("edit_title")
                    a.setText(info["aliasTitle"])
                    /**
                     * @type {TextBox}
                     */
                    let b = this.shadowRoot.getElementById("edit_artist")
                    b.setText(info["aliasSongSingerName"])
                    let x = this.shadowRoot.getElementById("edit_explicit")
                    x.value = info["isExplicit"] ? 1 : 0
                    x.style.backgroundColor = x.value == "1" ? "" : "gray"
                    this.crops = {
                        start: info["cropStart"],
                        end: info["cropEnd"]
                    }
                    this.shadowRoot.getElementById("edit_cropS").innerText = Utils.msToTime(this.crops.start)
                    this.shadowRoot.getElementById("edit_cropE").innerText = this.crops.end != -1 ? Utils.msToTime(this.crops.end) : "{mv.endOfSong}"
                    this.object = new Song(info["songID"], info["url"], info["dateAdded"], info["title"], info["imgUrl"], info["time"], info["isExplicit"], info["addedBy"], info["cropStart"], info["cropEnd"], info["singerID"], info["singerName"], info["albumName"], info["albumID"], info["aliasTitle"], info["aliasSongSingerName"])
                    this.fullObjId = this.fullObjId.split("so_").join("")
                })
            }
            this.loaded = true
        }
        if (updateHistory) window.history.pushState({ where: "musicViewer", objId: objectID, panel: "main" }, "", "/index.html")
    }

    addScrollEventForList(list) {
        list.parentElement.addEventListener("scroll", async (e) => {
            if (list.parentElement) {
                let offset = parseInt((list.parentElement.scrollTop + list.parentElement.offsetHeight - list.offsetTop) / 3200)
                /**
                 * @type {SongGrid}
                 */
                let el = list.children[offset * 50]
                if (el && el.song === null && !el.changeRequested) {
                    el.changeRequested = true
                    if (this.fullObjId.startsWith("pl_")) {
                        Utils.apiManager.fetchAPI({
                            act: "getPlaylistSongs",
                            playlistID: this.fullObjId.replace("pl_", ""),
                            orderByDesc: false,
                            offset: offset
                        }, (result) => {
                            let i = 0;
                            for (let obj of result["songs"]) {
                                /**
                                 * @type {SongGrid}
                                 */
                                let grid = list.children[offset * 50 + i]
                                grid.changeSong(new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName))
                                i++;
                            }
                        })
                    }
                    if (this.fullObjId.startsWith("al_")) {
                        Utils.apiManager.fetchAPI({
                            act: "getAlbumSongs",
                            albumID: this.fullObjId.replace("al_", ""),
                            offset: offset
                        }, (result) => {
                            let i = 0;
                            for (let obj of result["songs"]) {
                                /**
                                 * @type {SongGrid}
                                 */
                                let grid = list.children[offset * 50 + i]
                                grid.changeSong(new Song(obj.songID.replace("so_", ""), obj.url, obj.albumPosition, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName))
                                i++;
                            }
                        })
                    }
                }
            }
        })
    }

    close() {
        if (this.loaded) {
            this.ontransitionend = () => {
                if (this.style.opacity != "1") this.parentElement.removeChild(this)
                this.ontransitionend = () => { };
            };
            this.style.opacity = "0%"
            //this.controller.abort()
        }
    }
}