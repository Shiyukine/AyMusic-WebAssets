import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";

export default class LibraryWindow extends HTMLDivElement {
    selectedIndex = 0;

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/library/library.html").then((html) => {
            shadow.innerHTML = html
            shadow.getElementById("menu").onwheel = (ev) => {
                let newIndex;
                if (ev.deltaY > 0) newIndex = this.selectedIndex + 1
                else newIndex = this.selectedIndex - 1
                if (newIndex > shadow.getElementById("menu").children.length - 1) newIndex -= 1
                if (newIndex < 0) newIndex += 1
                this.changeView(newIndex)
            };
            Array.from(shadow.getElementById("menu").children).forEach((x, y) => {
                x.onclick = () => {
                    this.changeView(y)
                }
            })
            new Translations(shadow.children[1])
            this.changeView(this.selectedIndex)
            this.style.opacity = "1"
        })
    }

    changeView(newIndex) {
        try {
            this.shadowRoot.getElementById("menu").children[this.selectedIndex].classList.remove("selected")
            this.shadowRoot.getElementById("view").children[this.selectedIndex].classList.remove("selected")
            this.shadowRoot.getElementById("menu").children[newIndex].classList.add("selected")
            this.shadowRoot.getElementById("view").children[newIndex].classList.add("selected")
        } catch { }
        this.selectedIndex = newIndex
    }
}