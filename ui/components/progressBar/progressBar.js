import Import from "../../../class/import.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import LocalMusicHandler from "../../../class/utils/localMusicHandler.js";
import Utils from "../../../class/utils/utils.js";
import * as id3 from "../../../plugins/id3/id3.js";
import InfoPanel from "../../components/infoPanel/infoPanel.js";

export default class ProgressBar extends HTMLElement {
    #eventEl = document.createElement("event");
    max = 100.0;
    value = 0.0;
    changeValueInitialized = null

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/progressBar/progressBar.html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                //shadow.getElementById("progressBar").style.width = (shadow.getElementById("pbInfo").offsetWidth - 18) + "px"
                //shadow.getElementById("progressBar").style.position = "absolute"
                new ThemeColor(shadow.children[1])
                if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                    shadow.getElementById("stateThumb").style.visibility = "visible"
                    shadow.getElementById("state").style.backgroundColor = "white"
                    shadow.getElementById("stateThumb").style.backgroundColor = "white"
                }
            }
            this.changeMax(this.getAttribute("max") ? this.getAttribute("max") : this.getMax())
            if (this.changeValueInitialized) {
                this.changeValue(this.changeValueInitialized)
            }
            else {
                this.changeValue(this.getAttribute("value") ? this.getAttribute("value") : this.getValue())
            }
            window.addEventListener("resize", () => {
                //shadow.getElementById("progressBar").style.width = (shadow.getElementById("pbInfo").offsetWidth - 18) + "px"
                this.changeValue(this.getValue())
            })
            let mouseState = {
                down: false,
                hover: false,
                x: 0
            }
            this.shadowRoot.getElementById("pbInfo").onpointerdown = (e) => {
                this.#eventEl.dispatchEvent(new CustomEvent("changing"));
                mouseState.down = true
                mouseState.x = e.x - this.shadowRoot.getElementById("stateThumb").getClientRects()[0].x
                let left = e.x - this.shadowRoot.getElementById("pbInfo").getClientRects()[0].x - this.shadowRoot.getElementById("stateThumb").clientWidth / 2
                if (left < 0)
                    left = 0
                if (left > this.shadowRoot.getElementById("pbInfo").clientWidth - 18)
                    left = this.shadowRoot.getElementById("pbInfo").clientWidth - 18
                left = left / (this.shadowRoot.getElementById("pbInfo").clientWidth - 18) * parseFloat(this.max)
                this.changeValue(left)
            }
            window.addEventListener("pointermove", (e) => {
                if (mouseState.down) {
                    let left = e.x - this.shadowRoot.getElementById("pbInfo").getClientRects()[0].x - this.shadowRoot.getElementById("stateThumb").clientWidth / 2
                    if (left < 0)
                        left = 0
                    if (left > this.shadowRoot.getElementById("pbInfo").clientWidth - 18)
                        left = this.shadowRoot.getElementById("pbInfo").clientWidth - 18
                    left = left / (this.shadowRoot.getElementById("pbInfo").clientWidth - 18) * parseFloat(this.max)
                    this.changeValue(left)
                }
            })
            window.addEventListener("pointerup", (e) => {
                if (mouseState.down) {
                    let left = e.x - this.shadowRoot.getElementById("pbInfo").getClientRects()[0].x - this.shadowRoot.getElementById("stateThumb").clientWidth / 2
                    if (left < 0)
                        left = 0
                    if (left > this.shadowRoot.getElementById("pbInfo").clientWidth - 18)
                        left = this.shadowRoot.getElementById("pbInfo").clientWidth - 18
                    left = left / (this.shadowRoot.getElementById("pbInfo").clientWidth - 18) * parseFloat(this.max)
                    if (Utils.app.platform != "Android" && Utils.app.platform != "iOS") {
                        if (!mouseState.hover) {
                            shadow.getElementById("stateThumb").style.visibility = "hidden"
                            shadow.getElementById("state").style.backgroundColor = "white"
                        }
                    }
                    this.changeValue(left)
                    this.#eventEl.dispatchEvent(new CustomEvent("release"));
                    mouseState.down = false
                }
            })
            this.shadowRoot.getElementById("pbInfo").onmouseenter = function () {
                if (Utils.app.platform != "Android" && Utils.app.platform != "iOS") {
                    mouseState.hover = true
                    shadow.getElementById("stateThumb").style.visibility = "visible"
                    shadow.getElementById("state").style.backgroundColor = "#10a2e6"
                }
            }
            this.shadowRoot.getElementById("pbInfo").onmouseleave = function () {
                if (Utils.app.platform != "Android" && Utils.app.platform != "iOS") {
                    mouseState.hover = false
                    if (!mouseState.down) {
                        shadow.getElementById("stateThumb").style.visibility = "hidden"
                        shadow.getElementById("state").style.backgroundColor = "white"
                    }
                }
            }
        })
    }

    changeValue(value) {
        try {
            if (this.shadowRoot.getElementById("pbInfo").clientWidth > 0) {
                let left = value / parseFloat(this.max) * (this.shadowRoot.getElementById("pbInfo").clientWidth - 18)
                if (document.visibilityState == "visible") {
                    this.shadowRoot.getElementById("stateThumb").style.marginLeft = left + "px"
                    this.shadowRoot.getElementById("state").style.width = left + "px"
                }
                this.value = value
                this.#eventEl.dispatchEvent(new CustomEvent("valuechange"));
            }
        }
        catch (e) {
            //console.error("Can't change value, progressBar not initialized!")
            this.changeValueInitialized = value
        }
    }

    changeMax(max) {
        this.max = max;
        this.#eventEl.dispatchEvent(new CustomEvent("maxchange"));
    }

    getMax() {
        return this.max
    }

    getValue() {
        return this.value
    }

    onChanging(callback) {
        this.#eventEl.addEventListener("changing", callback)
    }

    onRelease(callback) {
        this.#eventEl.addEventListener("release", callback)
    }

    onValueChange(callback) {
        this.#eventEl.addEventListener("valuechange", callback)
    }

    onMaxChange(callback) {
        this.#eventEl.addEventListener("maxchange", callback)
    }

    disconnectedCallback() {
        this.translation.end()
        //this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
        this.__proto__ = null
    }
}