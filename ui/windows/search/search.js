import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Singer from "../../../class/music/singer.js";
import Song from "../../../class/music/song.js";
import PlatformHandler from "../../../class/player/platformHandler.js";
import TaskHandler from "../../../class/taskHandler.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import AlbumGrid from "../../components/albumGrid/albumGrid.js";
import SingerGrid from "../../components/singerGrid/singerGrid.js";
import SongGrid from "../../components/songGrid/songGrid.js";

export default class SearchWindow extends HTMLDivElement {
    selectedServer = "icon";
    isClosed = false;
    controller = new AbortController();

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/search/search" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.style.opacity = "1"
                for (let serv of await PlatformHandler.getAvailablePlatforms()) {
                    let opt = document.createElement("option")
                    opt.value = serv.toLowerCase()
                    opt.innerText = serv
                    shadow.getElementById("serv_picker").appendChild(opt)
                }
                shadow.getElementById("serv_picker").addEventListener("change", () => {
                    //icon = all
                    this.selectedServer = shadow.getElementById("serv_picker").value
                    shadow.getElementById("serv_ico").src = "/resources/" + shadow.getElementById("serv_picker").value + ".ico"
                })
                shadow.getElementById("launchSearch").addEventListener("click", async () => {
                    this.launchSearch()
                })
                shadow.getElementById("tb_search").addEventListener("keydown", async (e) => {
                    if (e.key == "Enter") {
                        this.launchSearch()
                    }
                })
            }
        })
    }

    async launchSearch() {
        while (this.shadowRoot.getElementById("songs").children.length > 0) {
            this.shadowRoot.getElementById("songs").removeChild(this.shadowRoot.getElementById("songs").children[0])
        }
        while (this.shadowRoot.getElementById("artists").children.length > 0) {
            this.shadowRoot.getElementById("artists").removeChild(this.shadowRoot.getElementById("artists").children[0])
        }
        while (this.shadowRoot.getElementById("albums").children.length > 0) {
            this.shadowRoot.getElementById("albums").removeChild(this.shadowRoot.getElementById("albums").children[0])
        }
        while (this.shadowRoot.getElementById("playlists").children.length > 0) {
            this.shadowRoot.getElementById("playlists").removeChild(this.shadowRoot.getElementById("playlists").children[0])
        }
        if (this.selectedServer != "icon") {
            await this.searchForAPlatform(this.capitalizeFirstLetter(this.selectedServer), false)
            this.shadowRoot.getElementById("bottom").style.display = "block"
        }
        else {
            for (let plat of await PlatformHandler.getAvailablePlatforms()) {
                await this.searchForAPlatform(plat, false)
            }
            this.shadowRoot.getElementById("bottom").style.display = "block"
        }
    }

    close() {
        this.isClosed = true
        while (this.firstChild) {
            this.removeChild(this.lastChild);
        }
        this.controller.abort()
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    async searchForAPlatform(server, listAddedServerSongs) {
        //listAddedServerSongs = show songs which are already added on AyMusic DB
        var platform = server
        if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform &&
            (await PlatformHandler.getPlatformSettings(platform)).Token == "") {
            console.log("Platform need refresh token")
            await PlatformHandler.refreshTokenForPlatform(platform)
            console.log("Platform token refreshed")
        }
        var searchUrl = await PlatformHandler.getPlatformUrl(platform, "SearchUrl")
        searchUrl = searchUrl.split("%search%").join(this.shadowRoot.getElementById("tb_search").value)
        if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform) {
            searchUrl = searchUrl.split("%token%").join((await PlatformHandler.getPlatformSettings(platform)).Token)
        }
        searchUrl = encodeURI(searchUrl)
        console.log("Search url: " + searchUrl)
        var urlsExist = []
        urlsExist = await Utils.apiManager.doPostRequest({
            act: "getSongsUrl",
            filter: (await PlatformHandler.getPlatformSettings(platform)).FilterSearch
        })
        TaskHandler.addTask(searchUrl, await Utils.app.remoteClient.httpRequestGET(await PlatformHandler.getPlatformUrl(platform, "SearchScript"), {
            headers: {
                "pragma": "no-cache",
                "cache-control": "no-cache"
            }
        }), false, true, false, async (data) => {
            if (data == "Error" && (await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform) {
                console.log("Platform need refresh token")
                await PlatformHandler.refreshTokenForPlatform(platform)
                console.log("Platform token refreshed")
                this.searchForAPlatform(server, listAddedServerSongs)
            }
            else {
                var json = JSON.parse(data)
                var songsToAdd = []
                var songsIDs = []
                for (let song of json) {
                    let songID = null
                    for (let songDB of urlsExist) {
                        if (songDB["url"] == song.url) songID = songDB["songID"]
                    }
                    if (!songID) {
                        songsToAdd.push([song.url, song.title, song.imgUrl, song.time, song.isExplicit, song.cropStart, song.cropEnd,
                        song.albumName, song.albumType, song.albumImgUrl, song.singerName, song.singerImgUrl])
                    }
                    else {
                        songsIDs.push(songID)
                    }
                }
                let nsongsID = await Utils.apiManager.doPostRequest({
                    act: "addMultipleSongsDB",
                    songs: songsToAdd
                })
                if (!listAddedServerSongs) {
                    let albumsIDAdded = []
                    let singersIDAdded = []
                    for (let i in nsongsID) {
                        let id = nsongsID[i]["songID"]
                        let url = songsToAdd[i][0]
                        let positionOrDate = nsongsID[i]["songPosition"]
                        let title = songsToAdd[i][1]
                        let imgUrl = songsToAdd[i][2]
                        let time = songsToAdd[i][3]
                        let isExplicit = songsToAdd[i][4]
                        let addedBy = "AyMusic"
                        let cropStart = songsToAdd[i][5]
                        let cropEnd = songsToAdd[i][6]
                        let singerID = nsongsID[i]["singerID"]
                        let singerName = songsToAdd[i][10]
                        let singerImgUrl = songsToAdd[i][11]
                        let albumName = songsToAdd[i][7]
                        let albumID = nsongsID[i]["albumID"]
                        let albumType = songsToAdd[i][8]
                        let albumImgUrl = songsToAdd[i][9]
                        this.shadowRoot.getElementById("songs").appendChild(new SongGrid(new Song(id, url, positionOrDate, title, imgUrl, time,
                            isExplicit, addedBy, cropStart, cropEnd, singerID, singerName, albumName, albumID)))
                        if (!singersIDAdded.includes(singerID)) {
                            this.shadowRoot.getElementById("artists").appendChild(new SingerGrid(new Singer(singerID, singerName, singerImgUrl)))
                            singersIDAdded.push(singerID)
                        }
                        if (!albumsIDAdded.includes(albumID)) {
                            this.shadowRoot.getElementById("albums").appendChild(new AlbumGrid(new Album(albumID, albumName, singerID, albumType, albumImgUrl)))
                            albumsIDAdded.push(albumID)
                        }
                    }
                    /*for(let i in urlsExist) {
                        for(let j in songsToAdd) {
                            if(urlsExist[i]["songID"] == songsIDs[j]) {
                                let id = urlsExist[i]["songID"]
                                let url = songsToAdd[j][0]
                                let positionOrDate = urlsExist[i]["songPosition"]
                                let title = songsToAdd[j][1]
                                let imgUrl = songsToAdd[j][2]
                                let time = songsToAdd[j][3]
                                let isExplicit = songsToAdd[j][4]
                                let addedBy = "AyMusic"
                                let cropStart = songsToAdd[j][5]
                                let cropEnd = songsToAdd[j][6]
                                let singerID = urlsExist[i]["singerID"]
                                let singerName = songsToAdd[j][10]
                                let albumName = songsToAdd[j][7]
                                let albumID = urlsExist[i]["albumID"]
                                this.shadowRoot.getElementById("songs").appendChild(new SongGrid(new Song(id, url, positionOrDate, title, imgUrl, time,
                                    isExplicit, addedBy, cropStart, cropEnd, singerID, singerName, albumName, albumID)))
                            }
                        }
                    }*/
                }
                else {
                    /*for (let song of songsIDs.concat(nsongsID)) {
                        if (!urlsExist.includes(song.url)) {
                            songs.push([song.url, song.title, song.imgUrl, song.time, song.isExplicit, song.cropStart, song.cropEnd,
                            song.albumName, song.albumType, song.albumImgUrl, song.singerName, song.singerImgUrl])
                        }
                    }*/
                }
            }
        })
    }
}