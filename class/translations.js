import Import from "./import.js";
import Utils from "./utils/utils.js";

export default class Translations {
    static allTranslations = {};
    observerOptions = {
        childList: true,
        subtree: true
    }
    paused = false;

    static async init() {
    }

    /**
     * translate a group of elements
     * @param {HTMLElement} rootElement 
     */
    constructor(rootElement) {
        this.rootElement = rootElement
        try {
            Import.getData("/resources/translation.json").then(data => {
                let allTranslations = JSON.parse(data)
                if (allTranslations == {} || allTranslations == undefined) {
                    console.error("Unable to load translations file")
                    return;
                }
                this.translationLang = allTranslations[Utils.app.settings.gen_langs]
                this.changeLang(this.translationLang)
                this.observer = new MutationObserver((mutationsList, observer) => {
                    for (let mutation of mutationsList) {
                        this.translate(mutation.target);
                    }
                });
                this.observer.observe(rootElement, this.observerOptions);
                Utils.app.addEventListener("langchanged", () => {
                    this.changeLang(allTranslations[Utils.app.settings.gen_langs])
                })
            })
        }
        catch (e) {
            Utils.newError("Unable to get translations", e)
        }
    }

    pause() {
        if (this.paused || !this.observer) return
        this.paused = true
        this.observer.disconnect()
    }

    resume() {
        if (!this.paused || !this.observer) return
        this.paused = false
        this.observer.observe(this.rootElement, this.observerOptions)
    }

    translateAll() {
        Array.from(this.rootElement.querySelectorAll("*")).forEach(x => {
            let text = x.innerText
            if (x.tagName == "title") text = x.innerHTML
            if (typeof x.dataset != "undefined" && (x.dataset["translated"] == "undefined" || typeof x.dataset["translated2"] == "undefined" ||
                x.dataset["translated"] != text || x.dataset["translated2"] != x.title)) {
                if (x.tagName == "P" || x.tagName == "A" || x.tagName == "title" ||
                    x.tagName == "SPAN" || x.tagName == "H1" || x.tagName == "H2" ||
                    x.tagName == "H3" || x.tagName == "H4" || x.tagName == "H5" ||
                    x.tagName == "BUTTON" || x.tagName == "LABEL") {
                    if (this.translationLang[text]) {
                        x.innerText = this.translationLang[text]
                        if (x.tagName == "title") x.innerHTML = this.translationLang[text]
                        x.setAttribute("data-translated", text)
                    }
                    if (this.translationLang[x.title]) {
                        x.title = this.translationLang[x.title]
                        x.setAttribute("data-translated2", x.title)
                    }
                }
            }
        })
    }

    translate(el) {
        [el].concat(Array.from(el.querySelectorAll("*"))).forEach(x => {
            let text = x.innerText
            if (x.tagName == "title") text = x.innerHTML
            if (typeof x.dataset != "undefined" && (typeof x.dataset["translated"] == "undefined" || typeof x.dataset["translated2"] == "undefined" ||
                x.dataset["translated"] != text || x.dataset["translated2"] != x.title)) {
                if (x.tagName == "P" || x.tagName == "A" || x.tagName == "title" ||
                    x.tagName == "SPAN" || x.tagName == "H1" || x.tagName == "H2" ||
                    x.tagName == "H3" || x.tagName == "H4" || x.tagName == "H5" ||
                    x.tagName == "BUTTON" || x.tagName == "LABEL") {
                    if (this.translationLang[text]) {
                        x.innerText = this.translationLang[text]
                        if (x.tagName == "title") x.innerHTML = this.translationLang[text]
                        x.setAttribute("data-translated", text)
                    }
                    if (this.translationLang[x.title]) {
                        x.title = this.translationLang[x.title]
                        x.setAttribute("data-translated2", x.title)
                    }
                }
            }
        })
    }

    changeLang(trl) {
        if (!trl) {
            Utils.newError("Translations in " + Utils.app.settings.gen_langs + " not found", "Language set to English.")
            this.translationLang = Translations.allTranslations["English"]
        }
        this.translateAll()
    }

    end() {
        this.observer.disconnect()
        this.rootElement = null
        this.__proto__ = null
    }
}