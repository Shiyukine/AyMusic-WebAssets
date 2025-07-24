import ThemeColor from "./themeColor.js";
import Utils from "./utils/utils.js";

export default class Window {
    static async setTopBarWindow() {
        Utils.app.addEventListener("maximize", () => {
            Utils.app.changeSetting("other_maximize", true)
        })
        Utils.app.addEventListener("unmaximize", () => {
            Utils.app.changeSetting("other_maximize", false)
        })
        var topbar = document.createElement("div")
        topbar.classList.add("windowTopBar")
        if (Utils.app.platform == "Windows") {
            topbar.classList.add("colorTopBar")
            var icon = document.createElement("img")
            icon.src = "/resources/icon.ico"
            icon.classList.add("left")
            topbar.appendChild(icon)
            var mvmt = document.createElement("div")
            /*mvmt.addEventListener("pointerdown", async function (e) {
                if (e.button == 0) await Utils.app.remoteClient.beginMoveWindow()
            })
            mvmt.addEventListener("pointerup", async function (e) {
                if (e.button == 2) await Utils.app.remoteClient.rightClickWindow()
            })*/
            mvmt.classList.add("mvmt")
            mvmt.id = "win_mvmt"
            topbar.appendChild(mvmt)
            var wclose = document.createElement("img")
            wclose.addEventListener("click", () => Utils.app.remoteClient.closeWindow());
            wclose.src = "/resources/wclose.png"
            wclose.classList.add("clickable")
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
            wchange.classList.add("clickable")
            var wmin = document.createElement("img")
            wmin.src = "/resources/wmin.png"
            wmin.addEventListener("click", () => Utils.app.remoteClient.hideWindow());
            wmin.classList.add("clickable")
            topbar.appendChild(wclose)
            topbar.appendChild(wchange)
            topbar.appendChild(wmin)
        }
        if (Utils.app.platform == "MacOS") {
            topbar.classList.add("colorTopBar")
            topbar.classList.add("macOS")
            var mvmt = document.createElement("div")
            /*mvmt.addEventListener("pointerdown", async function (e) {
                if (e.button == 0) await Utils.app.remoteClient.beginMoveWindow()
            })
            mvmt.addEventListener("pointerup", async function (e) {
                if (e.button == 2) await Utils.app.remoteClient.rightClickWindow()
            })*/
            mvmt.classList.add("mvmt")
            mvmt.id = "win_mvmt"
            topbar.appendChild(mvmt)
        }
        var back = await Utils.createSVGPath("Back", "white", () => history.back(), Utils.app.platform == "MacOS" ? 28 : 29)
        var forward = await Utils.createSVGPath("Forward", "white", () => history.forward(), Utils.app.platform == "MacOS" ? 28 : 29)
        back.classList.add("left")
        back.classList.add("clickable")
        forward.classList.add("left")
        forward.classList.add("clickable")
        topbar.appendChild(back)
        topbar.appendChild(forward)
        if (Utils.app.platform == "Windows" || Utils.app.platform == "MacOS") {
            var appName = document.createElement("p")
            appName.innerText = ""
            appName.id = "curPageName"
            appName.classList.add("left")
            topbar.appendChild(appName)
        }
        if(Utils.app.platform == "MacOS") {
            back.style.marginLeft = "80px"
        }
        document.body.appendChild(topbar)
        new ThemeColor(topbar)
    }

    static setResizeBarsWindow() {
        let height = Math.max(document.body.scrollHeight, document.body.offsetHeight,
            document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
        let width = Math.max(document.body.scrollWidth, document.body.offsetWidth,
            document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth);
        let b = (height + 2 == screen.height && width == screen.width) ||
            (height == screen.height && width + 2 == screen.width)
        let resizeDir = -1
        for (let i = 0; i < 4; i++) {
            let div = document.createElement("div")
            div.classList.add("resizeBar")
            div.id = "bar" + i
            document.body.appendChild(div)
            const MAX_SIZE = 5
            div.onpointermove = (e) => {
                if (i == 0) {
                    if (e.y <= MAX_SIZE)
                        resizeDir = 13;
                    else if (e.y >= div.offsetHeight - MAX_SIZE) resizeDir = 16;
                    else resizeDir = 10;
                }
                if (i == 1) {
                    if (e.y <= MAX_SIZE)
                        resizeDir = 14;
                    else if (e.y >= div.offsetHeight - MAX_SIZE) resizeDir = 17;
                    else resizeDir = 11;
                }
                if (i == 2) {
                    if (e.x <= MAX_SIZE)
                        resizeDir = 13;
                    else if (e.x >= div.offsetWidth - MAX_SIZE) resizeDir = 14;
                    else resizeDir = 12;
                }
                if (i == 3) {
                    if (e.x <= MAX_SIZE)
                        resizeDir = 16;
                    else if (e.x >= div.offsetWidth - MAX_SIZE) resizeDir = 17;
                    else resizeDir = 15;
                }
                div.style.cursor = this.getCur(resizeDir);
            }
            div.onpointerdown = async () => {
                await Utils.app.remoteClient.beginResizeWindow(resizeDir)
            }
            if (b) div.classList.add("barMaximized")
        }
        window.addEventListener("resize", () => {
            let height = Math.max(document.body.scrollHeight, document.body.offsetHeight,
                document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
            let width = Math.max(document.body.scrollWidth, document.body.offsetWidth,
                document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth);
            let b = (height + 2 == screen.height && width == screen.width) ||
                (height == screen.height && width + 2 == screen.width)
            if (b) {
                document.getElementById("bar0").classList.add("barMaximized")
                document.getElementById("bar1").classList.add("barMaximized")
                document.getElementById("bar2").classList.add("barMaximized")
                document.getElementById("bar3").classList.add("barMaximized")
            }
            else {
                document.getElementById("bar0").classList.remove("barMaximized")
                document.getElementById("bar1").classList.remove("barMaximized")
                document.getElementById("bar2").classList.remove("barMaximized")
                document.getElementById("bar3").classList.remove("barMaximized")
            }
        })
    }

    static getCur(resizeDir) {
        if (resizeDir == 10) return "ew-resize"
        if (resizeDir == 11) return "ew-resize"
        if (resizeDir == 12) return "ns-resize"
        if (resizeDir == 13) return "nwse-resize"
        if (resizeDir == 14) return "nesw-resize"
        if (resizeDir == 15) return "ns-resize"
        if (resizeDir == 16) return "nesw-resize"
        if (resizeDir == 17) return "nwse-resize"
    }

    static setDevToolLogger() {
        let debugK = []
        window.addEventListener("keydown", async function (key) {
            debugK.push(key.code)
            if ((debugK.includes("ControlLeft") || debugK.includes("ControlRight")) && (debugK.includes("ShiftLeft") || debugK.includes("ShiftRight")) && debugK.includes("KeyI")) {
                //await Utils.app.remoteClient.showDevTool()
                debugK = []
            }
            if ((debugK.includes("ControlLeft") || debugK.includes("ControlRight")) && debugK.includes("KeyR")) {
                //await Utils.app.remoteClient.refreshApp()
            }
        })

        window.addEventListener("keyup", function () {
            debugK = []
        })
    }
}