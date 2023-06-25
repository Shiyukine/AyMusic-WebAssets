import Import from "./import.js";
import Utils from "./utils/utils.js";

export default class ThemeColor {
    anTheme = ""

    constructor(rootElement) {
        this.rootElement = rootElement
        /*this.changeThemeGlobal(Utils.app.settings.gen_theme)
        Utils.app.addEventListener("themechanged", () => {
            this.changeThemeGlobal(Utils.app.settings.gen_theme)
        })
        let self = this
        var observer = new MutationObserver(function () {
            self.changeThemeGlobal(Utils.app.settings.gen_theme)
        });
        observer.observe(rootElement, {
            childList: true,
            subtree: true
        });
        var narray = [this.rootElement]
        Array.from(this.rootElement.querySelectorAll("*")).forEach(x => narray.push(x))
        narray.forEach(x => {
            x.ontransitionend = (e) => {
                self.changeTheme(e.target, Utils.app.settings.gen_theme, true)
                console.log(e)
                e.stopPropagation()
                e.preventDefault()
            }
        })*/
    }

    changeThemeGlobal(theme) {
        /*var narray = [this.rootElement]
        Array.from(this.rootElement.querySelectorAll("*")).forEach(x => narray.push(x))
        narray.forEach(x => {
            this.changeTheme(x, theme)
        })
        /*if (this.anTheme != theme) {
            this.changeTheme(theme)
        }
        this.anTheme = theme*/
    }

    changeTheme(x, theme, force = false) {
        try {
            var haveBgColor = getComputedStyle(x, null).backgroundColor != "" && getComputedStyle(x, null).backgroundColor != 'rgba(0, 0, 0, 0)' /*&& x.dataset["colorscheme"] != theme*/
            var haveColor = getComputedStyle(x, null).color != "" /*&& x.dataset["colorscheme"] != theme*/
            if (haveBgColor) {
                if (getComputedStyle(x, null).backgroundColor == "white") x.style.backgroundColor = "rgb(255, 255, 255)"
                if (getComputedStyle(x, null).backgroundColor == "black") x.style.backgroundColor = "rgb(0, 0, 0)"
            }
            if (haveColor) {
                if (getComputedStyle(x, null).color == "white") x.style.color = "rgb(255, 255, 255)"
                if (getComputedStyle(x, null).color == "black") x.style.color = "rgb(0, 0, 0)"
            }
            var getValBgColor = (index) => parseFloat(getComputedStyle(x, null).backgroundColor.split("(")[1].split(")")[0].split(", ")[index])
            var getValColor = (index) => parseFloat(getComputedStyle(x, null).color.split("(")[1].split(")")[0].split(", ")[index])
            var writeBgColor = (val) => getComputedStyle(x, null).backgroundColor.split("(")[0] + "(" + val + ", " + val + ", " + val
                + (getComputedStyle(x, null).backgroundColor.split("(")[0] == "rgb" ? ")" : ", " + getComputedStyle(x, null).backgroundColor.split(", ")[3])
            var isWhite = theme == "White"
            var anIsWhite = this.anTheme == "White"
            var b = false
            if (isWhite) {
                if (haveBgColor && getValBgColor(0) == getValBgColor(1) && getValBgColor(1) == getValBgColor(2) && (getValBgColor(0) < 255 / 2 || force)) {
                    x.style.backgroundColor = writeBgColor(255 - getValBgColor(0))
                    b = true
                }
                if (haveColor && getValColor(0) == getValColor(1) && getValColor(1) == getValColor(2) && (getValColor(0) > 255 / 2 || force)) {
                    x.style.color = getComputedStyle(x, null).color.split(getValColor(0)).join(255 - getValColor(0))
                    b = true
                }
            }
            if (!isWhite) {
                if (haveBgColor && getValBgColor(0) == getValBgColor(1) && getValBgColor(1) == getValBgColor(2) && (getValBgColor(0) > 255 / 2 || force)) {
                    x.style.backgroundColor = writeBgColor(255 - getValBgColor(0))
                    b = true
                }
                if (haveColor && getValColor(0) == getValColor(1) && getValColor(1) == getValColor(2) && (getValColor(0) < 255 / 2 || force)) {
                    x.style.color = getComputedStyle(x, null).color.split(getValColor(0)).join(255 - getValColor(0))
                    b = true
                }
            }
            if (b) {
                x.setAttribute("data-colorscheme", theme)
            }
        }
        catch (e) {
            console.error(e)
        }
    }
}