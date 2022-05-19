import Utils from "./utils/utils.js";

export default class Window {
    static async setTopBarWindow() {
        var topbar = document.createElement("div")
        var appName = document.createElement("p")
        appName.innerText = "AyMusic"
        appName.classList.add("center")
        topbar.appendChild(appName)
        var icon = document.createElement("img")
        icon.src = "/resources/icon.ico"
        icon.classList.add("left")
        topbar.appendChild(icon)
        var mvmt = document.createElement("div")
        mvmt.addEventListener("pointerdown", async function () {
            await Utils.app.remoteClient.beginMoveWindow()
        })
        mvmt.classList.add("mvmt")
        topbar.appendChild(mvmt)
        topbar.classList.add("windowTopBar")
        var wclose = document.createElement("img")
        wclose.addEventListener("click", () => Utils.app.remoteClient.closeWindow());
        wclose.src = "/resources/wclose.png"
        var wchange = document.createElement("img")
        wchange.src = "/resources/wchange.png"
        wchange.addEventListener("click", async () => {
            var ws = await Utils.app.remoteClient.getWindowState()
            if (ws == 0) {
                Utils.app.remoteClient.maxWindow()
            }
            else {
                Utils.app.remoteClient.normalWindow()
            }
        });
        var wmin = document.createElement("img")
        wmin.src = "/resources/wmin.png"
        wmin.addEventListener("click", () => Utils.app.remoteClient.hideWindow());
        topbar.appendChild(wclose)
        topbar.appendChild(wchange)
        topbar.appendChild(wmin)
        var back = await Utils.createSVGPath("Back", "white", () => history.back(), 29)
        var forward = await Utils.createSVGPath("Forward", "white", () => history.forward(), 29)
        back.classList.add("left")
        forward.classList.add("left")
        topbar.appendChild(back)
        topbar.appendChild(forward)
        document.body.insertBefore(topbar, document.body.firstChild)
        document.getElementById("main").style.height = "calc(100% - 35px)"
        Utils.app.addForwardTouch(icon, async function () {
            await Utils.app.remoteClient.beginMoveWindow()
        })
    }

    static setDevToolLogger() {
        let debugK = []
        window.addEventListener("keydown", async function (key) {
            debugK.push(key.code)
            if ((debugK.includes("ControlLeft") || debugK.includes("ControlRight")) && (debugK.includes("ShiftLeft") || debugK.includes("ShiftRight")) && debugK.includes("KeyI")) {
                await Utils.app.remoteClient.showDevTool()
                debugK = []
            }
            if ((debugK.includes("ControlLeft") || debugK.includes("ControlRight")) && debugK.includes("KeyR")) {
                await Utils.app.remoteClient.refreshApp()
            }
        })

        window.addEventListener("keyup", function () {
            debugK = []
        })
    }
}