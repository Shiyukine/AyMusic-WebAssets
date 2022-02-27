import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";

export default class ListenWindow extends HTMLDivElement {
    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/listen/listen.html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = () => {
                this.shadowRoot.getElementById("listen").ontransitionend = () => { };
                this.shadowRoot.getElementById("listen").style = ""
                shadow.getElementById("progressBar").style.width = (shadow.getElementById("pbInfo").offsetWidth - 18) + "px"
                shadow.getElementById("progressBar").style.position = "absolute"
                this.changeValue(this.getValue())
                this.style.opacity = "1"
            }
            //custom progressBar
            window.addEventListener("resize", () => {
                shadow.getElementById("progressBar").style.width = (shadow.getElementById("pbInfo").offsetWidth - 18) + "px"
                this.changeValue(this.getValue())
            })
            let mouseState = {
                down: false,
                hover: false,
                x: 0
            }
            this.shadowRoot.getElementById("pbInfo").onmousedown = (e) => {
                mouseState.down = true
                mouseState.x = e.x - this.shadowRoot.getElementById("stateThumb").getClientRects()[0].x
                let left = e.x - this.shadowRoot.getElementById("pbInfo").getClientRects()[0].x - this.shadowRoot.getElementById("stateThumb").clientWidth / 2
                left = left / (this.shadowRoot.getElementById("pbInfo").clientWidth - 18) * parseFloat(this.shadowRoot.getElementById("progressBar").dataset["max"])
                this.changeValue(left)
            }
            window.addEventListener("mousemove", (e) => {
                if (mouseState.down) {
                    let left = e.x - this.shadowRoot.getElementById("pbInfo").getClientRects()[0].x - this.shadowRoot.getElementById("stateThumb").clientWidth / 2
                    if (left < 0)
                        left = 0
                    if (left > this.shadowRoot.getElementById("pbInfo").clientWidth - 18)
                        left = this.shadowRoot.getElementById("pbInfo").clientWidth - 18
                    left = left / (this.shadowRoot.getElementById("pbInfo").clientWidth - 18) * parseFloat(this.shadowRoot.getElementById("progressBar").dataset["max"])
                    this.changeValue(left)
                }
            })
            window.addEventListener("mouseup", (e) => {
                if (mouseState.down) {
                    let left = e.x - this.shadowRoot.getElementById("pbInfo").getClientRects()[0].x - this.shadowRoot.getElementById("stateThumb").clientWidth / 2
                    if (left < 0)
                        left = 0
                    if (left > this.shadowRoot.getElementById("pbInfo").clientWidth - 18)
                        left = this.shadowRoot.getElementById("pbInfo").clientWidth - 18
                    left = left / (this.shadowRoot.getElementById("pbInfo").clientWidth - 18) * parseFloat(this.shadowRoot.getElementById("progressBar").dataset["max"])
                    if (!mouseState.hover) {
                        shadow.getElementById("stateThumb").style.visibility = "hidden"
                        shadow.getElementById("state").style.backgroundColor = "white"
                    }
                    this.changeValue(left, true)
                    mouseState.down = false
                }
            })
            this.shadowRoot.getElementById("pbInfo").onmouseenter = function () {
                mouseState.hover = true
                shadow.getElementById("stateThumb").style.visibility = "visible"
                shadow.getElementById("state").style.backgroundColor = "#10a2e6"
            }
            this.shadowRoot.getElementById("pbInfo").onmouseleave = function () {
                mouseState.hover = false
                if (!mouseState.down) {
                    shadow.getElementById("stateThumb").style.visibility = "hidden"
                    shadow.getElementById("state").style.backgroundColor = "white"
                }
            }
            //end custom progressBar
            new Translations(shadow.children[1])
        })
    }

    changeValue(value, updateMusic = false) {
        let left = value / parseFloat(this.shadowRoot.getElementById("progressBar").dataset["max"]) * (this.shadowRoot.getElementById("pbInfo").clientWidth - 18)
        this.shadowRoot.getElementById("stateThumb").style.marginLeft = left + "px"
        this.shadowRoot.getElementById("state").style.width = left + "px"
        this.shadowRoot.getElementById("progressBar").dataset["value"] = value.toString()
        if (updateMusic === true) {
            console.log("updating time music")
        }
    }

    changeMax(max) {
        this.shadowRoot.getElementById("progressBar").dataset["max"] = max.toString()
    }

    getValue() {
        return parseFloat(this.shadowRoot.getElementById("progressBar").dataset["value"])
    }
}