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
    alreadyScrolled = false;
    blockTop = false;
    blockBottom = false;
    blockLeft = false;
    blockRight = false;

    /**
     * 
     * @param {HTMLElement} element 
     */
    constructor(element, isTopDown, threshold = 50) {
        this.element = element
        var isDown = false;
        this.threshold = threshold;
        this.curOverflowStyle = element.parentElement ? element.parentElement.style.overflow : "";
        const ndiff = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? 20 : 4;
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
                this.alreadyScrolled = false;
            }
        })
        var callbackMove = (e) => {
            if (element.parentElement) {
                element.parentElement.style.overflow = "hidden"
            }
            if (isDown) {
                if (!this.alreadyScrolled && this.scrollBegin != (!isTopDown ? element.scrollTop : element.scrollLeft))
                    this.alreadyScrolled = true;
                //check all parents element to see if any of them is being controlled by gesture, if so, we will not move this element
                var parent = element.parentElement;
                while (parent) {
                    if (parent.beingControlledByGesture) {
                        this.alreadyScrolled = true;
                        break;
                    }
                    parent = parent.parentElement;
                }
                //check all children element to see if any of them is being controlled by gesture, if so, we will not move this element
                let checkChildren = (el) => {
                    for (var i = 0; i < el.children.length; i++) {
                        if (el.children[i].beingControlledByGesture) {
                            return true;
                        }
                        if (checkChildren(el.children[i])) {
                            return true;
                        }
                    }
                    return false;
                }
                if (checkChildren(element)) {
                    this.alreadyScrolled = true;
                }
                //
                var currentY = e.touches ? e.touches[0].pageY : e.pageY;
                var currentX = e.touches ? e.touches[0].pageX : e.pageX;
                if (!isTopDown) {
                    let diff = mv.x - currentX
                    if (!this.alreadyScrolled && ((diff > ndiff || diff < -ndiff) || this.movedOk)) {
                        if (this.blockLeft && diff < 0) return;
                        if (this.blockRight && diff > 0) return;
                        element.style.transform = "translateX(" + (diff * -1) + "px)"
                        this.movedOk = true;
                        element.beingControlledByGesture = true;
                    }
                }
                else {
                    let diff = mv.y - currentY
                    if (!this.alreadyScrolled && ((diff > ndiff || diff < -ndiff) || this.movedOk)) {
                        if (this.blockTop && diff < 0) return;
                        if (this.blockBottom && diff > 0) return;
                        element.style.transform = "translateY(" + (diff * -1) + "px)"
                        this.movedOk = true;
                        element.beingControlledByGesture = true;
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
            if (this.movedOk) {
                if (!isTopDown) {
                    let diff = mv.x - currentX
                    if (diff > this.threshold) {
                        this.#eventEl.dispatchEvent(new CustomEvent("left"));
                    }
                    if (diff < -this.threshold) {
                        this.#eventEl.dispatchEvent(new CustomEvent("right"));
                    }
                }
                else {
                    let diff = mv.y - currentY
                    if (diff > this.threshold) {
                        this.#eventEl.dispatchEvent(new CustomEvent("top"));
                    }
                    if (diff < -this.threshold) {
                        this.#eventEl.dispatchEvent(new CustomEvent("bottom"));
                    }
                }
                element.ontransitionend = () => {
                    let count = 1
                    element.ontransitionend = () => {
                        //this event is triggered 3 times here, so we want to handle the last of these event triggered
                        if (count == 3) {
                            if (element.parentElement) {
                                element.parentElement.style.overflow = this.curOverflowStyle;
                            }
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
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
            element.beingControlledByGesture = undefined;
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

    /**
     * @param {"top" | "bottom" | "left" | "right"} direction 
     */
    blockSwipeFrom(direction) {
        switch (direction) {
            case "top":
                this.blockTop = true;
                break;
            case "bottom":
                this.blockBottom = true;
                break;
            case "left":
                this.blockLeft = true;
                break;
            case "right":
                this.blockRight = true;
                break;
        }
    }

    /**
     * @param {"top" | "bottom" | "left" | "right"} direction 
     */
    dontBlockSwipeFrom(direction) {
        switch (direction) {
            case "top":
                this.blockTop = false;
                break;
            case "bottom":
                this.blockBottom = false;
                break;
            case "left":
                this.blockLeft = false;
                break;
            case "right":
                this.blockRight = false;
                break;
        }
    }
}