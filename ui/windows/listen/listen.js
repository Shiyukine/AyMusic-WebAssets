import Import from "../../../class/import.js";
import Utils from "../../../class/utils/utils.js";

export default class listenWindow extends HTMLDivElement
{
    constructor()
    {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        shadow.innerHTML = Import.loadHTML("/ui/windows/listen/listen.html")
        this.shadowRoot.getElementById("cssImport").onload = () =>
        {
            this.shadowRoot.getElementById("listen").ontransitionend = () => { };
            this.shadowRoot.getElementById("listen").style = ""
            shadow.getElementById("progressBar").style.width = shadow.getElementById("slider").offsetWidth + "px"
            shadow.getElementById("progressBar").style.position = "absolute"
            shadow.getElementById("middle").style.setProperty('--value', shadow.getElementById("slider").value);
        }
        window.addEventListener("resize", function() {
            shadow.getElementById("progressBar").style.width = shadow.getElementById("slider").offsetWidth + "px"
        })
        this.shadowRoot.getElementById("slider").oninput = function() {
            shadow.getElementById("middle").style.setProperty('--value', shadow.getElementById("slider").value);
        }
        this.shadowRoot.getElementById("pbInfo").onmouseenter = function() {
            shadow.getElementById("progressBar").style.visibility = "hidden"
            shadow.getElementById("slider").style.visibility = "visible"
        }
        this.shadowRoot.getElementById("pbInfo").onmouseleave = function() {
            shadow.getElementById("progressBar").style.visibility = "visible"
            shadow.getElementById("slider").style.visibility = "hidden"
        }
    }
}