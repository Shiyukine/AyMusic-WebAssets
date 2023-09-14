import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import PlaylistGrid from "../../components/playlistGrid/playlistGrid.js";
import AlbumGrid from "../../components/albumGrid/albumGrid.js";
import SingerGrid from "../../components/singerGrid/singerGrid.js"
import Album from "../../../class/music/album.js";
import Singer from "../../../class/music/singer.js";
import Playlist from "../../../class/music/playlist.js";
import ThemeColor from "../../../class/themeColor.js";

export default class HomeWindow extends HTMLDivElement {
    isClosed = false;

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/home/home" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.style.opacity = "1"
                this.refreshHome()
            }
        })
    }

    async refreshHome() {
        console.log("Refreshing home")
        var pls = Utils.libManager.userPlaylists;
        let date = new Date(Date.now())
        let h = date.getHours()
        for (let pl in pls) {
            if (pls[pl].name.includes("{") && pls[pl].name.includes("}")) {
                if (h > 5 && h < 13 && pls[pl].name.includes("morning")) {
                    this.createSubList(pls[pl])
                    break;
                }
                if (h >= 13 && h < 19 && pls[pl].name.includes("afternoon")) {
                    this.createSubList(pls[pl])
                    break;
                }
                if ((h >= 19 || h <= 5) && pls[pl].name.includes("evening")) {
                    this.createSubList(pls[pl])
                    break;
                }
            }
        }
        for (let pl in pls) {
            if (pls[pl].name.includes("{") && pls[pl].name.includes("}")) {
                if (!pls[pl].name.includes("evening")
                    && !pls[pl].name.includes("morning")
                    && !pls[pl].name.includes("afternoon")
                    && !pls[pl].name.includes("liked"))
                    this.createSubList(pls[pl])
            }
        }
        console.log("Home refreshed")
    }

    async createSubList(playlist) {
        var title = document.createElement("h2")
        title.innerText = playlist.name
        this.shadowRoot.getElementById("main").appendChild(title)
        var list = document.createElement("div")
        list.classList.add("plList")
        this.shadowRoot.getElementById("main").appendChild(list)
        Utils.apiManager.fetchAPI({ act: "getObjectsInPlaylist", playlistID: playlist.id, offset: 0, orderByDesc: true, size: 6 }, (result) => {
            let count = 0;
            for (let i in result) {
                let obj = result[i]
                if (obj.id.includes("al_")) {
                    let id = obj.id.replace("al_", "")
                    list.appendChild(new AlbumGrid(new Album(id, obj.name, obj.singerID, obj.type, obj.imgUrl, obj.dateAdded)))
                }
                if (obj.id.includes("si_")) {
                    let id = obj.id.replace("si_", "")
                    list.appendChild(new SingerGrid(new Singer(id, obj.name, obj.imgUrl, obj.dateAdded, obj.aliasName)))
                }
                if (obj.id.includes("pl_")) {
                    let id = obj.id.replace("pl_", "")
                    list.appendChild(new PlaylistGrid(new Playlist(id, obj.name, obj.userID, obj.desc, obj.imgUrl, obj.isPrivate, obj.rank, obj.dateAdded)))
                }
                count++;
            }
            if (count == 0) {
                var noObj = document.createElement("p")
                noObj.innerText = "{pl.home.noSong}"
                noObj.classList.add("noSong")
                list.appendChild(noObj)
            }
        })
    }

    close() {
        this.isClosed = true
        while (this.firstChild) {
            this.removeChild(this.lastChild);
        }
    }
}