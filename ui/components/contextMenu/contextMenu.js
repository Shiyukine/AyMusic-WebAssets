import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";

export default class ContextMenu extends HTMLDivElement {

    elements = []
    #eventEl = document.createElement("event");
    isHidded = true;
    loaded = false;

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.4s"
        this.style.display = "flex"
        Import.getData("/ui/components/contextMenu/contextMenu.html").then((html) => {
            shadow.innerHTML = html
            new Translations(shadow.children[1])
            window.addEventListener("pointerdown", (e) => {
                if (!this.isHidded)
                    this.hide()
            })
        })
    }

    addElement(text, onclick, icon = null) {
        var el = { text: text, onclick: onclick, icon: icon }
        if (!this.elements.includes(el))
            this.elements.push(el)
    }

    /**
     * 
     * @param {MouseEvent} event 
     */
    show(event) {
        this.ontransitionend = () => { };
        this.#eventEl.dispatchEvent(new CustomEvent("beforeShow"));
        while (this.shadowRoot.getElementById("context").firstChild) {
            this.shadowRoot.getElementById("context").removeChild(this.shadowRoot.getElementById("context").lastChild)
        }
        //this.shadowRoot.getElementById("context").innerHTML = ""
        for (let i in this.elements) {
            var el = this.elements[i]
            var div = document.createElement("div")
            div.onclick = el.onclick
            if (el.icon) {
                var icon = this.createSVGPath(el.icon, "white", null, 24)
                div.appendChild(icon)
            }
            var para = document.createElement("p")
            para.innerText = el.text
            div.appendChild(para)
            this.shadowRoot.getElementById("context").appendChild(div)
            this.shadowRoot.getElementById("context").clientWidth //wait load
        }
        if (!this.loaded) {
            this.shadowRoot.children[0].onload = () => {
                this.#showLoaded(event)
            }
            document.getElementById("main").appendChild(this)
        }
        else {
            document.getElementById("main").appendChild(this)
            this.clientWidth //wait load
            this.#showLoaded(event)
            //TEST
            //this.isHidded = false
            //this.style.opacity = "1"
        }
    }

    set beforeShow(callback) {
        this.#eventEl.addEventListener("beforeShow", callback)
    }

    set hidden(callback) {
        this.#eventEl.addEventListener("hidden", callback)
    }

    hide() {
        this.ontransitionend = () => {
            document.getElementById("main").removeChild(this)
            this.#eventEl.dispatchEvent(new CustomEvent("hidden"));
            this.isHidded = true;
        };
        this.style.opacity = "0%"
    }

    resetElements() {
        this.elements = []
    }

    createSVGPath(path, color, click, size) {
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svg.setAttributeNS(null, "viewBox", "0 0 24 24")
        svg.setAttributeNS(null, "width", size)
        svg.setAttributeNS(null, "height", size)
        let sp = document.createElementNS("http://www.w3.org/2000/svg", "path")
        sp.setAttributeNS(null, "d", path)
        sp.setAttributeNS(null, "fill", color)
        svg.addEventListener("touchstart", click);
        svg.addEventListener("mousedown", click);
        svg.appendChild(sp)
        return svg
    }

    #showLoaded = (event) => {
        this.style.opacity = "1"
        this.style.position = "absolute"
        this.loaded = true
        this.isHidded = false
        var testx = event.x + this.clientWidth < document.body.clientWidth
        var testy = event.y + this.clientHeight < document.body.clientHeight
        var x = testx
            ? event.x
            : document.body.clientWidth - this.clientWidth - 10
        var y = testy
            ? event.y
            : document.body.clientHeight - this.clientHeight - 10
        if (!testx)
            this.style.right = "10px"
        if (!testy)
            this.style.bottom = "10px"
        this.style.position = "inherit"
        this.style.left = x + "px"
        this.style.top = (y - 34) + "px"
    }
}