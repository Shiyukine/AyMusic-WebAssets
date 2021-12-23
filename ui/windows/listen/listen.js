import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";

export default class listenWindow extends HTMLDivElement
{
    constructor()
    {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        shadow.innerHTML = Import.loadHTML("/ui/windows/listen/listen.html")
    }
}