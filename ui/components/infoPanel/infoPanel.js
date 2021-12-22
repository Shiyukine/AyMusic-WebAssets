import Import from "../../../class/import.js";
import Utils from "../../../class/utils/utils.js";

export default class infoPanel
{
    /**
     * @type {HTMLDivElement}
     */
    #bg = document.createElement("div");
    /**
     * @type {HTMLElement}
     */
    #textEl = null
    /**
     * @type {HTMLElement}
     */
    #subtextEl = null
    /**
     * @type {HTMLElement}
     */
    #svg = null
    /**
     * @type {HTMLElement}
     */
    #btnList = null
    /**
     * @type {HTMLElement}
     */
    #progressBar = null

    #loaded = false;

    textReturn = "";

    constructor(parent, text, subtext = null, buttons = null, isloading = false)
    {
        this.#bg.innerHTML = Import.loadHTML("/ui/components/infoPanel/infoPanel.html")
        this.#bg.style.width = "100%"
        this.#bg.style.height = "100%"
        this.#bg.style.position = "absolute"
        this.parent = parent
        this.#textEl = this.#bg.getElementsByClassName("text")[0]
        this.#subtextEl = this.#bg.getElementsByClassName("subtext")[0]
        this.#svg = this.#bg.getElementsByClassName("svg")[0]
        this.#btnList = this.#bg.getElementsByClassName("btnList")[0]
        this.#progressBar = this.#bg.getElementsByClassName("progressBar")[0]
        this.changeText(text, subtext)
        this.changeloading(isloading)
        if (buttons)
        {
            buttons.forEach(el =>
            {
                this.addButton(el.text, el.isPositive, el.onclick)
            });
        }
        this.parent.appendChild(this.#bg)
        this.#bg.getElementsByClassName("cssImport")[0].onload = () =>
        {
            this.#bg.getElementsByClassName("panelInfoBG")[0].ontransitionend = (ev) => { };
            this.#bg.getElementsByClassName("panelInfoBG")[0].style = ""
            this.#loaded = true
        }
    }

    show()
    {
        if (this.#loaded) this.#bg.getElementsByClassName("cssImport")[0].dispatchEvent(new CustomEvent("load"))
    }

    showDialog()
    {
        return new Promise(resolve =>
        {
            this.show()
            this.#bg.style.zIndex = "101"
            setInterval(() =>
            {
                if (this.textReturn != "")
                {
                    resolve(this.textReturn)
                    return;
                }
            }, 1);
        })
    }

    changeText(text, subtext)
    {
        if (text != null) this.#textEl.innerHTML = text
        if (subtext != null) this.#subtextEl.innerHTML = subtext.toString().split("\n").join("<br>")
    }

    changeloading(newLoading = false)
    {
        if (typeof newLoading === 'number')
        {
            this.#progressBar.style.width = newLoading + "%"
            this.#svg.classList.remove("playSVG")
            this.#svg.parentElement.removeChild(this.#svg)
        }
        else
        {
            if (!newLoading)
            {
                this.#svg.classList.remove("playSVG")
                this.#svg.parentElement.removeChild(this.#svg)
            }
            else
            {
                this.#svg.classList.add("playSVG")
                this.#bg.getElementsByClassName("panelInfo")[0].insertBefore(this.#bg.getElementsByClassName("panelInfo")[0].firstChild, this.#svg)
            }
        }
        //todo
    }

    hide()
    {
        this.#bg.getElementsByClassName("panelInfoBG")[0].style.opacity = "0%"
    }

    close()
    {
        this.#bg.getElementsByClassName("panelInfoBG")[0].ontransitionend = (event) =>
        {
            this.parent.removeChild(this.#bg)
        }
        this.#bg.getElementsByClassName("panelInfoBG")[0].style.opacity = "0%"
        //this.changeloading(false)
    }

    addButton(text, isPositive = true, onclick)
    {
        let btn = document.createElement("button")
        btn.innerText = text
        if (!isPositive) btn.classList.add("negative")
        btn.addEventListener("click", () => this.textReturn = text)
        btn.addEventListener("click", onclick)
        this.#btnList.appendChild(btn)
    }
}