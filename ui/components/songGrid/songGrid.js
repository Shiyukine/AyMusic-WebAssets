import Import from "../../../class/import.js";
import Song from "../../../class/music/song.js";
import Translations from "../../../class/translations.js";

export default class SongGrid extends HTMLDivElement {

    /**
     * @type {Song}
     */
    song = null;


    /**
     * 
     * @param {song} song 
     */
    constructor(song) {
        super();
        this.song = song
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/songGrid/songGrid.html").then((html) => {
            shadow.innerHTML = html
            //new Translations(shadow.children[1])
            this.shadowRoot.getElementById("title").innerText = this.song.title
            this.shadowRoot.getElementById("artist").innerText = this.song.singerName
            this.shadowRoot.getElementById("img").style.backgroundImage = this.song.imgUrl
            this.addEventListener("mouseover", function () {
                this.shadowRoot.getElementById("svg").style.opacity = "1"
                this.shadowRoot.getElementById("cache").style.opacity = "1"
            });
            this.addEventListener("mouseout", function () {
                this.shadowRoot.getElementById("svg").style.opacity = "0"
                this.shadowRoot.getElementById("cache").style.opacity = "0"
            });
            this.addEventListener("click", function () {
                console.log("clicked")
            });
        })
    }
}