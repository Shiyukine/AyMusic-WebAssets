import Import from "../../../class/import.js";

export default class infoPanel extends HTMLDivElement
{
    /* jshint ignore:-E058 */
    /**
     * @type {HTMLElement}
     */
    #textEl = null;
    /**
     * @type {HTMLElement}
     */
    #subtextEl = null;
    /**
     * @type {HTMLElement}
     */
    #svg = null;
    /**
     * @type {HTMLElement}
     */
    #btnList = null;
    /**
     * @type {HTMLElement}
     */
    #progressBar = null;

    #loaded = false;

    textReturn = "";

    constructor(text, subtext = null, buttons = null, isloading = false)
    {
        super(text, subtext, buttons, isloading);
        var shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = Import.loadHTML("/ui/components/infoPanel/infoPanel.html")
        this.#textEl = shadow.getElementById("text");
        this.#subtextEl = shadow.getElementById("subtext");
        this.#svg = shadow.getElementById("svg");
        this.#btnList = shadow.getElementById("btnList");
        this.#progressBar = shadow.getElementById("progressBar");
        this.changeText(text, subtext);
        this.changeloading(isloading);
        if (buttons)
        {
            buttons.forEach(el =>
            {
                this.addButton(el.text, el.isPositive, el.onclick);
            });
        }
        this.shadowRoot.getElementById("cssImport").onload = () =>
        {
            this.shadowRoot.getElementById("panelInfoBG").ontransitionend = () => { };
            this.shadowRoot.getElementById("panelInfoBG").style = "";
            this.#loaded = true;
        }
    }

    show()
    {
        if (this.#loaded) this.shadowRoot.getElementById("cssImport").dispatchEvent(new CustomEvent("load"));
    }

    showDialog()
    {
        return new Promise(resolve =>
        {
            this.show();
            this.style.zIndex = "101";
            setInterval(() =>
            {
                if (this.textReturn != "")
                {
                    resolve(this.textReturn);
                    return;
                }
            }, 1);
        });
    }

    changeText(text, subtext)
    {
        if (text != null) this.#textEl.innerHTML = text;
        if (subtext != null) this.#subtextEl.innerHTML = subtext.toString().split("\n").join("<br>");
    }

    changeloading(newLoading = false)
    {
        if (typeof newLoading === 'number')
        {
            this.#progressBar.style.width = newLoading + "%";
            this.#svg.classList.remove("playSVG");
            this.#svg.parentElement.removeChild(this.#svg);
        }
        else
        {
            if (!newLoading)
            {
                this.#svg.classList.remove("playSVG");
                this.#svg.parentElement.removeChild(this.#svg);
            }
            else
            {
                this.#svg.classList.add("playSVG");
                this.shadowRoot.getElementById("panelInfo").insertBefore(this.shadowRoot.getElementById("panelInfo").firstChild, this.#svg);
            }
        }
        //todo
    }

    hide()
    {
        this.shadowRoot.getElementById("panelInfoBG").style.opacity = "0%";
    }

    close()
    {
        this.shadowRoot.getElementById("panelInfoBG").ontransitionend = () =>
        {
            this.shadowRoot.getRootNode().host.parentElement.removeChild(this);
        }
        this.shadowRoot.getElementById("panelInfoBG").style.opacity = "0%";
        //this.changeloading(false)
    }

    addButton(text, isPositive = true, onclick)
    {
        let btn = document.createElement("button");
        btn.innerText = text;
        if (!isPositive) btn.classList.add("negative");
        btn.addEventListener("click", () => this.textReturn = text);
        btn.addEventListener("click", onclick);
        this.#btnList.appendChild(btn);
    }
}