import Import from "./import.js";
import Utils from "./utils/utils.js";

export default class Translations
{
    allTranslations = "";

    static async initTranslate()
    {
        try
        {
            if (!this.allTranslations) this.allTranslations = await Import.getData("/resources/translation.json");
            if (!this.allTranslations) console.error("Unable to load translations file")
            let trl = this.allTranslations[Utils.app.settings.lang]
            if (!trl)
            {
                Utils.newError("Translations in " + Utils.app.settings.lang + " not found", "Language set to English.")
                trl = this.allTranslations["English"]
            }
            var cb = document.getElementById("settings").getElementsByClassName("view")[0].querySelectorAll("select")[0]
            this.allTranslations["Available"].forEach(y => 
            {
                var l = document.createElement("option")
                l.name = y
                l.innerText = y
                cb.appendChild(l)
            })
            this.translate(trl)
            var observer = new MutationObserver(function ()
            {
                this.translate(trl);
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            console.log("Translations complete")
        }
        catch (e)
        {
            Utils.newError("Unable to get translations", e)
        }
    }

    translate(trl)
    {
        Array.from(document.getElementsByTagName("*")).forEach(x =>
        {
            if (typeof x.dataset["translated"] == "undefined" || x.dataset["translated"] != x.innerText)
            {
                if (x.tagName == "P" || x.tagName == "H1" || x.tagName == "H2" || x.tagName == "H3" || x.tagName == "H4" || x.tagName == "H5" || x.tagName == "BUTTON")
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
}