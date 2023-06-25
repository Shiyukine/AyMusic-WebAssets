import Import from "../../../class/import.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";

export default class SearchWindow extends HTMLDivElement {
    selectedServer = "icon";
    isClosed = false;
    controller = new AbortController();

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/search/search.html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.style.opacity = "1"
                shadow.getElementById("serv_picker").addEventListener("change", () => {
                    //icon = all
                    this.selectedServer = shadow.getElementById("serv_picker").value
                    shadow.getElementById("serv_ico").src = "/resources/" + shadow.getElementById("serv_picker").value + ".ico"
                })
                shadow.getElementById("tb_search").addEventListener("keydown", (e) => {
                    if (e.key == "Enter") {
                        console.log("aaaa")
                    }
                })
            }
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