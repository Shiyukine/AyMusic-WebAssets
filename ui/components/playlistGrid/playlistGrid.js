import Import from "../../../class/import.js";
import Playlist from "../../../class/music/playlist.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";

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
        super(playlist);
        this.playlist = playlist
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/components/playlistGrid/playlistGrid.html").then((html) => {
            shadow.innerHTML = html
            new Translations(shadow.children[1])
            this.style.opacity = "1"
            this.shadowRoot.getElementById("title").innerText = playlist.name
            this.shadowRoot.getElementById("img").style.backgroundImage = this.playlist.imgUrl
        })
    }
}