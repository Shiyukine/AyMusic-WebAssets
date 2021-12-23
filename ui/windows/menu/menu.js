import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";

export default class menuWindow extends HTMLDivElement
{
    constructor()
    {
        super();
        var shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = Import.loadHTML("/ui/windows/menu/menu.html");
        this.style.width = "100px";
        this.style.height = "100%";
        this.style.position = "absolute";
        this.accountEl = this.shadowRoot.getElementById("acc_pp");
        this.changeAccountAvatar();
    }

    changeAccountAvatar()
    {
        this.accountEl.src = Utils.actualAccount.avatarUrl;
    }
}