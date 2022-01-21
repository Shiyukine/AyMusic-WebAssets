import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";
import SettingsWindow from "../settings/settings.js";

export default class MenuWindow extends HTMLDivElement {
    anWindow = null;

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = Import.loadHTML("/ui/windows/menu/menu.html");
        this.shadowRoot.getElementById("cssImport").onload = () => {
            this.shadowRoot.getElementById("main").ontransitionend = () => { };
            this.shadowRoot.getElementById("main").style = "";
            this.style.width = "100px";
            this.style.height = "100%";
            this.style.position = "absolute";
        }
        this.accountEl = this.shadowRoot.getElementById("acc_pp");
        this.changeAccountAvatar();
        window.addEventListener("popstate", (e) => {
            if (e.state.where == "menu") this.changeWindow(e.state.window, false)
        })
        Array.from(shadow.getElementById("main").getElementsByTagName("svg")).forEach((el) => {
            el.onclick = () => {
                this.changeWindow(this.UserWindows[el.id])
            }
        })
    }

    changeAccountAvatar() {
        this.accountEl.src = Utils.actualAccount.avatarUrl;
    }

    UserWindows = Object.freeze({ "Home": 1, "Library": 2, "Settings": 3 })
    anwindow = { win: null, enum: null }

    /**
     * Change user window
     * @param {UserWindows} newWindow 
     * @param {Boolean} updateHistory
     */
    changeWindow(newWindow, updateHistory = true) {
        if (!this.anWindow || newWindow != this.anWindow.enum) {
            let awindow;
            if (newWindow == this.UserWindows.Home) {
                awindow = document.createElement("div");
                awindow.classList.add("home")
            }
            if (newWindow == this.UserWindows.Settings) {
                awindow = new SettingsWindow()
            }
            awindow.classList.add("aWindow")
            if (updateHistory) window.history.pushState({ where: "menu", window: newWindow }, "", "/index.html")
            if (this.anWindow) {
                let thisW = this.anWindow.win
                thisW.ontransitionend = () => {
                    document.getElementById("main").removeChild(thisW)
                }
                thisW.style.opacity = "0%";
            }
            document.getElementById("main").appendChild(awindow)
            if (newWindow != this.UserWindows.Home) {
                //wait for element load
                awindow.offsetHeight
            }
            awindow.classList.add("loaded")
            this.anWindow = { win: awindow, enum: newWindow }
        }
    }
}