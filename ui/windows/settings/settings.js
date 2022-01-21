import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";

export default class SettingsWindow extends HTMLDivElement
{
    selectedIndex = 0;

    constructor()
    {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        shadow.innerHTML = Import.loadHTML("/ui/windows/settings/settings.html")
        shadow.getElementById("menu").onwheel = (ev) =>
        {
            let newIndex;
            if (ev.deltaY > 0) newIndex = this.selectedIndex + 1
            else newIndex = this.selectedIndex - 1
            if (newIndex > shadow.getElementById("menu").children.length - 1) newIndex -= 1
            if (newIndex < 0) newIndex += 1
            this.changeView(shadow, newIndex)
        };
        Array.from(shadow.getElementById("menu").children).forEach((x, y) =>
        {
            x.onclick = () => {
                this.changeView(shadow, y)
            }
        })
    }

    changeView(shadow, newIndex)
    {
        shadow.getElementById("menu").children[this.selectedIndex].classList.remove("selected")
        shadow.getElementById("view").children[this.selectedIndex].classList.remove("selected")
        shadow.getElementById("menu").children[newIndex].classList.add("selected")
        shadow.getElementById("view").children[newIndex].classList.add("selected")
        this.selectedIndex = newIndex
    }
}