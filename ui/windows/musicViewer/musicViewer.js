import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";

export default class MusicViewerWindow extends HTMLDivElement {
    selectedIndex = 0;
    isClosed = false;
    controller = new AbortController();

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/musicViewer/musicViewer.html").then((html) => {
            shadow.innerHTML = html
            new Translations(shadow.children[1])
            this.style.opacity = "1"
        })
    }

    close() {
        this.isClosed = true
        while (this.firstChild) {
            this.removeChild(this.lastChild);
        }
        this.controller.abort()
    }
}