import Import from "./import.js";
import Utils from "./utils/utils.js";

export default class Translations {
    static allTranslations = {};

    static async init() {
        Translations.allTranslations = JSON.parse(await Import.getData("/resources/translation.json"));
    }

    /**
     * translate a group of elements
     * @param {HTMLElement} rootElement 
     */
    constructor(rootElement) {
        this.rootElement = rootElement
        try {
            if (Translations.allTranslations == {} || Translations.allTranslations == undefined) {
                console.error("Unable to load translations file")
                return;
            }
            let trl = Translations.allTranslations[Utils.app.settings.gen_langs]
            this.changeLang(trl)
            this.observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    this.translate(trl, mutation.target);
                }
            });
            this.observer.observe(rootElement, {
                childList: true,
                subtree: true
            });
            Utils.app.addEventListener("langchanged", () => {
                this.changeLang(Translations.allTranslations[Utils.app.settings.gen_langs])
            })
        }
        catch (e) {
            Utils.newError("Unable to get translations", e)
        }
    }

    translateAll(trl) {
        Array.from(this.rootElement.querySelectorAll("*")).forEach(x => {
            let text = x.innerText
            if (x.tagName == "title") text = x.innerHTML
            if (typeof x.dataset["translated"] == "undefined" || typeof x.dataset["translated2"] == "undefined" ||
                x.dataset["translated"] != text || x.dataset["translated2"] != x.title) {
                if (x.tagName == "P" || x.tagName == "A" || x.tagName == "title" ||
                    x.tagName == "SPAN" || x.tagName == "H1" || x.tagName == "H2" ||
                    x.tagName == "H3" || x.tagName == "H4" || x.tagName == "H5" ||
                    x.tagName == "BUTTON" || x.tagName == "LABEL") {
                    if (trl[text]) {
                        x.innerText = trl[text]
                        if (x.tagName == "title") x.innerHTML = trl[text]
                        x.setAttribute("data-translated", text)
                    }
                    if (trl[x.title]) {
                        x.title = trl[x.title]
                        x.setAttribute("data-translated2", x.title)
                    }
                }
            }
        })
    }

    translate(trl, el) {
        Array.from(el.querySelectorAll("*")).forEach(x => {
            let text = x.innerText
            if (x.tagName == "title") text = x.innerHTML
            if (typeof x.dataset["translated"] == "undefined" || typeof x.dataset["translated2"] == "undefined" ||
                x.dataset["translated"] != text || x.dataset["translated2"] != x.title) {
                if (x.tagName == "P" || x.tagName == "A" || x.tagName == "title" ||
                    x.tagName == "SPAN" || x.tagName == "H1" || x.tagName == "H2" ||
                    x.tagName == "H3" || x.tagName == "H4" || x.tagName == "H5" ||
                    x.tagName == "BUTTON" || x.tagName == "LABEL") {
                    if (trl[text]) {
                        x.innerText = trl[text]
                        if (x.tagName == "title") x.innerHTML = trl[text]
                        x.setAttribute("data-translated", text)
                    }
                    if (trl[x.title]) {
                        x.title = trl[x.title]
                        x.setAttribute("data-translated2", x.title)
                    }
                }
            }
        })
    }

    changeLang(trl) {
        if (!trl) {
            Utils.newError("Translations in " + Utils.app.settings.gen_langs + " not found", "Language set to English.")
            trl = Translations.allTranslations["English"]
        }
        this.translateAll(trl)
    }

    end() {
        this.observer.disconnect()
        this.rootElement = null
        this.__proto__ = null
    }
}