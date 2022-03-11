import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import Translations from "../../../class/translations.js";

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
            this.shadowRoot.getElementById("img").style.backgroundImage = this.playlist.imgUrl
            this.addEventListener("mouseover", function () {
                this.shadowRoot.getElementById("img").style.transform = "scale(1.1)"
            });
            this.addEventListener("mouseout", function () {
                this.shadowRoot.getElementById("img").style.transform = "scale(1)"
            });
        })
    }
}