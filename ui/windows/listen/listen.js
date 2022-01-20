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
        }
    }
}