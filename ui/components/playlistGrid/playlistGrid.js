import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";

export default class PlaylistGrid extends HTMLDivElement {

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/components/playlistGrid/playlistGrid.html").then((html) => {
            shadow.innerHTML = html
            new Translations(shadow.children[1])
            this.style.opacity = "1"
        })
    }
}