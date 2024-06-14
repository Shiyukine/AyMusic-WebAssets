import Utils from "./utils/utils.js";

export default class GestureHandler {
    /**
     * @type {HTMLElement}
     */
    element = null;
    #eventEl = document.createElement("event");
    noTransition = false;
    movedOk = false;
    curOverflowStyle = "";
    scrollBegin = 0;
    threshold = 50;

    /**
     * 
     * @param {HTMLElement} element 
     */
    constructor(element, isTopDown) {
        this.element = element
        var isDown = false;
        this.curOverflowStyle = element.parentElement.style.overflow;
        /**
         * @type {PointerEvent}
         */
        var mv = null;
        element.addEventListener("pointerdown", (e) => {
            if (e.button == 0) {
                mv = e;
                element.style.transition = ""
                element.ontransitionend = () => { };
                isDown = true;
                this.movedOk = false;
                this.scrollBegin = (!isTopDown ? element.scrollTop : element.scrollLeft);
            }
        })
        var callbackMove = (e) => {
            let ndiff = 4
            if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") ndiff = 20
            element.parentElement.style.overflow = "hidden"
            if (isDown) {
                var currentY = e.touches ? e.touches[0].pageY : e.pageY;
                var currentX = e.touches ? e.touches[0].pageX : e.pageX;
                if (!isTopDown) {
                    let diff = mv.x - currentX
                    if (this.scrollBegin == (!isTopDown ? element.scrollTop : element.scrollLeft) && ((diff > ndiff || diff < -ndiff) || this.movedOk)) {
                        element.style.transform = "translateX(" + (diff * -1) + "px)"
                        this.movedOk = true;
                    }
                }
                else {
                    let diff = mv.y - currentY
                    if (this.scrollBegin == (!isTopDown ? element.scrollTop : element.scrollLeft) && ((diff > ndiff || diff < -ndiff) || this.movedOk)) {
                        element.style.transform = "translateY(" + (diff * -1) + "px)"
                        this.movedOk = true;
                    }
                }
            }
        }
        window.addEventListener("pointermove", callbackMove)
        window.addEventListener("touchmove", callbackMove)
        /**
         * 
         * @param {PointerEvent} e 
         */
        var callbackStop = (e) => {
            if (!isDown) return;
            isDown = false;
            var currentY = e.changedTouches ? e.changedTouches[0].pageY : e.pageY;
            var currentX = e.changedTouches ? e.changedTouches[0].pageX : e.pageX;
            if (!isTopDown) {
                let diff = mv.x - currentX
                if (diff > this.threshold) {
                    this.#eventEl.dispatchEvent(new CustomEvent("right"));
                }
                if (diff < -this.threshold) {
                    this.#eventEl.dispatchEvent(new CustomEvent("left"));
                }
            }
            else {
                let diff = mv.y - currentY
                if (diff > this.threshold) {
                    this.#eventEl.dispatchEvent(new CustomEvent("down"));
                }
                if (diff < -this.threshold) {
                    this.#eventEl.dispatchEvent(new CustomEvent("top"));
                }
            }
            element.ontransitionend = () => {
                let count = 1
                element.ontransitionend = () => {
                    //this event is triggered 3 times here, so we want to handle the last of these event triggered
                    if (count == 3) {
                        element.parentElement.style.overflow = this.curOverflowStyle;
                    }
                    count += 1
                }
                if (this.noTransition) this.element.style.transition = "transform 0.0000001s"
                element.style.transform = ""
                this.noTransition = false
            }
            element.style.transition = "transform .2s"
            if (!isTopDown) {
                let diff = mv.x - currentX
                if (diff > this.threshold && this.noTransition) diff += element.clientWidth
                else if (diff < -this.threshold && this.noTransition) diff -= element.clientWidth
                else diff = 0
                element.style.transform = "translateX(" + (diff * -1) + "px)"
            }
            else {
                let diff = mv.y - currentY
                if (diff > this.threshold && this.noTransition) diff += element.clientHeight
                else if (diff < -this.threshold && this.noTransition) diff -= element.clientHeight
                else diff = 0
                element.style.transform = "translateY(" + (diff * -1) + "px)"
            }
            if (this.movedOk) {
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }
        element.addEventListener("click", callbackStop, true)
        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") element.addEventListener("touchend", callbackStop, true)
        else window.addEventListener("pointerup", callbackStop, true)
        element.addEventListener("mouseleave", callbackStop, true)
    }

    addEventListener(event, callback) {
        this.#eventEl.addEventListener(event, callback)
    }

    acceptGesture() {
        this.noTransition = true
    }
}