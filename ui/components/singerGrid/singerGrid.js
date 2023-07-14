import Import from "../../../class/import.js";
import Singer from "../../../class/music/singer.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";

export default class SingerGrid extends HTMLDivElement {

    /**
     * @type {Singer}
     */
    singer = null;


    /**
     * 
     * @param {Singer} singer 
     */
    constructor(singer) {
        super();
        this.singer = singer
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/singerGrid/singerGrid" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            //new Translations(shadow.children[1])
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                this.shadowRoot.getElementById("title").innerText = this.singer.name
                this.shadowRoot.getElementById("img").style.backgroundImage = "url('" + this.singer.imgUrl + "')"
                this.addEventListener("mouseover", function () {
                    this.shadowRoot.getElementById("img").style.transform = "scale(1.1)"
                    this.shadowRoot.getElementById("cache").style.opacity = "1"
                });
                this.addEventListener("mouseout", function () {
                    this.shadowRoot.getElementById("img").style.transform = "scale(1)"
                    if ("si_" + singer.id != Utils.queueManager.currentObject.id) this.shadowRoot.getElementById("cache").style.opacity = "0"
                });
                this.addEventListener("click", function () {
                    if (!this.shadowRoot.getElementById("svg").matches(':hover')) Utils.musicViewer.changeView("si_" + singer.id)
                });
                Utils.player.onSongChange(async () => {
                    let isPlay = Utils.queueManager.currentObject != null && "si_" + singer.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                    shadow.getElementById("svg").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                    this.shadowRoot.getElementById("cache").style.opacity = Utils.queueManager.currentObject != null && "si_" + singer.id == Utils.queueManager.currentObject.id ? "1" : "0"
                })
                Utils.player.onPlay(async () => {
                    let isPlay = Utils.queueManager.currentObject != null && "si_" + singer.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                    shadow.getElementById("svg").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                    this.shadowRoot.getElementById("cache").style.opacity = Utils.queueManager.currentObject != null && "si_" + singer.id == Utils.queueManager.currentObject.id ? "1" : "0"
                })
                Utils.player.onPause(async () => {
                    let isPlay = Utils.queueManager.currentObject != null && "si_" + singer.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                    shadow.getElementById("svg").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                    this.shadowRoot.getElementById("cache").style.opacity = Utils.queueManager.currentObject != null && "si_" + singer.id == Utils.queueManager.currentObject.id ? "1" : "0"
                })
                shadow.getElementById("svg").addEventListener("click", async () => {
                    if (Utils.queueManager.currentObject != null && "si_" + singer.id == Utils.queueManager.currentObject.id) {
                        if (await Utils.player.getState()) Utils.player.pause()
                        else Utils.player.play()
                    }
                    else {
                        Utils.queueManager.changeQueue(singer)
                    }
                })
                let isPlay = Utils.queueManager.currentObject != null && "si_" + singer.id == Utils.queueManager.currentObject.id && await Utils.player.getState()
                shadow.getElementById("svg").children[0].setAttribute("d", Utils.pathsData[isPlay ? "Pause" : "Play"])
                this.shadowRoot.getElementById("cache").style.opacity = Utils.queueManager.currentObject != null && "si_" + singer.id == Utils.queueManager.currentObject.id ? "1" : "0"
                new ThemeColor(shadow.children[1])
            }
        })
    }
}