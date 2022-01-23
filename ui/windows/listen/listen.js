import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";

export default class ListenWindow extends HTMLDivElement
{
    constructor()
    {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/listen/listen.html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = () => {
                this.shadowRoot.getElementById("listen").ontransitionend = () => { };
                this.shadowRoot.getElementById("listen").style = ""
                shadow.getElementById("progressBar").style.width = shadow.getElementById("slider").offsetWidth + "px"
                shadow.getElementById("progressBar").style.position = "absolute"
                shadow.getElementById("middle").style.setProperty('--value', shadow.getElementById("slider").value);
                this.style.opacity = "1"
            }
            window.addEventListener("resize", function () {
                shadow.getElementById("progressBar").style.width = shadow.getElementById("slider").offsetWidth + "px"
            })
            this.shadowRoot.getElementById("slider").oninput = function () {
                shadow.getElementById("middle").style.setProperty('--value', shadow.getElementById("slider").value);
            }
            this.shadowRoot.getElementById("pbInfo").onmouseenter = function () {
                shadow.getElementById("progressBar").style.visibility = "hidden"
                shadow.getElementById("slider").style.visibility = "visible"
            }
            this.shadowRoot.getElementById("pbInfo").onmouseleave = function () {
                shadow.getElementById("progressBar").style.visibility = "visible"
                shadow.getElementById("slider").style.visibility = "hidden"
            }
            new Translations(shadow.children[1])
        })
    }
}