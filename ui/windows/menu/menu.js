import Utils from "../../../class/utils/utils.js";
import Import from "../../../class/import.js";
import SettingsWindow from "../settings/settings.js";
import LibraryWindow from "../library/library.js";
import SearchWindow from "../search/search.js";
import Translations from "../../../class/translations.js";
import HomeWindow from "../home/home.js";
import ThemeColor from "../../../class/themeColor.js";

export default class MenuWindow extends HTMLElement {

    forceUpdateHistory = false

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" });
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.4s"
        this.id = "menu_win"
        Import.getData("/ui/windows/menu/menu" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html;
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                this.shadowRoot.getElementById("main").ontransitionend = () => { };
                this.shadowRoot.getElementById("main").style = "";
                if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                    this.style.width = "100%";
                    this.style.bottom = "0";
                }
                else {
                    this.style.width = "100px";
                    this.style.height = "100%";
                }
                if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                    let insets = JSON.parse(await Utils.app.remoteClient.getWindowInsets());
                    this.shadowRoot.getElementById("main").style.height = (68 + insets.bottom / devicePixelRatio) + "px";
                }
                this.style.position = "absolute";
                this.style.opacity = "1"
                this.accountEl = this.shadowRoot.getElementById("acc_pp");
                this.changeAccountAvatar();
                window.addEventListener("popstate", (e) => {
                    if (e.state.where == "menu") {
                        this.forceUpdateHistory = false
                        this.changeWindow(e.state.window, e.state.menu, false)
                    }
                })
                Array.from(shadow.getElementById("main").getElementsByTagName("svg")).forEach((el) => {
                    el.onclick = () => {
                        this.changeWindow(this.UserWindows[el.id], el.id)
                    }
                })
                this.changeWindow(this.UserWindows.Home, "Home")
                if (Utils.app.platform != "Android" && Utils.app.platform != "iOS") {
                    shadow.getElementById("acc_link").onclick = () => {
                        let win = this.changeWindow(this.UserWindows.Settings, "Settings")
                        if (win) win.changeView(2)
                    }
                    shadow.getElementById("acc_link").onmouseenter = () => {
                        shadow.getElementById("acc_pp").style.visibility = "visible"
                        shadow.getElementById("acc_ppstatic").style.visibility = "hidden"
                    }
                    shadow.getElementById("acc_link").onmouseleave = () => {
                        shadow.getElementById("acc_pp").style.visibility = "hidden"
                        shadow.getElementById("acc_ppstatic").style.visibility = "visible"
                    }
                }
                this.translation = new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
            }
        })
    }

    changeAccountAvatar() {
        if (Utils.app.platform != "Android" && Utils.app.platform != "iOS") {
            this.shadowRoot.getElementById("acc_pp").onload = () => {
                let i = this.shadowRoot.getElementById("acc_pp")
                var cnv = this.shadowRoot.getElementById("acc_ppstatic")
                var scale = 2
                var c1 = this.scaleIt(i, scale, scale)
                var ctx = cnv.getContext('2d')
                cnv.height = c1.height * (1 / scale)
                cnv.width = c1.width * (1 / scale)
                ctx.drawImage(c1, 0, 0, cnv.width, cnv.height)
            }
            this.shadowRoot.getElementById("acc_pp").onerror = () => {
                this.shadowRoot.getElementById("acc_pp").src = "/resources/noavatar.png"
            }
            this.accountEl.src = Utils.actualAccount.avatarUrl.split("?")[0];
        }
    }

    UserWindows = Object.freeze({ "Home": 1, "Search": 2, "Library": 3, "Settings": 4 })
    anwindow = { win: null, enum: null, menu: null }

    /**
     * Change user window
     * @param {UserWindows} newWindow 
     * @param {Boolean} updateHistory
     */
    async changeWindow(newWindow, menuId, updateHistory = true) {
        Utils.musicViewer.close()
        let menu = this.shadowRoot.getElementById(menuId)
        if ((!this.anWindow || newWindow != this.anWindow.enum) || this.forceUpdateHistory)
            if (updateHistory) window.history.pushState({ where: "menu", window: newWindow, menu: menuId }, "", "/index.html")
        if (!this.anWindow || newWindow != this.anWindow.enum) {
            let awindow;
            let winName;
            if (newWindow == this.UserWindows.Home) {
                awindow = new HomeWindow();
                awindow.classList.add("home")
                document.getElementById("bgImg").classList.remove("blur")
                winName = ""
            }
            if (newWindow == this.UserWindows.Library) {
                awindow = new LibraryWindow()
                document.getElementById("bgImg").classList.add("blur")
                winName = "{library}"
            }
            if (newWindow == this.UserWindows.Search) {
                awindow = new SearchWindow()
                document.getElementById("bgImg").classList.add("blur")
                winName = "{search}"
            }
            if (newWindow == this.UserWindows.Settings) {
                awindow = new SettingsWindow()
                document.getElementById("bgImg").classList.add("blur")
                winName = "{settings}"
            }
            awindow.classList.add("aWindow")
            let insets = JSON.parse(await Utils.app.remoteClient.getWindowInsets());
            awindow.style.paddingBottom = ((Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? 155 : 0) + insets.bottom / devicePixelRatio) + "px";
            if (Utils.app.platform == "Windows" || Utils.app.platform == "Linux" || Utils.app.platform == "MacOS") awindow.classList.add("windows")
            if (this.anWindow) {
                let thisW = this.anWindow.win
                thisW.ontransitionend = () => {
                    thisW.close()
                    document.getElementById("main").removeChild(thisW)
                }
                thisW.style.opacity = "0%";
                this.shadowRoot.getElementById(this.anWindow.menu).classList.remove("activated")
            }
            document.getElementById("main").insertBefore(awindow, document.getElementById("menu_win"))
            awindow.classList.add("loaded")
            menu.classList.add("activated")
            this.anWindow = { win: awindow, enum: newWindow, menu: menuId }
            if (document.getElementById("curPageName"))
                document.getElementById("curPageName").innerText = winName
            return awindow
        }
        return this.anWindow.win
    }

    // needed if the window is opened from a popup
    havePopup() {
        this.forceUpdateHistory = true
    }

    scaleIt(source, scaleFactor) {
        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');
        var w = source.width * scaleFactor;
        var h = source.height * scaleFactor;
        c.width = w;
        c.height = h;
        ctx.drawImage(source, 0, 0, w, h);
        return (c);
    }

    disconnectedCallback() {
        this.translation.end()
        //this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
        this.__proto__ = null
    }
}