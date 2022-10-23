import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";

export default class ContextMenu extends HTMLDivElement {

    elements = []
    #eventEl = document.createElement("event");
    isHidded = true;
    loaded = false;
    isSub = false;

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
                if (!this.isHidded && !this.shadowRoot.getElementById("context").matches(":hover") && !this.isSub)
                    this.hide()
            })
            this.addEventListener("mouseleave", (e) => {
                for (let el of this.elements) {
                    if (el.isSub && !el.contextMenu.matches(":hover") && !el.contextMenu.isHidded) {
                        el.contextMenu.hide()
                    }
                }
            })
        })
    }

    addElement(text, onclick, icon = null) {
        var el = { isSub: false, text: text, onclick: onclick, icon: icon }
        if (!this.elements.includes(el))
            this.elements.push(el)
    }

    addSubContextMenu(text, contextMenu) {
        contextMenu.isSub = true;
        var el = { isSub: true, text: text, contextMenu: contextMenu }
        if (!this.elements.includes(el))
            this.elements.push(el)
    }

    /**
     * 
     * @param {MouseEvent} event 
     */
    show(event) {
        this.ontransitionend = () => { };
        this.resetElements()
        while (this.shadowRoot.getElementById("context").firstChild) {
            this.shadowRoot.getElementById("context").removeChild(this.shadowRoot.getElementById("context").lastChild)
        }
        this.#eventEl.dispatchEvent(new CustomEvent("beforeShow"));
        //this.shadowRoot.getElementById("context").innerHTML = ""
        for (let el of this.elements) {
            let div = document.createElement("div")
            if (!el.isSub) {
                div.onclick = (e) => {
                    if (typeof el.onclick === "function")
                        el.onclick(e)
                    this.hide();
                }
                if (el.icon) {
                    let icon = this.createSVGPath(el.icon, "white", null, 24)
                    div.appendChild(icon)
                }
            }
            else {
                /**
                 * @type {ContextMenu}
                 */
                let context = el.contextMenu
                div.onmouseenter = () => {
                    if (!this.isHidded) {
                        let rect = this.getBoundingClientRect();
                        context.show(new MouseEvent("contextmenu", {
                            clientX: rect.left,
                            clientY: rect.top - 1 + 39 * Array.from(this.shadowRoot.getElementById("context").children).indexOf(div),
                            button: 0,
                            ctrlKey: false,
                            altKey: false,
                            shiftKey: false,
                            metaKey: false,
                            bubbles: true,
                            cancelable: true
                        }))
                    }
                }
                div.onmouseleave = () => {
                    if (this.shadowRoot.getElementById("context").matches(':hover'))
                        context.hide()
                }
                //left M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z
                //right M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z
                let icon = this.createSVGPath("M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z", "white", null, 24)
                div.appendChild(icon)
            }
            var para = document.createElement("p")
            para.innerText = el.text
            div.appendChild(para)
            this.shadowRoot.getElementById("context").appendChild(div)
            this.shadowRoot.getElementById("context").clientWidth //wait load
        }
        document.getElementById("main").appendChild(this)
        this.clientWidth //wait load
        this.#showLoaded(event)
        this.isHidded = false
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
        };
        this.style.opacity = "0%"
        for (let i in this.elements) {
            var el = this.elements[i]
            if (el.isSub) {
                el.contextMenu.hide()
            }
        }
        this.isHidded = true;
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
        let testx = event.x + this.clientWidth < document.body.clientWidth
        let testy = event.y + this.clientHeight < document.body.clientHeight
        let x = testx
            ? event.x
            : document.body.clientWidth - this.clientWidth - 10
        if (this.isSub) x -= this.clientWidth
        let y = testy
            ? event.y
            : document.body.clientHeight - this.clientHeight - 10
        this.style.right = !testx ? "10px" : "";
        this.style.bottom = !testy ? "10px" : "";
        //if (!this.isSub) this.style.position = "inherit"
        this.style.left = testx ? x + "px" : ""
        this.style.top = testy ? (y - 34) + "px" : ""
        this.loaded = true
    }
}