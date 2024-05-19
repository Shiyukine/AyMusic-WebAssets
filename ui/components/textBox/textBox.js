import Import from "../../../class/import.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";

export default class TextBox extends HTMLDivElement {

    label = ""
    cssColor = "white"

    constructor(label, cssColor) {
        super();
        this.label = label
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/textBox/textBox.html").then((html) => {
            shadow.innerHTML = html
            this.translation = new Translations(shadow.children[1])
            new ThemeColor(shadow.children[1])
            this.setLabel(this.getAttribute("label") ? this.getAttribute("label") : label)
            this.setColor(this.getAttribute("cssColor") ? this.getAttribute("cssColor") : cssColor)
            this.shadowRoot.getElementById("lab").onclick = () => {
                this.shadowRoot.getElementById("ipt").focus()
            }
        })
    }

    setLabel(label) {
        this.shadowRoot.getElementById("lab").innerText = label
    }

    getLabel() {
        return this.shadowRoot.getElementById("lab").innerText
    }

    setText(text) {
        this.shadowRoot.getElementById("ipt").value = text
    }

    getText() {
        return this.shadowRoot.getElementById("ipt").value
    }

    setColor(cssColor) {
        this.shadowRoot.getElementById("lab").style.color = cssColor
        this.shadowRoot.getElementById("ipt").style.color = this.shadowRoot.getElementById("ipt").style.borderBottomColor = cssColor
    }

    getColor() {
        return this.cssColor
    }

    disconnectedCallback() {
        if (!this.parentElement) {
            this.translation.end()
            //this.controller.abort()
            while (this.shadowRoot.firstChild) {
                this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }
            this.shadowRoot.innerHTML = ""
            this.__proto__ = null
        }
    }
}