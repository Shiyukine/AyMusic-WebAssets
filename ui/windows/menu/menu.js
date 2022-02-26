import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";
import SettingsWindow from "../settings/settings.js";
import LibraryWindow from "../library/library.js";
import SearchWindow from "../search/search.js";
import Translations from "../../../class/translations.js";

export default class MenuWindow extends HTMLDivElement {
    anWindow = null;

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" });
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        this.id = "menu_win"
        Import.getData("/ui/windows/menu/menu.html").then((html) => {
            shadow.innerHTML = html;
            this.shadowRoot.getElementById("cssImport").onload = () => {
                this.shadowRoot.getElementById("main").ontransitionend = () => { };
                this.shadowRoot.getElementById("main").style = "";
                this.style.width = "100px";
                this.style.height = "100%";
                this.style.position = "absolute";
                this.style.opacity = "1"
            }
            new Translations(shadow.children[1])
            this.accountEl = this.shadowRoot.getElementById("acc_pp");
            this.changeAccountAvatar();
            window.addEventListener("popstate", (e) => {
                if (e.state.where == "menu") this.changeWindow(e.state.window, e.state.menu, false)
            })
            Array.from(shadow.getElementById("main").getElementsByTagName("svg")).forEach((el) => {
                el.onclick = () => {
                    this.changeWindow(this.UserWindows[el.id], el.id)
                }
            })
            shadow.getElementById("acc_link").onclick = () => {
                let win = this.changeWindow(this.UserWindows.Settings, "Settings")
                if (win) win.changeView(2)
            }
            this.changeWindow(this.UserWindows.Home, "Home")
        })
    }

    freezeGif(i) {
        var cnv = document.createElement("canvas")
        for (let j = 0; j < i.attributes.length; j++) {
            let attr = i.attributes[j];
            cnv.setAttribute(attr.name, attr.value);
        }
        var ctx = cnv.getContext('2d')
        cnv.height = i.height
        cnv.width = i.width
        ctx.drawImage(i, 0, 0, i.width, i.height)
        cnv.onmouseenter = () => {
            this.unfreezeGif(cnv)
        }
        i.parentNode.replaceChild(cnv, i);
    }

    unfreezeGif(i) {
        var cnv = document.createElement("img")
        cnv.height = i.height
        cnv.width = i.width
        for (let j = 0; j < i.attributes.length; j++) {
            let attr = i.attributes[j];
            cnv.setAttribute(attr.name, attr.value);
        }
        i.parentNode.replaceChild(cnv, i);
        cnv.onmouseleave = () => {
            this.freezeGif(cnv)
        }
    }

    changeAccountAvatar() {
        this.accountEl.src = Utils.actualAccount.avatarUrl;
        this.shadowRoot.getElementById("acc_pp").onload = () => {
            this.freezeGif(this.shadowRoot.getElementById("acc_pp"))
        }
    }

    UserWindows = Object.freeze({ "Home": 1, "Search": 2, "Library": 3, "Settings": 4 })
    anwindow = { win: null, enum: null, menu: null }

    /**
     * Change user window
     * @param {UserWindows} newWindow 
     * @param {Boolean} updateHistory
     */
    changeWindow(newWindow, menuId, updateHistory = true) {
        let menu = this.shadowRoot.getElementById(menuId)
        if (!this.anWindow || newWindow != this.anWindow.enum) {
            let awindow;
            if (newWindow == this.UserWindows.Home) {
                awindow = document.createElement("div");
                awindow.classList.add("home")
            }
            if (newWindow == this.UserWindows.Library) {
                awindow = new LibraryWindow()
            }
            if (newWindow == this.UserWindows.Search) {
                awindow = new SearchWindow()
            }
            if (newWindow == this.UserWindows.Settings) {
                awindow = new SettingsWindow()
            }
            awindow.classList.add("aWindow")
            if (updateHistory) window.history.pushState({ where: "menu", window: newWindow, menu: menuId }, "", "/index.html")
            if (this.anWindow) {
                let thisW = this.anWindow.win
                thisW.ontransitionend = () => {
                    document.getElementById("main").removeChild(thisW)
                }
                thisW.style.opacity = "0%";
                this.shadowRoot.getElementById(this.anWindow.menu).classList.remove("activated")
            }
            document.getElementById("main").insertBefore(awindow, document.getElementById("menu_win"))
            awindow.classList.add("loaded")
            menu.classList.add("activated")
            this.anWindow = { win: awindow, enum: newWindow, menu: menuId }
            return awindow
        }
        return this.anWindow.win
    }
}