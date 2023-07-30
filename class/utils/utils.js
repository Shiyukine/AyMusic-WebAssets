import Import from "../import.js";
import infoPanel from "../../ui/components/infoPanel/infoPanel.js";
import ApiManager from "../apiManager.js";
import LibraryManager from "../libraryManager.js";
import MenuWindow from "../../ui/windows/menu/menu.js";
import App from "../app.js";
import QueueManager from "../player/queueManager.js";
import Player from "../player/player.js";
import MusicViewerWindow from "../../ui/windows/musicViewer/musicViewer.js";

export default class Utils {
    static useLocalServer = true
    static servURL = ""
    static actualAccount =
        {
            name: "Unknown",
            id: "Unknown",
            email: "Unknown",
            avatarUrl: "/resources/noavatar.png",
            apiKey: "",
        }

    static app = new App();

    static apiManager = new ApiManager();
    static libManager = new LibraryManager();
    static queueManager = new QueueManager();
    static player = new Player();
    static pathsData = []

    /**
     * @type {MenuWindow}
     */
    static menu = null;

    /**
     * @type {MusicViewerWindow}
     */
    static musicViewer = null

    static delay(ms) {
        return new Promise(resolve => setTimeout(() => resolve(), ms))
    }

    static createSVGPath(pathName, color, click, size) {
        return new Promise((resolve) => {
            Import.getData("./resources/paths.json").then((data) => {
                let paths = JSON.parse(data)
                let path = paths[pathName]
                let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
                svg.setAttributeNS(null, "viewBox", "0 0 24 24")
                svg.setAttributeNS(null, "width", size)
                svg.setAttributeNS(null, "height", size)
                let sp = document.createElementNS("http://www.w3.org/2000/svg", "path")
                sp.setAttributeNS(null, "d", path)
                sp.setAttributeNS(null, "fill", color)
                svg.addEventListener("touchstart", click);
                svg.addEventListener("mousedown", click);
                svg.appendChild(sp)
                resolve(svg)
            })
        })
    }

    static async newError(info, subText) {
        console.error(info, "\n", subText)
        let errPanel = new infoPanel(info, subText, [{
            text: "OK", isPositive: true, onclick: () => {
                errPanel.close()
            }
        }], false)
        document.getElementById("main").appendChild(errPanel)
        await errPanel.showDialog()
    }

    static currentMiniErrorID = -1

    static async showMiniError(miniErrorID, info, temp = false, colorBg = "", colorText = "") {
        console.error(info)
        document.getElementById("miniInfoP").innerHTML = info
        document.getElementById("miniInfoP").style.color = colorText
        document.getElementById("miniInfo").style.backgroundColor = colorBg
        document.getElementById("miniInfo").classList.add("showInfo")
        document.getElementById("main").classList.add("infoShown")
        Utils.currentMiniErrorID = miniErrorID
        if (temp) {
            setTimeout(() => {
                Utils.hideMiniError(miniErrorID)
            }, 3000);
        }
    }

    static async hideMiniError(miniErrorID) {
        if (miniErrorID == Utils.currentMiniErrorID) {
            document.getElementById("miniInfo").classList.remove("showInfo")
            document.getElementById("main").classList.remove("infoShown")
            document.getElementById("miniInfoP").style.color = ""
            document.getElementById("miniInfo").style.backgroundColor = ""
        }
    }

    static msToTime(duration) {
        var milliseconds = Math.floor((duration % 1000) / 100),
            seconds = Math.floor((duration / 1000) % 60),
            minutes = Math.floor((duration / (1000 * 60)) % 60),
            hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

        hours = hours > 0 ? hours + ":" : "";
        minutes = (hours > 0 && minutes < 10 ? "0" + minutes : minutes) + ":";
        seconds = seconds < 10 ? "0" + seconds : seconds;

        return hours + minutes + seconds/* + "." + milliseconds*/;
    }

    static findIndexOfLike(node) {
        var children = Array.prototype.filter.call(node.parentNode.children, function (child) {
            return node.tagName === child.tagName;
        });
        return children.indexOf(node);

    }

    static createIndexedPathTo(node) {
        var path = [],
            current = node;
        while (current.tagName.toLowerCase() !== 'body') {
            path.push(current.tagName.toLowerCase() + '[' + Utils.findIndexOfLike(current) + ']');
            current = current.parentNode;
        }
        path.push('body[0]');
        return path.reverse().join('.');
    }
}