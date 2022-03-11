import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Translations from "../../../class/translations.js";

export default class AlbumGrid extends HTMLDivElement {

    /**
     * @type {Album}
     */
    album = null;


    /**
     * 
     * @param {Album} album 
     */
    constructor(album) {
        super();
        this.album = album
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/albumGrid/albumGrid.html").then((html) => {
            shadow.innerHTML = html
            new Translations(shadow.children[1])
            this.shadowRoot.getElementById("title").innerText = this.album.name
            this.shadowRoot.getElementById("img").style.backgroundImage = this.album.imgUrl
            this.addEventListener("mouseover", function () {
                this.shadowRoot.getElementById("img").style.transform = "scale(1.1)"
            });
            this.addEventListener("mouseout", function () {
                this.shadowRoot.getElementById("img").style.transform = "scale(1)"
            });
        })
    }
}