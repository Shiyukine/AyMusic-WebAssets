import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";

export default class menuWindow
{
    /**
     * @type {HTMLElement}
     */
    #bg = document.createElement("div");

    constructor(parent)
    {
        this.parent = parent
        this.#bg.innerHTML = Import.loadHTML("/ui/windows/menu/menu.html")
        this.#bg.style.width = "100px"
        this.#bg.style.height = "100%"
        this.#bg.style.position = "absolute"
        this.parent = parent
        this.accountEl = this.#bg.getElementsByClassName("acc_pp")[0]
        this.changeAccountAvatar()
        this.parent.appendChild(this.#bg)
    }

    changeAccountAvatar()
    {
        this.accountEl.src = Utils.actualAccount.avatarUrl
    }
}