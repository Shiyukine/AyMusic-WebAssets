import Import from "../../../class/import.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";

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
            this.changeView(newIndex)
        };
        Array.from(shadow.getElementById("menu").children).forEach((x, y) =>
        {
            x.onclick = () => {
                this.changeView(y)
            }
        })
        //
        shadow.getElementById("acc_img").src = Utils.actualAccount.avatarUrl;
        shadow.getElementById("acc_name").innerText = Utils.actualAccount.name;
        shadow.getElementById("acc_email").innerText = Utils.actualAccount.email;
        new Translations(shadow.children[1])
        /*var cb = document.getElementById("settings").getElementsByClassName("view")[0].querySelectorAll("select")[0]
                this.allTranslations["Available"].forEach(y => {
                    var l = document.createElement("option")
                    l.name = y
                    l.innerText = y
                    cb.appendChild(l)
                })*/
    }

    changeView(newIndex)
    {
        this.shadowRoot.getElementById("menu").children[this.selectedIndex].classList.remove("selected")
        this.shadowRoot.getElementById("view").children[this.selectedIndex].classList.remove("selected")
        this.shadowRoot.getElementById("menu").children[newIndex].classList.add("selected")
        this.shadowRoot.getElementById("view").children[newIndex].classList.add("selected")
        this.selectedIndex = newIndex
    }
}