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

export default class MusicViewerWindow extends HTMLDivElement {
    selectedIndex = 0;
    isClosed = false;
    loaded = false;
    controller = new AbortController();
    fullObjId = "";

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.ontransitionend = () => { };
        this.style.opacity = "0%"
        this.style.marginTop = "35px"
        this.style.width = "100%"
        this.style.height = "calc(100% - 125px)"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/musicViewer/musicViewer.html").then((html) => {
            shadow.innerHTML = html
            new Translations(shadow.children[1])
            new ThemeColor(shadow.children[1])
            window.addEventListener("popstate", (e) => {
                if (e.state.where == "musicViewer") {
                    this.changeView(e.state.objId, false)
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
        })
    }

    addList(title) {
        let h1 = document.createElement("h3")
        h1.innerText = title
        h1.classList.add("sublistTitle")
        this.shadowRoot.getElementById("list").appendChild(h1)
        let div = document.createElement("div")
        div.classList.add("sublist")
        this.shadowRoot.getElementById("list").appendChild(div)
        this.addScrollEventForList(div)
        return div
    }

    /**
     * 
     * @param {String} objectID 
     */
    async changeView(objectID, updateHistory = true) {
        this.fullObjId = objectID
        if (!this.parentElement) document.getElementById("main").appendChild(this)
        if (updateHistory) window.history.pushState({ where: "musicViewer", objId: objectID }, "", "/index.html")
        while (this.shadowRoot.getElementById("list").firstChild) {
            this.shadowRoot.getElementById("list").removeChild(this.shadowRoot.getElementById("list").lastChild);
        }
        //wait
        this.clientWidth
        //
        this.shadowRoot.getElementById("like").children[0].setAttribute("d", Utils.libManager.isObjectIDIsInLikedSongs(this.fullObjId) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
        this.style.opacity = "1"
        if (objectID.startsWith("pl_")) {
            if (!this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.add("nohover")
            let info = await Utils.apiManager.doPostRequest({
                act: "getPlaylistInfo",
                id: objectID.split("pl_").join(""),
                offset: 0
            })
            this.shadowRoot.getElementById("title").innerText = info["playlistInfo"]["name"]
            this.shadowRoot.getElementById("subtitle").innerText = "By " + info["playlistInfo"]["userID"]
            this.shadowRoot.getElementById("cover").src = info["playlistInfo"]["imgUrl"] != "" ? info["playlistInfo"]["imgUrl"] : "/resources/icon.ico"
            let div = this.addList("Songs in this playlist:")
            let songs = info["songs"]["songs"]
            let counterSongNotLoaded = 0
            let pl = new Playlist(info["playlistInfo"]["id"], info["playlistInfo"]["name"], info["playlistInfo"]["userID"], info["playlistInfo"]["desc"], info["playlistInfo"]["imgUrl"], info["playlistInfo"]["isPrivate"], info["playlistInfo"]["rank"])
            for (let i in songs) {
                let obj = songs[i]
                let sng = new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID)
                if (sng.canBeLoaded) div.appendChild(new SongGrid(sng, pl))
                else counterSongNotLoaded++
            }
            let total = parseInt(info["songs"]["total"])
            while (div.children.length < total - counterSongNotLoaded) {
                div.appendChild(new SongGrid(null, pl))
            }
        }
        if (objectID.startsWith("al_")) {
            if (this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.remove("nohover")
            let info = await Utils.apiManager.doPostRequest({
                act: "getAlbumInfo",
                id: objectID.split("al_").join(""),
                offset: 0
            })
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
            for (let i in songs) {
                let obj = songs[i]
                this.shadowRoot.getElementById("subtitle").innerText = "By " + obj.singerName
                let sng = new Song(obj.songID.replace("so_", ""), obj.url, obj.albumPosition, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, pl.name, pl.id)
                if (sng.canBeLoaded) div.appendChild(new SongGrid(sng, pl))
                else counterSongNotLoaded++
            }
            let total = parseInt(info["songs"]["total"])
            while (div.children.length < total - counterSongNotLoaded) {
                div.appendChild(new SongGrid(null, pl))
            }
        }
        if (objectID.startsWith("si_")) {
            if (!this.shadowRoot.getElementById("subtitle").classList.contains("nohover")) this.shadowRoot.getElementById("subtitle").classList.add("nohover")
            let info = await Utils.apiManager.doPostRequest({
                act: "getSingerInfo",
                id: objectID.split("si_").join(""),
                offset: 0
            })
            this.shadowRoot.getElementById("title").innerText = info["singerInfo"]["name"]
            this.shadowRoot.getElementById("subtitle").innerText = "Singer"
            this.shadowRoot.getElementById("cover").src = info["singerInfo"]["imgUrl"] != "" ? info["singerInfo"]["imgUrl"] : "/resources/icon.ico"
            let div = this.addList("Latest added song on AyMusic's database of this singer:")
            let songs = info["songs"]
            let pl = new Singer(info["singerInfo"]["id"], info["singerInfo"]["name"], info["singerInfo"]["imgUrl"])
            for (let i in songs) {
                let obj = songs[i]
                let sng = new Song(obj.songID.replace("so_", ""), obj.url, obj.albumPosition, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, pl.id, pl.name, obj.albumName, obj.albumID)
                if (sng.canBeLoaded) div.appendChild(new SongGrid(sng, pl))
            }
            let div2 = this.addList("Albums of this singer added on AyMusic's database:")
            let als = info["singerAlbums"]
            for (let i in als) {
                let obj = als[i]
                let al = new Album(obj.id, obj.name, pl.id, obj.type, obj.imgUrl)
                div2.appendChild(new AlbumGrid(al))
            }
        }
        this.loaded = true
    }

    addScrollEventForList(list) {
        list.parentElement.addEventListener("scroll", async (e) => {
            let offset = parseInt(list.parentElement.children.length / 50)
            if (list.parentElement.scrollTop > 3200 * offset) {
                /**
                 * @type {SongGrid}
                 */
                let el = list.children[offset * 50]
                if (typeof el.changeSong === "function" && el.song === null) {
                    if (this.fullObjId.startsWith("pl_")) {
                        let result = await Utils.apiManager.doPostRequest({
                            act: "getPlaylistSongs",
                            playlistID: this.fullObjId.replace("pl_", ""),
                            orderByDesc: false,
                            offset: offset
                        })
                        let i = 0;
                        for (let obj of result["songs"]) {
                            /**
                             * @type {SongGrid}
                             */
                            let grid = list.children[offset * 50 + i]
                            grid.changeSong(new Song(obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID))
                            i++;
                        }
                    }
                    if (this.fullObjId.startsWith("al_")) {
                        let result = await Utils.apiManager.doPostRequest({
                            act: "getAlbumSongs",
                            albumID: this.fullObjId.replace("al_", ""),
                            offset: offset
                        })
                        let i = 0;
                        for (let obj of result["songs"]) {
                            /**
                             * @type {SongGrid}
                             */
                            let grid = list.children[offset * 50 + i]
                            grid.changeSong(new Song(obj.songID.replace("so_", ""), obj.url, obj.albumPosition, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID))
                            i++;
                        }
                    }
                }
            }
        })
    }

    close() {
        if (this.loaded) {
            this.ontransitionend = () => {
                this.parentElement.removeChild(this)
                this.ontransitionend = () => { };
            };
            this.style.opacity = "0%"
            //this.controller.abort()
        }
    }
}