import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import LibraryWindow from "../../windows/library/library.js";

export default class PlaylistGrid extends HTMLDivElement {

    /**
     * @type {Playlist}
     */
    playlist = null;


    /**
     * 
     * @param {Playlist} playlist 
     */
    constructor(playlist) {
        super();
        this.playlist = playlist
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/playlistGrid/playlistGrid.html").then((html) => {
            shadow.innerHTML = html
            new Translations(shadow.children[1])
            this.shadowRoot.getElementById("title").innerText = this.playlist.name
            this.shadowRoot.getElementById("img").style.backgroundImage = "url('" + this.playlist.imgUrl + "')"
            this.addEventListener("mouseover", function () {
                this.shadowRoot.getElementById("img").style.transform = "scale(1.1)"
            });
            this.addEventListener("mouseout", function () {
                this.shadowRoot.getElementById("img").style.transform = "scale(1)"
            });
            this.addEventListener("click", function () {
                if (playlist.userID === Utils.actualAccount.id) {
                    Utils.menu.changeWindow(Utils.menu.UserWindows.Library, "Library", false)
                    /**
                     * @type {LibraryWindow}
                     */
                    let win = Utils.menu.anWindow.win
                    Array.from(win.shadowRoot.getElementById("menu").children).forEach((x, y) => {
                        if (x.dataset && x.dataset["plid"] == playlist.id) win.changeView(y)
                    })
                }
                else {
                    //to-do
                }
            });
        })
    }
}