import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";

export default class SearchWindow extends HTMLDivElement {
    selectedIndex = 0;

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/search/search.html").then((html) => {
            shadow.innerHTML = html
            new Translations(shadow.children[1])
            this.style.opacity = "1"
        })
    }
}