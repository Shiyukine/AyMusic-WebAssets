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
    selectedServer = "iconround";
    isClosed = false;
    controller = new AbortController();
    platformsBusy = []
    elementFocus = null
    anSearch = "";
    static lastSearchCache = [];
    static lastPlatformCache = "";
    static lastSearchTextCache = "";

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.4s"
        Import.getData("/ui/windows/search/search" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                this.translation = new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.style.opacity = "1"
                for (let serv of await PlatformHandler.getAvailablePlatforms()) {
                    let opt = document.createElement("option")
                    opt.value = serv.toLowerCase()
                    opt.innerText = serv
                    shadow.getElementById("serv_picker").appendChild(opt)
                }
                shadow.getElementById("serv_picker").addEventListener("change", () => {
                    //iconround = all
                    this.selectedServer = shadow.getElementById("serv_picker").value
                    shadow.getElementById("serv_ico").src = "/resources/" + shadow.getElementById("serv_picker").value + ".ico"
                    SearchWindow.lastPlatformCache = this.selectedServer
                })
                if(SearchWindow.lastPlatformCache == "") SearchWindow.lastPlatformCache = this.selectedServer
                shadow.getElementById("launchSearch").addEventListener("click", async () => {
                    this.launchSearch()
                })
                /*window.addEventListener("mousedown", () => {
                    if (shadow.getElementById("suggest").style.display != "none" && !this.elementFocus) shadow.getElementById("suggest").style.display = "none"
                })*/
                let dontHide = false
                shadow.getElementById("tb_search").addEventListener("blur", () => {
                    if (!dontHide && shadow.querySelectorAll(":hover").length > 0 && shadow.querySelectorAll(":hover")[shadow.querySelectorAll(":hover").length - 1].tagName != "LI" && !this.elementFocus) shadow.getElementById("suggest").style.display = "none"
                    dontHide = false
                })
                window.addEventListener("click", () => {
                    this.anSearch = null
                    if (this.elementFocus) this.elementFocus.classList.remove("lifocused")
                    this.elementFocus = null
                    this.shadowRoot.getElementById("suggest").style.display = "none"
                }, { signal: this.controller.signal })
                window.addEventListener("keydown", (e) => {
                    if (e.key == "Escape") {
                        this.anSearch = null
                        if (this.elementFocus) this.elementFocus.classList.remove("lifocused")
                        this.elementFocus = null
                        this.shadowRoot.getElementById("suggest").style.display = "none"
                    }
                }, { signal: this.controller.signal })
                shadow.getElementById("tb_search").addEventListener("keyup", async (e) => {
                    if (e.key == "Enter") {
                        this.launchSearch()
                    }
                    else if (e.key == "Escape") {
                        //do nothing
                    }
                    else if (e.key == "ArrowDown") {
                        if (this.elementFocus == null) {
                            this.anSearch = shadow.getElementById("tb_search").value
                            dontHide = true
                            shadow.getElementById("suggest").children[0].focus()
                        }
                        else {
                            if (this.elementFocus.nextElementSibling == null) {
                                dontHide = true
                                shadow.getElementById("suggest").children[0].focus()
                            }
                            else this.elementFocus.nextElementSibling.focus()
                        }
                    }
                    else if (e.key == "ArrowUp") {
                        if (this.elementFocus != null) {
                            let el = this.elementFocus.previousElementSibling
                            if (el == null) {
                                shadow.getElementById("tb_search").value = this.anSearch
                                this.anSearch = null
                                if (this.elementFocus) this.elementFocus.classList.remove("lifocused")
                                this.elementFocus = null
                            }
                            else el.focus()
                            e.preventDefault()
                            e.stopImmediatePropagation()
                            e.stopPropagation()
                        }
                    }
                    else {
                        if (this.elementFocus) this.elementFocus.classList.remove("lifocused")
                        this.elementFocus = null
                        this.anSearch = null
                        if (shadow.getElementById("tb_search").value != "") {
                            let data = await (await fetch("https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&hl=en&gl=fr&gs_rn=64&gs_ri=youtube&ds=yt&cp=12&gs_id=2p&callback=uwu&q=" + shadow.getElementById("tb_search").value)).text()
                            shadow.getElementById("suggest").style.display = ""
                            data = data.replace("uwu && uwu(", "").slice(0, -1)
                            let json = JSON.parse(data)
                            let arr = json[1]
                            while (this.shadowRoot.getElementById("suggest").firstChild) {
                                this.shadowRoot.getElementById("suggest").removeChild(this.shadowRoot.getElementById("suggest").lastChild);
                            }
                            for (let suggest of arr) {
                                let li = document.createElement("li")
                                li.innerText = suggest[0]
                                li.tabIndex = "0"
                                li.onclick = (e) => {
                                    shadow.getElementById("tb_search").value = li.innerText
                                    shadow.getElementById("suggest").style.display = "none"
                                    this.launchSearch()
                                    e.preventDefault()
                                    e.stopImmediatePropagation()
                                    e.stopPropagation()
                                }
                                li.onfocus = () => {
                                    shadow.getElementById("tb_search").value = li.innerText
                                    if (this.elementFocus) this.elementFocus.classList.remove("lifocused")
                                    this.elementFocus = li
                                    shadow.getElementById("tb_search").focus()
                                    li.classList.add("lifocused")
                                }
                                shadow.getElementById("suggest").appendChild(li)
                            }
                            if (arr.length == 0) {
                                shadow.getElementById("suggest").style.display = "none"
                            }
                        }
                        else {
                            shadow.getElementById("suggest").style.display = "none"
                        }
                    }
                })
                if (SearchWindow.lastSearchCache.length > 0) {
                    shadow.getElementById("tb_search").value = SearchWindow.lastSearchTextCache
                    shadow.getElementById("serv_picker").value = SearchWindow.lastPlatformCache
                    this.selectedServer = shadow.getElementById("serv_picker").value
                    shadow.getElementById("serv_ico").src = "/resources/" + shadow.getElementById("serv_picker").value + ".ico"
                    SearchWindow.lastSearchCache.forEach(x => {
                        if (x instanceof Song) {
                            this.shadowRoot.getElementById("songs").appendChild(new SongGrid(x))
                        }
                        else if (x instanceof Singer) {
                            this.shadowRoot.getElementById("artists").appendChild(new SingerGrid(x))
                        }
                        else {
                            this.shadowRoot.getElementById("albums").appendChild(new AlbumGrid(x))
                        }
                    })
                    this.shadowRoot.getElementById("bottom").style.display = "block"
                }
            }
        })
    }

    async launchSearch() {
        if (this.shadowRoot.getElementById("tb_search").value != "") {
            this.anSearch = null
            SearchWindow.lastSearchTextCache = this.shadowRoot.getElementById("tb_search").value
            SearchWindow.lastSearchCache = []
            if (this.elementFocus) this.elementFocus.classList.remove("lifocused")
            this.elementFocus = null
            this.shadowRoot.getElementById("suggest").style.display = "none"
            this.shadowRoot.getElementById("tb_search").blur()
            if (this.platformsBusy.length == 0) {
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
                this.shadowRoot.getElementById("bottom").style.display = "block"
                if (this.selectedServer != "iconround") {
                    await this.searchForAPlatform(this.capitalizeFirstLetter(this.selectedServer))
                }
                else {
                    for (let plat of await PlatformHandler.getAvailablePlatforms()) {
                        await this.searchForAPlatform(plat)
                    }
                }
            }
            else {
                let id = "search"
                Utils.showMiniError(id, "Already searching! Please wait...", true)
            }
        }
        else {
            let id = "search2"
            Utils.showMiniError(id, "Please put something to search!", true)
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

    async searchForAPlatform(server) {
        var platform = server
        this.platformsBusy.push(platform)
        if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform &&
            (await PlatformHandler.getPlatformSettings(platform)).Token == "") {
            console.log("Platform need refresh token")
            await PlatformHandler.refreshTokenForPlatform(platform)
            console.log("Platform token refreshed")
        }
        var searchUrl = await PlatformHandler.getPlatformUrl(platform, "SearchUrl")
        //searchUrl = searchUrl.split("%search%").join(encodeURIComponent(this.shadowRoot.getElementById("tb_search").value))
        let value = this.shadowRoot.getElementById("tb_search").value
        if (value.endsWith(" ")) value = value.slice(0, -1)
        searchUrl = searchUrl.split("%search%").join(value)
        if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform) {
            searchUrl = searchUrl.split("%token%").join((await PlatformHandler.getPlatformSettings(platform)).Token)
        }
        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") searchUrl = encodeURI(searchUrl)
        console.log("Search url: " + searchUrl)
        var urlsExist = []
        urlsExist = await Utils.apiManager.doPostRequest({
            act: "getSongsUrl",
            filter: (await PlatformHandler.getPlatformSettings(platform)).FilterSearch
        })
        var objDB = []
        objDB = await Utils.apiManager.doPostRequest({
            act: "newSearch",
            filter: (await PlatformHandler.getPlatformSettings(platform)).FilterSearch,
            search: value
        })
        let singersUrlExist = []
        let albumsUrlExist = []
        for (let song of objDB) {
            let id = song["songID"]
            let url = song["url"]
            let positionOrDate = song["albumPosition"]
            let title = song["title"]
            let imgUrl = song["imgUrl"]
            let time = song["time"]
            let isExplicit = song["isExplicit"]
            let addedBy = song["addedBy"]
            let cropStart = song["cropStart"]
            let cropEnd = song["cropEnd"]
            let singerID = song["singerID"]
            let singerName = song["singerName"]
            let singerImgUrl = song["singerImgUrl"]
            let singerUrl = song["singerUrl"]
            let additionalSingers = song["additionalSingers"]
            let albumName = song["albumName"]
            let albumID = song["albumID"]
            let albumType = song["albumType"]
            let albumImgUrl = song["albumImgUrl"]
            let albumUrl = song["albumUrl"]
            let aliasSongSingerName = song["aliasSongSingerName"]
            let aliasSingerName = song["aliasSingerName"]
            let aliasTitle = song["aliasTitle"]
            let sg = new Song(id, url, positionOrDate, title, imgUrl, time,
                isExplicit, addedBy, cropStart, cropEnd, singerID, singerName, albumName, albumID, albumUrl, singerUrl, additionalSingers, aliasTitle, aliasSongSingerName, aliasSingerName)
            SearchWindow.lastSearchCache.push(sg)
            this.shadowRoot.getElementById("songs").appendChild(new SongGrid(sg))
            if (!singersUrlExist.includes(singerID)) {
                let sing = new Singer(singerID, singerName, singerImgUrl, singerUrl)
                SearchWindow.lastSearchCache.push(sing)
                this.shadowRoot.getElementById("artists").appendChild(new SingerGrid(sing))
                singersUrlExist.push(singerID)
            }
            for (let ar of additionalSingers) {
                if (!singersUrlExist.includes(ar.singerID)) {
                    let sing = new Singer(ar.singerID, ar.singerName, ar.singerImgUrl, ar.singerUrl)
                    SearchWindow.lastSearchCache.push(sing)
                    this.shadowRoot.getElementById("artists").appendChild(new SingerGrid(sing))
                    singersUrlExist.push(ar.singerID)
                }
            }
            if (!albumsUrlExist.includes(albumID)) {
                let al = new Album(albumID, albumName, singerID, albumType, albumImgUrl, albumUrl)
                SearchWindow.lastSearchCache.push(al)
                this.shadowRoot.getElementById("albums").appendChild(new AlbumGrid(al))
                albumsUrlExist.push(albumID)
            }
        }
        let script = await Utils.app.httpRequestGET(await PlatformHandler.getPlatformUrl(platform, "SearchScript"))
        TaskHandler.addTask(searchUrl, script, false, true, false, async (data) => {
            if (data == "Error" && (await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform) {
                console.log("Platform need refresh token")
                await PlatformHandler.refreshTokenForPlatform(platform)
                console.log("Platform token refreshed")
                this.platformsBusy.splice(this.platformsBusy.indexOf(platform), 1)
                this.searchForAPlatform(server)
            }
            else {
                try {
                    var json = JSON.parse(data)
                    if (json.length > 0) {
                        var songsToAdd = []
                        var songsIDs = []
                        let albumsIDAdded = []
                        let singersIDAdded = []
                        for (let song of json) {
                            let songID = null
                            for (let songDB of urlsExist) {
                                if (songDB["url"] == song.url) {
                                    songID = songDB["songID"]
                                    let id = songDB["songID"]
                                    let url = song.url
                                    let positionOrDate = songDB["songPosition"]
                                    let title = song.title
                                    let imgUrl = song.imgUrl
                                    let time = song.time
                                    let isExplicit = song.isExplicit
                                    let addedBy = songDB["addedBy"]
                                    let cropStart = song.cropStart
                                    let cropEnd = song.cropEnd
                                    let singerID = songDB["singerID"]
                                    let singerName = song.singerName
                                    let singerUrl = song.singerUrl
                                    let singerImgUrl = song.singerImgUrl
                                    let albumName = song.albumName
                                    let albumID = songDB["albumID"]
                                    let albumUrl = song.albumUrl
                                    let albumType = song.albumType
                                    let albumImgUrl = song.albumImgUrl
                                    let additionalSingers = [];
                                    let aliasSongSingerName = song.singerNameAlias
                                    for (let i in song.additionalSingers) {
                                        let sing = song.additionalSingers[i]
                                        additionalSingers.push({
                                            singerName: sing.singerName,
                                            singerID: songDB["additionalSingersID"][i],
                                            singerUrl: sing.singerUrl,
                                            singerImgUrl: sing.singerImgUrl
                                        })
                                    }
                                    let sg = new Song(id, url, positionOrDate, title, imgUrl, time,
                                        isExplicit, addedBy, cropStart, cropEnd, singerID, singerName, albumName, albumID, albumUrl, singerUrl, additionalSingers, "", aliasSongSingerName)
                                    SearchWindow.lastSearchCache.push(sg)
                                    this.shadowRoot.getElementById("songs").appendChild(new SongGrid(sg))
                                    if (!singersIDAdded.includes(singerID)) {
                                        let sing = new Singer(singerID, singerName, singerImgUrl, singerUrl)
                                        SearchWindow.lastSearchCache.push(sing)
                                        this.shadowRoot.getElementById("artists").appendChild(new SingerGrid(sing))
                                        singersIDAdded.push(singerID)
                                    }
                                    for (let ar of additionalSingers) {
                                        if (!singersIDAdded.includes(ar.singerID)) {
                                            let sing = new Singer(ar.singerID, ar.singerName, ar.singerImgUrl, ar.singerUrl)
                                            SearchWindow.lastSearchCache.push(sing)
                                            this.shadowRoot.getElementById("artists").appendChild(new SingerGrid(sing))
                                            singersIDAdded.push(ar.singerID)
                                        }
                                    }
                                    if (!albumsIDAdded.includes(albumID)) {
                                        let al = new Album(albumID, albumName, singerID, albumType, albumImgUrl, albumUrl)
                                        SearchWindow.lastSearchCache.push(al)
                                        this.shadowRoot.getElementById("albums").appendChild(new AlbumGrid(al))
                                        albumsIDAdded.push(albumID)
                                    }
                                }
                            }
                            if (!songID) {
                                songsToAdd.push([song.url, song.title, song.imgUrl, song.time, song.isExplicit, song.cropStart, song.cropEnd,
                                song.albumName, song.albumType, song.albumImgUrl, song.albumUrl, song.singerName, song.singerImgUrl, song.singerUrl, song.singerNameAlias, song.additionalSingers, song.additionalAlbumSingers])
                            }
                            else {
                                songsIDs.push(songID)
                            }
                        }
                        if (songsToAdd.length > 0) {
                            let nsongsID = await Utils.apiManager.doPostRequest({
                                act: "addMultipleSongsDB",
                                songs: songsToAdd
                            })
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
                                let singerName = songsToAdd[i][11]
                                let singerImgUrl = songsToAdd[i][12]
                                let singerUrl = songsToAdd[i][13]
                                let albumName = songsToAdd[i][7]
                                let albumID = nsongsID[i]["albumID"]
                                let albumType = songsToAdd[i][8]
                                let albumImgUrl = songsToAdd[i][9]
                                let albumUrl = songsToAdd[i][10]
                                let singerNameAlias = songsToAdd[i][14]
                                for (let j in songsToAdd[i][15]) {
                                    songsToAdd[i][15][j]["singerID"] = nsongsID[i]["additionalSingerID"][j]
                                }
                                let additionalSingers = songsToAdd[i][15]
                                let sg = new Song(id, url, positionOrDate, title, imgUrl, time,
                                    isExplicit, addedBy, cropStart, cropEnd, singerID, singerName, albumName, albumID, albumUrl, singerUrl, additionalSingers, "", singerNameAlias)
                                SearchWindow.lastSearchCache.push(sg)
                                this.shadowRoot.getElementById("songs").appendChild(new SongGrid(sg))
                                if (!singersIDAdded.includes(singerID)) {
                                    let sing = new Singer(singerID, singerName, singerImgUrl, singerUrl)
                                    SearchWindow.lastSearchCache.push(sing)
                                    this.shadowRoot.getElementById("artists").appendChild(new SingerGrid(sing))
                                    singersIDAdded.push(singerID)
                                }
                                for (let ar of additionalSingers) {
                                    if (!singersIDAdded.includes(ar.singerID)) {
                                        let sing = new Singer(ar.singerID, ar.singerName, ar.singerImgUrl, ar.singerUrl)
                                        SearchWindow.lastSearchCache.push(sing)
                                        this.shadowRoot.getElementById("artists").appendChild(new SingerGrid(sing))
                                        singersIDAdded.push(ar.singerID)
                                    }
                                }
                                if (!albumsIDAdded.includes(albumID)) {
                                    let al = new Album(albumID, albumName, singerID, albumType, albumImgUrl, albumUrl)
                                    SearchWindow.lastSearchCache.push(al)
                                    this.shadowRoot.getElementById("albums").appendChild(new AlbumGrid(al))
                                    albumsIDAdded.push(albumID)
                                }
                            }
                        }
                        this.platformsBusy.splice(this.platformsBusy.indexOf(platform), 1)
                    }
                    else {
                        this.platformsBusy.splice(this.platformsBusy.indexOf(platform), 1)
                        Utils.newError("Unable to search on " + platform, "No songs returned")
                    }
                }
                catch (e) {
                    this.platformsBusy.splice(this.platformsBusy.indexOf(platform), 1)
                    Utils.newError("Unable to search on " + platform, e)
                }
            }
        }, (await PlatformHandler.getPlatformSettings(platform)).NeedDisplayNoneWhenSearching.includes(Utils.app.platform))
    }

    disconnectedCallback() {
        this.translation.end()
        this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
        this.__proto__ = null
    }
}