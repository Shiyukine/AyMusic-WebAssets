import Utils from "../utils/utils.js";

export default class TimerHandler {
    static timers = -1

    static addTimer(time) {
        if (this.timers != -1) clearTimeout(this.timers)
        this.timers = setTimeout(() => {
            Utils.player.pause()
            this.clearTimers()
        }, time * 60 * 1000);
    }

    static clearTimers() {
        if (this.timers != -1) clearTimeout(this.timers)
        this.timers = -1
    }
}