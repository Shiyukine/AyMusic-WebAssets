import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Playlist from "../../../class/music/playlist.js";
import Singer from "../../../class/music/singer.js";
import Song from "../../../class/music/song.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import LocalMusicHandler from "../../../class/utils/localMusicHandler.js";
import Utils from "../../../class/utils/utils.js";
import AlbumGrid from "../../components/albumGrid/albumGrid.js";
import SongGrid from "../../components/songGrid/songGrid.js";
import TextBox from "../../components/textBox/textBox.js";
import GestureHandler from "../../../class/gestureHandler.js";

export default class MusicViewerWindow extends HTMLElement {
    selectedIndex = 0;
    isClosed = false;
    loaded = false;
    controller = new AbortController();
    scrollController = new AbortController();
    fullObjId = "";
    /**
     * @type {Album|Singer|Playlist|Song}
     */
    object = null;
    crops = {
        start: 0,
        end: -1
    }
    #eventEl = document.createElement("event");
    scrolls = {};
    lastOffsets = {};
    offsetsSize = {};

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.ontransitionend = () => { };
        this.style.opacity = "0%"
        this.style.width = "100%"
        this.style.position = "absolute"
        this.style.zIndex = "1"
        this.style.transition = "opacity 0.4s"
        Import.getData("/ui/windows/musicViewer/musicViewer" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then(async (html) => {
            let insets = JSON.parse(await Utils.app.remoteClient.getWindowInsets());
            let top = Math.max(36, insets.top / devicePixelRatio);
            if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                this.style.marginTop = "0px"
                this.style.height = "calc(100% - 138px - " + insets.bottom / devicePixelRatio + "px)"
            }
            else {
                this.style.marginTop = "0px"
                this.style.height = "calc(100% - 125px - " + insets.bottom / devicePixelRatio + "px)"
            }
            shadow.innerHTML = html
            if (shadow.querySelector("#topbar")) {
                shadow.querySelector("#topbar").style.marginTop = (top) + "px";
                shadow.querySelector("#list").style.height = "calc(100% - " + (211 - (40 - top)) + "px)"
                shadow.querySelector("#edit").style.height = "calc(100% - " + (211 - (40 - top)) + "px)"
            }
            this.translation = new Translations(shadow.children[1])
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
                if (this.fullObjId != "" && e.detail.objId == this.object instanceof Song ? "so_" + this.fullObjId : this.fullObjId) {
                    shadow.getElementById("like").children[0].setAttribute("d", Utils.libManager.isObjectIDIsInLikedSongs(this.object instanceof Song ? "so_" + this.fullObjId : this.fullObjId) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
                }
            });
            Utils.libManager.onRemoveSongFromLikedSongs((e) => {
                if (this.fullObjId != "" && e.detail.objId == this.object instanceof Song ? "so_" + this.fullObjId : this.fullObjId) {
                    shadow.getElementById("like").children[0].setAttribute("d", Utils.libManager.isObjectIDIsInLikedSongs(this.object instanceof Song ? "so_" + this.fullObjId : this.fullObjId) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
                }
            });
            shadow.getElementById("like").onclick = () => {
                Utils.libManager.addOrRemoveObjectIDLikedSongs(this.object instanceof Song ? "so_" + this.fullObjId : this.fullObjId)
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
                    Utils.showMiniError("mv_errcur", "Please play this song to do it.", true)
            }
            shadow.getElementById("edit_curT2").onclick = async () => {
                if (this.object.id == Utils.queueManager.currentSong.id) {
                    this.crops.end = await Utils.player.getCurrentTime()
                    shadow.getElementById("edit_cropE").innerText = Utils.msToTime(this.crops.end)
                }
                else
                    Utils.showMiniError("mv_errcur", "Please play this song to do it.", true)
            }
            shadow.getElementById("edit_resetT1").onclick = async () => {
                if (this.object.id == Utils.queueManager.currentSong.id) {
                    this.crops.start = 0
                    shadow.getElementById("edit_cropS").innerText = Utils.msToTime(this.crops.start)
                }
                else
                    Utils.showMiniError("mv_errcur", "Please play this song to do it.", true)
            }
            shadow.getElementById("edit_resetT2").onclick = async () => {
                if (this.object.id == Utils.queueManager.currentSong.id) {
                    this.crops.end = -1
                    shadow.getElementById("edit_cropE").innerText = this.crops.end != -1 ? Utils.msToTime(this.crops.end) : "{mv.endOfSong}"
                }
                else
                    Utils.showMiniError("mv_errcur", "Please play this song to do it.", true)
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
                    this.#eventEl.dispatchEvent(new CustomEvent("songchange", {
                        detail: {
                            objId: "so_" + this.fullObjId,
                            isExplicit: shadow.getElementById("edit_explicit").value == 1,
                            aliasTitle: shadow.getElementById("edit_title").getText(),
                            aliasSongSingerName: shadow.getElementById("edit_artist").getText(),
                            cropStart: this.crops.start,
                            cropEnd: this.crops.end
                        }
                    }));
                }
                else if (this.object instanceof Singer) {
                    await Utils.apiManager.doPostRequest({
                        act: "updateSinger",
                        id: this.fullObjId.split("si_").join(""),
                        aliasName: shadow.getElementById("edit_artist").getText()
                    })
                    this.#eventEl.dispatchEvent(new CustomEvent("songchange", {
                        detail: {
                            objId: this.fullObjId,
                            aliasName: shadow.getElementById("edit_artist").getText()
                        }
                    }));
                }
                else {
                    Utils.showMiniError("mv_err", "Failed to change info", true)
                }
                shadow.getElementById("edit").style.display = "none"
                Utils.showMiniError("mv_success", "Success!", true, "rgb(0, 204, 255)", "#000")
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
                let gesture2 = new GestureHandler(shadow.querySelector("#music"), true, 100)
                let quitViewer = () => {
                    gesture2.acceptGesture()
                    history.back()
                }
                gesture2.addEventListener("bottom", quitViewer)
                gesture2.blockSwipeFrom("bottom")
            }
        })
    }

    addList(title, id, addEvent = true) {
        let h1 = document.createElement("h3")
        h1.innerText = title
        h1.classList.add("sublistTitle")
        this.shadowRoot.getElementById("list").appendChild(h1)
        let div = document.createElement("div")
        div.classList.add("sublist")
        div.id = id
        this.shadowRoot.getElementById("list").appendChild(div)
        if (addEvent) this.addScrollEventForList("list", id)
        return div
    }

    /**
     * 
     * @param {String} objectID 
     */
    async changeView(objectID, updateHistory = true) {
        if (!this.parentElement) {
            document.getElementById("main").appendChild(this)
            Utils.menu.havePopup()
        }
        //wait
        this.clientWidth
        //
        this.style.opacity = "1"
        if (this.fullObjId != objectID) {
            this.fullObjId = objectID
            this.object = null
            this.shadowRoot.getElementById("edit").style.display = "none"
            this.shadowRoot.getElementById("edit_btn").style.display = "none"
            this.shadowRoot.getElementById("subtitle").onclick = () => { }
            this.translation.pause()
            for (let el of this.shadowRoot.getElementById("editor").children) {
                el.style.display = ""
            }
            this.shadowRoot.getElementById("like").children[0].setAttribute("d", Utils.libManager.isObjectIDIsInLikedSongs(this.fullObjId) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
            this.shadowRoot.getElementById("editHelpBold").style.display = ""
            this.scrollController.abort()
            let isPlay = this.fullObjId != "" && Utils.queueManager.currentObject != null && this.fullObjId == Utils.queueManager.currentObject.id && Utils.player.state != null && await Utils.player.getState()
            if (objectID.startsWith("pl_")) {
                if (!this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.add("nohover")
                Utils.apiManager.fetchAPI({
                    act: "getPlaylistInfo",
                    id: objectID.split("pl_").join(""),
                    offset: 0
                }, async (info) => {
                    while (this.shadowRoot.getElementById("list").firstChild) {
                        this.shadowRoot.getElementById("list").removeChild(this.shadowRoot.getElementById("list").lastChild);
                    }
                    this.offsetsSize = {};
                    this.shadowRoot.getElementById("title").innerText = info["playlistInfo"]["name"]
                    this.shadowRoot.getElementById("subtitle").innerText = "By " + info["playlistInfo"]["userID"]
                    this.shadowRoot.getElementById("cover").src = info["playlistInfo"]["imgUrl"] != "" ? info["playlistInfo"]["imgUrl"] : "/resources/icon.ico"
                    let div = this.addList("{mv.musicInPl}", "songs_list")
                    this.translation.translateAll()
                    let songs = info["songs"]["songs"]
                    let counterSongNotLoaded = 0
                    let pl = new Playlist(info["playlistInfo"]["id"], info["playlistInfo"]["name"], info["playlistInfo"]["userID"], info["playlistInfo"]["desc"], info["playlistInfo"]["imgUrl"], info["playlistInfo"]["isPrivate"], info["playlistInfo"]["rank"])
                    this.object = pl
                    for (let i in songs) {
                        let obj = songs[i]
                        let sng = new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.albumUrl, obj.singerUrl, obj.additionalSingers, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                        div.appendChild(new SongGrid(sng, pl))
                        if (!sng.canBeLoaded) counterSongNotLoaded++
                    }
                    let total = parseInt(info["songs"]["total"])
                    while (div.children.length < total - counterSongNotLoaded) {
                        div.appendChild(new SongGrid(null, pl))
                    }
                    this.offsetsSize[0] = { begin: 0, end: (50 - counterSongNotLoaded) * 70 }
                    this.translation.resume()
                })
            }
            if (objectID.startsWith("al_")) {
                if (this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.remove("nohover")
                Utils.apiManager.fetchAPI({
                    act: "getAlbumInfo",
                    id: objectID.split("al_").join(""),
                    offset: 0
                }, async (info) => {
                    while (this.shadowRoot.getElementById("list").firstChild) {
                        this.shadowRoot.getElementById("list").removeChild(this.shadowRoot.getElementById("list").lastChild);
                    }
                    this.offsetsSize = {};
                    this.shadowRoot.getElementById("title").innerText = info["albumInfo"]["name"]
                    this.shadowRoot.getElementById("subtitle").innerHTML = "<span>{mv.by}</span> <span>" + info["albumInfo"]["singerID"] + "</span>"
                    this.shadowRoot.getElementById("cover").src = info["albumInfo"]["imgUrl"] != "" ? info["albumInfo"]["imgUrl"] : "/resources/icon.ico"
                    let div = this.addList("{mv.songsInAlbum}", "album_songs_list")
                    this.translation.translateAll()
                    let songs = info["songs"]["songs"]
                    let counterSongNotLoaded = 0
                    let pl = new Album(info["albumInfo"]["id"], info["albumInfo"]["name"], info["albumInfo"]["singerID"], info["albumInfo"]["type"], info["albumInfo"]["imgUrl"])
                    this.object = pl
                    if (songs.length > 0) {
                        let span = this.shadowRoot.getElementById("subtitle").children[1]
                        span.innerText = songs[0].aliasSingerName != null ? songs[0].aliasSingerName : songs[0].singerName
                        span.classList.add("link")
                        span.onclick = async function () {
                            Utils.musicViewer.changeView("si_" + songs[0].singerID)
                        }
                        for (let sing of info.albumInfo.additionalAlbumSingers) {
                            let sep = document.createElement("span")
                            sep.innerText = " • "
                            this.shadowRoot.getElementById("subtitle").appendChild(sep)
                            let span2 = document.createElement("span")
                            span2.innerText = sing.aliasSingerName != null ? sing.aliasSingerName : sing.singerName
                            span2.classList.add("link")
                            span2.onclick = async function () {
                                Utils.musicViewer.changeView("si_" + sing.singerID)
                            }
                            this.shadowRoot.getElementById("subtitle").appendChild(span2)
                        }
                    }
                    for (let i in songs) {
                        let obj = songs[i]
                        let sng = new Song(obj.songID.replace("so_", ""), obj.url, obj.albumPosition, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, pl.name, pl.id, obj.albumUrl, obj.singerUrl, obj.additionalSingers, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                        div.appendChild(new SongGrid(sng, pl))
                        if (!sng.canBeLoaded) counterSongNotLoaded++
                    }
                    let total = parseInt(info["songs"]["total"])
                    while (div.children.length < total - counterSongNotLoaded) {
                        div.appendChild(new SongGrid(null, pl))
                    }
                    this.offsetsSize[0] = { begin: 0, end: (50 - counterSongNotLoaded) * 70 }
                    this.translation.resume()
                })
            }
            if (objectID.startsWith("si_")) {
                this.shadowRoot.getElementById("edit_btn").style.display = ""
                this.shadowRoot.getElementById("editTitle").innerText = "{mv.modifySinger}"
                this.shadowRoot.getElementById("editHelp").innerText = "{mv.modifySingerHelp}"
                this.translation.translateAll()
                if (!this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.add("nohover")
                Utils.apiManager.fetchAPI({
                    act: "getSingerInfo",
                    id: objectID.split("si_").join(""),
                    offset: 0
                }, async (info) => {
                    while (this.shadowRoot.getElementById("list").firstChild) {
                        this.shadowRoot.getElementById("list").removeChild(this.shadowRoot.getElementById("list").lastChild);
                    }
                    this.shadowRoot.getElementById("title").innerText = info["singerInfo"]["name"]
                    this.shadowRoot.getElementById("subtitle").innerText = info["singerInfo"]["aliasName"] && info["singerInfo"]["aliasName"] != "" ? info["singerInfo"]["aliasName"] : "{mv.artistSimple}"
                    this.shadowRoot.getElementById("cover").src = info["singerInfo"]["imgUrl"] != "" ? info["singerInfo"]["imgUrl"] : "/resources/icon.ico"
                    let div = this.addList("{mv.latestArtistSongs}", "artist_songs_list", false)
                    let div2 = this.addList("{mv.albumsArtist}", "artist_albums_list", false)
                    this.translation.translateAll()
                    let songs = info["songs"]
                    let pl = new Singer(info["singerInfo"]["id"], info["singerInfo"]["name"], info["singerInfo"]["imgUrl"], info["singerInfo"]["aliasName"], info["singerInfo"]["url"])
                    this.object = pl
                    for (let i in songs) {
                        let obj = songs[i]
                        let sng = new Song(obj.songID.replace("so_", ""), obj.url, obj.albumPosition, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.albumUrl, obj.singerUrl, obj.additionalSingers, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                        if (sng.canBeLoaded) div.appendChild(new SongGrid(sng, pl))
                    }
                    let als = info["singerAlbums"]
                    for (let i in als) {
                        let obj = als[i]
                        let al = new Album(obj.id, obj.name, pl.id, obj.type, obj.imgUrl, obj.albumUrl)
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
                    this.translation.resume()
                })
            }
            if (objectID.startsWith("so_")) {
                isPlay = this.fullObjId != "" && Utils.queueManager.currentObject != null && this.fullObjId == "so_" + Utils.queueManager.currentObject.id && await Utils.player.getState()
                this.shadowRoot.getElementById("editTitle").innerText = "{mv.modifySong}"
                this.shadowRoot.getElementById("editHelp").innerText = "{mv.modifySongHelp}"
                this.translation.translateAll()
                if (this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.remove("nohover")
                Utils.apiManager.fetchAPI({
                    act: "getSongInfo",
                    id: objectID.split("so_").join("")
                }, async (info) => {
                    while (this.shadowRoot.getElementById("list").firstChild) {
                        this.shadowRoot.getElementById("list").removeChild(this.shadowRoot.getElementById("list").lastChild);
                    }
                    this.shadowRoot.getElementById("edit").style.display = ""
                    if (info["imgUrl"] == "localImg") {
                        this.shadowRoot.getElementById("editHelpBold").style.display = "none"
                        var imge = this.shadowRoot.getElementById("cover");
                        imge.onerror = () => {
                            imge.src = "/resources/icon.ico"
                        }
                        let imgU = "app://data"
                        if (Utils.app.platform == "Android") imgU = "https://mydata";
                        imge.src = imgU + "/Image/" + objectID.split("so_").join("") + ".png"
                        let si = LocalMusicHandler.getArtistByMusicID(objectID.split("so_").join(""))
                        this.shadowRoot.getElementById("title").innerText = info["title"]
                        this.shadowRoot.getElementById("subtitle").innerText = si.name
                    }
                    else {
                        this.shadowRoot.getElementById("title").innerText = info["title"]
                        this.shadowRoot.getElementById("subtitle").innerHTML = ""
                        let span = document.createElement("span")
                        let song = info
                        span.innerText = song.aliasSingerName != null ? song.aliasSingerName : song.singerName
                        span.classList.add("link")
                        span.onclick = async function () {
                            Utils.musicViewer.changeView("si_" + song.singerID)
                        }
                        this.shadowRoot.getElementById("subtitle").appendChild(span)
                        for (let sing of info.additionalSingers) {
                            let sep = document.createElement("span")
                            sep.innerText = " • "
                            this.shadowRoot.getElementById("subtitle").appendChild(sep)
                            let span2 = document.createElement("span")
                            span2.innerText = sing.aliasSingerName != null ? sing.aliasSingerName : sing.singerName
                            span2.classList.add("link")
                            span2.onclick = async function () {
                                Utils.musicViewer.changeView("si_" + sing.singerID)
                            }
                            this.shadowRoot.getElementById("subtitle").appendChild(span2)
                        }
                        this.shadowRoot.getElementById("cover").src = info["imgUrl"] != "" ? info["imgUrl"] : "/resources/icon.ico"
                    }
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
                    this.object = new Song(info["songID"], info["url"], info["dateAdded"], info["title"], info["imgUrl"], info["time"], info["isExplicit"], info["addedBy"], info["cropStart"], info["cropEnd"], info["singerID"], info["singerName"], info["albumName"], info["albumID"], info["aliasTitle"], info["aliasSongSingerName"])
                    this.fullObjId = this.fullObjId.split("so_").join("")
                    this.translation.resume()
                    this.shadowRoot.getElementById("edit_cropS").innerText = Utils.msToTime(this.crops.start)
                    this.shadowRoot.getElementById("edit_cropE").innerText = this.crops.end != -1 ? Utils.msToTime(this.crops.end) : "{mv.endOfSong}"
                })
            }
            this.shadowRoot.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
            this.loaded = true
        }
        if (updateHistory) window.history.pushState({ where: "musicViewer", objId: objectID, panel: "main" }, "", "/index.html")
    }

    addScrollEventForList(parentElementId, listId) {
        this.scrollController = new AbortController();
        this.lastOffsets[listId] = { last: 0, toRemove: -1 }
        this.shadowRoot.getElementById(parentElementId).addEventListener("scroll", async (e) => {
            let isScrollDown = this.scrolls[parentElementId] < this.shadowRoot.getElementById(parentElementId).scrollTop
            let offset = 0
            let ioffset = this.shadowRoot.getElementById(parentElementId).scrollTop + this.shadowRoot.getElementById(listId).offsetTop + (isScrollDown ? this.shadowRoot.getElementById(parentElementId).clientHeight + 70 * 2 : -70 * 2)
            if (ioffset > this.offsetsSize[Object.keys(this.offsetsSize).length - 1].end) offset = parseInt(Object.keys(this.offsetsSize)[Object.keys(this.offsetsSize).length - 1]) + 1
            else {
                for (let i in this.offsetsSize) {
                    if (this.offsetsSize[i].begin <= ioffset && this.offsetsSize[i].end >= ioffset) {
                        offset = parseInt(i)
                        break;
                    }
                }
            }
            let realOffsetToRemove = undefined
            let irealOffsetToRemove = this.shadowRoot.getElementById(parentElementId).scrollTop + this.shadowRoot.getElementById(listId).offsetTop + (isScrollDown ? -70 * 3 : this.shadowRoot.getElementById(parentElementId).clientHeight + 70 * 3)
            if (irealOffsetToRemove > this.offsetsSize[Object.keys(this.offsetsSize).length - 1].end) realOffsetToRemove = parseInt(Object.keys(this.offsetsSize)[Object.keys(this.offsetsSize).length - 1]) + 1
            else if (irealOffsetToRemove < 0) realOffsetToRemove = -1
            else {
                for (let i in this.offsetsSize) {
                    if (this.offsetsSize[i].begin <= irealOffsetToRemove && this.offsetsSize[i].end >= irealOffsetToRemove) {
                        realOffsetToRemove = parseInt(i)
                        break;
                    }
                }
            }
            let offsetToRemove = parseInt(realOffsetToRemove)
            if (realOffsetToRemove >= 0) isScrollDown ? offsetToRemove-- : offsetToRemove++
            if (this.lastOffsets[listId].toRemove != offsetToRemove) {
                this.lastOffsets[listId].toRemove = offsetToRemove
                let elToHide = this.shadowRoot.getElementById(listId).children[(offsetToRemove) * 50]
                if (elToHide) {
                    elToHide.changeRequested = false
                    this.translation.pause();
                    for (let i = 0; i < 50; i++) {
                        /**
                         * @type {SongGrid}
                         */
                        let el = this.shadowRoot.getElementById(listId).children[(offsetToRemove) * 50 + i]
                        if (el) {
                            el.changeSong(null, true)
                        }
                    }
                    this.translation.resume();
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
                    if (this.fullObjId.startsWith("pl_")) {
                        Utils.apiManager.fetchAPI({
                            act: "getPlaylistSongs",
                            playlistID: this.fullObjId.replace("pl_", ""),
                            orderByDesc: false,
                            offset: offset
                        }, (result) => {
                            let i = 0;
                            let counterSongNotLoaded = 0
                            this.translation.pause();
                            for (let obj of result["songs"]) {
                                /**
                                 * @type {SongGrid}
                                 */
                                let grid = this.shadowRoot.getElementById(listId).children[offset * 50 + i]
                                let song = new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.albumUrl, obj.singerUrl, obj.additionalSingers, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                                grid.changeSong(song)
                                if (!song.canBeLoaded) counterSongNotLoaded++
                                i++;
                            }
                            this.offsetsSize[offset] = { begin: offset - 1 < 0 ? 0 : this.offsetsSize[offset - 1].end + 1, end: (offset - 1 < 0 ? 0 : this.offsetsSize[offset - 1].end) + (50 - counterSongNotLoaded) * 70 }
                            this.translation.resume();
                        })
                    }
                    if (this.fullObjId.startsWith("al_")) {
                        Utils.apiManager.fetchAPI({
                            act: "getAlbumSongs",
                            albumID: this.fullObjId.replace("al_", ""),
                            offset: offset
                        }, (result) => {
                            let i = 0;
                            let counterSongNotLoaded = 0
                            this.translation.pause();
                            for (let obj of result["songs"]) {
                                /**
                                 * @type {SongGrid}
                                 */
                                let grid = this.shadowRoot.getElementById(listId).children[offset * 50 + i]
                                let song = new Song(obj.songID.replace("so_", ""), obj.url, obj.albumPosition, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.albumUrl, obj.singerUrl, obj.additionalSingers, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName)
                                grid.changeSong(song)
                                if (!song.canBeLoaded) counterSongNotLoaded++
                                i++;
                            }
                            this.offsetsSize[offset] = { begin: offset - 1 < 0 ? 0 : this.offsetsSize[offset - 1].end + 1, end: (offset - 1 < 0 ? 0 : this.offsetsSize[offset - 1].end) + (50 - counterSongNotLoaded) * 70 }
                            this.translation.resume();
                        })
                    }
                }
            }
            this.scrolls[parentElementId] = this.shadowRoot.getElementById(parentElementId).scrollTop
        }, { signal: this.scrollController.signal })
    }

    close() {
        if (this.loaded) {
            this.ontransitionend = () => {
                if (this.style.opacity != "1") this.parentElement.removeChild(this)
                this.ontransitionend = () => { };
            };
            this.style.opacity = "0%"
            // it's okay to view the new content of something after panel closed
            this.fullObjId = ""
            //this.controller.abort()
        }
    }

    onSongChange(callback) {
        this.#eventEl.addEventListener("songchange", callback)
    }

    addEventListener(event, callback, options) {
        this.#eventEl.addEventListener(event, callback, options)
    }

    disconnectedCallback() {
        /* we don't remove this window completely, because we want to keep the state of the window
        this.translation.end()
        this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""*/
    }
}