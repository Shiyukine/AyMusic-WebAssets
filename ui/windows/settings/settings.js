import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";

export default class settingsWindow extends HTMLDivElement
{
    constructor()
    {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        shadow.innerHTML = Import.loadHTML("/ui/windows/settings/settings.html")
        shadow.getElementById("menu").onwheel = (ev) =>
        {
            if (ev.deltaY > 0)
            {
                //
            }
        };
    }
}