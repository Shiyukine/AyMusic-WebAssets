import Import from "../import.js";
import infoPanel from "../../ui/components/infoPanel/infoPanel.js";

export default class Utils
{
    static useLocalServer = true
    static servURL = ""
    static actualAccount =
        {
            name: "Unknown",
            avatarUrl: "/resources/noavatar.png"
        }

    static delay(ms)
    {
        return new Promise(resolve => setTimeout(() => resolve(), ms))
    }

    static createSVGPath(pathName, color, click, taille)
    {
        let paths = JSON.parse(Import.loadHTML("/resources/paths.json"))
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
        return svg
    }

    static async newError(info, subText)
    {
        console.error(info, "\n", subText)
        let errPanel = new infoPanel(info, subText, [{
            text: "OK", isPositive: true, onclick: () =>
            {
                errPanel.close()
            }
        }], false)
        document.getElementById("main").appendChild(errPanel)
        await errPanel.showDialog()
    }
}