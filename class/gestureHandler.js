export default class GestureHandler {
    /**
     * @type {HTMLElement}
     */
    element = null;
    #eventEl = document.createElement("event");
    noTransition = false;
    curOverflowStyle = "";

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
            mv = e;
            element.style.transition = ""
            element.ontransitionend = () => { };
            isDown = true;
            console.log(mv)
        })
        var callbackMove = (e) => {
            element.parentElement.style.overflow = "hidden"
            if (isDown) {
                var currentY = e.touches ? e.touches[0].pageY : e.pageY;
                var currentX = e.touches ? e.touches[0].pageX : e.pageX;
                if (!isTopDown) {
                    let diff = mv.x - currentX
                    element.style.marginLeft = (diff * -1) + "px"
                    element.style.marginRight = diff + "px"
                }
                else {
                    let diff = mv.y - currentY
                    element.style.marginTop = (diff * -1) + "px"
                    element.style.marginBottom = diff + "px"
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
                if (diff > 100) {
                    this.#eventEl.dispatchEvent(new CustomEvent("right"));
                }
                if (diff < -100) {
                    this.#eventEl.dispatchEvent(new CustomEvent("left"));
                }
            }
            else {
                let diff = mv.y - currentY
                if (diff > 100) {
                    this.#eventEl.dispatchEvent(new CustomEvent("down"));
                }
                if (diff < -100) {
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
                if (this.noTransition) this.element.style.transition = "margin 0.01s"
                element.style.marginRight = element.style.marginLeft = element.style.marginTop = element.style.marginBottom = ""
                this.noTransition = false
            }
            element.style.transition = "margin .2s"
            if (!isTopDown) {
                let diff = mv.x - currentX
                if (diff > 100 && this.noTransition) diff += element.clientWidth
                else if (diff < -100 && this.noTransition) diff -= element.clientWidth
                else diff = 0
                element.style.marginLeft = (diff * -1) + "px"
                element.style.marginRight = diff + "px"
            }
            else {
                let diff = mv.y - currentY
                if (diff > 100 && this.noTransition) diff += element.clientHeight
                else if (diff < -100 && this.noTransition) diff -= element.clientHeight
                else diff = 0
                element.style.marginTop = (diff * -1) + "px"
                element.style.marginBottom = diff + "px"
            }
        }
        window.addEventListener("mouseup", callbackStop)
        window.addEventListener("touchend", callbackStop)
        element.addEventListener("mouseleave", callbackStop)
    }

    addEventListener(event, callback) {
        this.#eventEl.addEventListener(event, callback)
    }

    acceptGesture() {
        this.noTransition = true
    }
}