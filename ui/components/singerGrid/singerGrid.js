import Import from "../../../class/import.js";
import Singer from "../../../class/music/singer.js";
import Translations from "../../../class/translations.js";

export default class SingerGrid extends HTMLDivElement {

    /**
     * @type {Singer}
     */
    singer = null;


    /**
     * 
     * @param {Singer} singer 
     */
    constructor(singer) {
        super();
        this.singer = singer
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/singerGrid/singerGrid.html").then((html) => {
            shadow.innerHTML = html
            //new Translations(shadow.children[1])
            this.shadowRoot.getElementById("title").innerText = this.singer.name
            this.shadowRoot.getElementById("img").style.backgroundImage = this.singer.imgUrl
            this.addEventListener("mouseover", function () {
                this.shadowRoot.getElementById("img").style.transform = "scale(1.1)"
            });
            this.addEventListener("mouseout", function () {
                this.shadowRoot.getElementById("img").style.transform = "scale(1)"
            });
        })
    }
}