import Import from "../import.js";
import infoPanel from "../../ui/components/infoPanel/infoPanel.js";
import AyMusic from "../AyMusic.js";

export default class Utils {
    static useLocalServer = true
    static servURL = ""
    static actualAccount =
        {
            name: "Unknown",
            id: "Unknown",
            email: "Unknown",
            avatarUrl: "/resources/noavatar.png"
        }

    static app = new AyMusic();

    static delay(ms) {
        return new Promise(resolve => setTimeout(() => resolve(), ms))
    }

    static createSVGPath(pathName, color, click, taille) {
        return new Promise((resolve) => {
            Import.getData("/resources/paths.json").then((data) => {
                let paths = JSON.parse(data)
                let path = paths[pathName]
                let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
                svg.setAttributeNS(null, "viewBox", "0 0 24 24")
                svg.setAttributeNS(null, "width", taille)
                svg.setAttributeNS(null, "height", taille)
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
}