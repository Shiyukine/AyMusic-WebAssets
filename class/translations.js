async function initTranslate()
{
    try
    {
        if (!allTranslations) allTranslations = await getData("app/data/translation.json");
        if (!allTranslations) console.error("Unable to load translations file")
        let trl = allTranslations[window.localStorage.getItem("gen_langs")]
        if (!trl)
        {
            showError("Translations " + window.localStorage.getItem("gen_langs") + " not found", "We have not translated Anime Hub into " + window.localStorage.getItem("gen_langs") + ".")
            trl = allTranslations["English"]
        }
        var cb = document.getElementById("settings").getElementsByClassName("view")[0].querySelectorAll("select")[0]
        allTranslations["Available"].forEach(y => 
        {
            var l = document.createElement("option")
            l.name = y
            l.innerText = y
            cb.appendChild(l)
        })
        translate(trl)
        var observer = new MutationObserver(function (mutations)
        {
            translate(trl);
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log("Translations complete")
    }
    catch (e)
    {
        showError("Unable to get translations", e)
    }
}

function translate(trl)
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