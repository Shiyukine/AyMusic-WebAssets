import Import from "./import.js";
import Utils from "./utils/utils.js";

export default class Translations
{
    allTranslations = "";

    /**
     * translate a group of elements
     * @param {HTMLElement} rootElement 
     */
    constructor(rootElement) {
        this.rootElement = rootElement
        Import.getData("/resources/translation.json").then((trls) => {
            try {
                if (trls)
                {
                    this.allTranslations = JSON.parse(trls)
                }
                else console.error("Unable to load translations file")
                let trl = this.allTranslations[Utils.app.settings.lang]
                this.changeLang(trl)
                let self = this
                var observer = new MutationObserver(function () {
                    self.translate(trl);
                });
                observer.observe(rootElement, {
                    childList: true,
                    subtree: true
                });
                Utils.app.addEventListener("langchanged", () => {
                    this.changeLang(this.allTranslations[Utils.app.settings.lang])
                })
            }
            catch (e) {
                Utils.newError("Unable to get translations", e)
            }
        });
    }

    translate(trl)
    {
        Array.from(this.rootElement.getElementsByTagName("*")).forEach(x =>
        {
            if (typeof x.dataset["translated"] == "undefined" || x.dataset["translated"] != x.innerText)
            {
                if (x.tagName == "P" || x.tagName == "SPAN" || x.tagName == "H1" || x.tagName == "H2" || x.tagName == "H3" || x.tagName == "H4" || x.tagName == "H5" || x.tagName == "BUTTON")
                {
                    if (trl[x.innerText])
                    {
                        x.innerText = trl[x.innerText]
                        x.setAttribute("data-translated", x.innerText)
                    }
                }
            }
        })
    }

    changeLang(trl)
    {
        if (!trl) {
            Utils.newError("Translations in " + Utils.app.settings.lang + " not found", "Language set to English.")
            trl = this.allTranslations["English"]
        }
        this.translate(trl)
        console.log("Translations complete")
    }
}