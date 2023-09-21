import Utils from "./utils/utils.js";

export default class OverscrollHandler {
    /**
     * @type {HTMLElement}
     */
    element = null;
    #eventEl = document.createElement("event");
    noTransition = false;
    movedOk = false;
    currentOverscroll = 0;
    firstEl = false;

    /**
     * 
     * @param {HTMLElement} element 
     */
    constructor(element) {
        this.element = element
        element.addEventListener("wheel", (e) => {
            if (!this.firstEl || this.firstEl != element.firstElementChild) {
                this.firstEl = element.firstElementChild
                element.firstElementChild.addEventListener("transitionend", () => {
                    if (element.firstElementChild.style.marginTop != "" && element.firstElementChild.style.transition != "") {
                        element.firstElementChild.style.marginTop = ""
                    }
                    else {
                        element.firstElementChild.style.transition = ""
                        this.currentOverscroll = 0
                    }
                })
            }
            if (e.deltaY < 0 && element.scrollTop == 0) {
                if (this.currentOverscroll < 100) {
                    this.currentOverscroll -= e.deltaY
                }
                element.firstElementChild.style.transition = "margin .25s"
                element.firstElementChild.style.marginTop = this.currentOverscroll + "px"
            }
        })
    }

    addEventListener(event, callback) {
        this.#eventEl.addEventListener(event, callback)
    }
}