import Import from "../../../class/import.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";

export default class ContextMenu extends HTMLDivElement {

    elements = []
    #eventEl = document.createElement("event");
    isHidded = true;
    loaded = false;
    isSub = false;
    beforeShow = () => { };
    controller = new AbortController();
    id = Date.now()
    curEvent = null;
    dontBack = false;
    onClickGlobal = () => { }

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.4s"
        this.style.display = "flex"
        this.style.position = "absolute"
        this.style.zIndex = "999"
        Import.getData("/ui/components/contextMenu/contextMenu" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                let event = this.curEvent;
                this.translation = new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.style.opacity = "1"
                setTimeout(() => {
                    let testx = event.x + this.clientWidth < document.body.clientWidth
                    let testy = event.y + this.clientHeight < document.body.clientHeight
                    let x = testx
                        ? event.x
                        : document.body.clientWidth - this.clientWidth - 10
                    if (this.isSub) x -= this.clientWidth
                    let y = testy
                        ? event.y
                        : document.body.clientHeight - this.clientHeight - 10
                    if (Utils.currentMiniErrorID != -1) y -= 75
                    if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                        let insets = JSON.parse(Utils.app.remoteClient.getWindowInsets());
                        this.style.bottom = (insets.bottom / devicePixelRatio) + "px"
                        this.style.left = "0"
                        this.style.right = "0"
                        this.style.top = "0"
                        this.style.zIndex = "9"
                        this.style.backdropFilter = "blur(20px)"
                    }
                    else {
                        this.style.right = !testx ? "10px" : "";
                        this.style.bottom = !testy ? "10px" : "";
                        //if (!this.isSub) this.style.position = "inherit"
                        this.style.left = testx ? x + "px" : ""
                        this.style.top = testy ? y + "px" : ""
                    }
                }, 1);
            }
            window.addEventListener("popstate", (e) => {
                if (e.state.where != "contextMenu") {
                    this.hide(false)
                }
            }, { signal: this.controller.signal })
            if (Utils.app.platform != "Android" && Utils.app.platform != "iOS") {
                window.addEventListener("pointerdown", (e) => {
                    if (!this.isHidded && this.shadowRoot && !this.shadowRoot.getElementById("context").matches(":hover") && !this.isSub)
                        this.hide()
                })
                this.addEventListener("mouseleave", (e) => {
                    for (let el of this.elements) {
                        if (el.isSub && !el.contextMenu.matches(":hover") && !el.contextMenu.isHidded) {
                            el.contextMenu.hide()
                        }
                    }
                })
            }
            else {
                this.shadowRoot.getElementById("main").getRootNode().host.addEventListener("click", (e) => {
                    if (!this.dontBack)
                        history.back()
                    this.dontBack = false
                })
            }
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
     * Don't forget to put Promise if beforeShow has async task
     * @param {MouseEvent} event 
     */
    async show(event) {
        this.curEvent = event;
        this.ontransitionend = () => { };
        this.resetElements()
        while (this.shadowRoot.getElementById("context").firstChild) {
            this.shadowRoot.getElementById("context").removeChild(this.shadowRoot.getElementById("context").lastChild)
        }
        await this.beforeShow()
        document.getElementById("main").appendChild(this)
        //this.shadowRoot.getElementById("context").innerHTML = ""
        for (let el of this.elements) {
            let div = document.createElement("div")
            if (!el.isSub) {
                div.onclick = (e) => {
                    if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                        if (typeof el.onclick === "function") {
                            this.onClickGlobal = () => {
                                el.onclick(e)
                                this.onClickGlobal = () => { }
                            }
                        }
                    }
                    else {
                        if (typeof el.onclick === "function")
                            el.onclick(e)
                    }
                    if (!el.isSub) this.hide();
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
                if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                    div.onclick = () => {
                        this.dontBack = true
                        if (!this.isHidded) {
                            let rect = this.getBoundingClientRect();
                            context.show(new MouseEvent("contextmenu", {
                                clientX: rect.left,
                                clientY: rect.top + 39 * Array.from(this.shadowRoot.getElementById("context").children).indexOf(div),
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
                }
                else {
                    div.onmousemove = () => {
                        if (!this.isHidded && context.isHidded) {
                            let rect = this.getBoundingClientRect();
                            context.show(new MouseEvent("contextmenu", {
                                clientX: rect.left,
                                clientY: rect.top + 39 * Array.from(this.shadowRoot.getElementById("context").children).indexOf(div),
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
            para.clientWidth //wait load
        }
        this.clientWidth //wait load
        this.#showLoaded(event)
        this.isHidded = false
    }

    set hidden(callback) {
        this.#eventEl.addEventListener("hidden", callback)
    }

    hide(hideSubs = true) {
        this.ontransitionend = () => {
            if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                this.onClickGlobal()
            }
            document.getElementById("main").removeChild(this)
            this.#eventEl.dispatchEvent(new CustomEvent("hidden"));
        };
        this.style.opacity = "0%"
        if (hideSubs) {
            for (let i in this.elements) {
                var el = this.elements[i]
                if (el.isSub) {
                    el.contextMenu.hide()
                }
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
        if ((Utils.app.platform == "Android" || Utils.app.platform == "iOS") && !this.isSub) window.history.pushState({ where: "contextMenu", id: this.id }, "", "/index.html")
        this.loaded = true
    }

    close() {
        if (this.translation) this.translation.end()
        this.controller.abort()
        this.#eventEl = null
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
        this.innerHTML = ""
        if (document.getElementById("main").contains(this)) document.getElementById("main").removeChild(this)
        this.__proto__ = null
    }
}