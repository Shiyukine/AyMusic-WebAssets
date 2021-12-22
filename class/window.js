import Utils from "./utils/utils.js";

export default class Window
{
    static setTopBarWindow()
    {
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
        mvmt.addEventListener("mousedown", async function (mouse)
        {
            await app.remoteClient.beginMoveWindow()
        })
        mvmt.classList.add("mvmt")
        topbar.appendChild(mvmt)
        topbar.classList.add("windowTopBar")
        var wclose = document.createElement("img")
        wclose.addEventListener("click", () => app.remoteClient.closeWindow());
        wclose.src = "/resources/wclose.png"
        var wchange = document.createElement("img")
        wchange.src = "/resources/wchange.png"
        wchange.addEventListener("click", async () =>
        {
            var ws = await app.remoteClient.getWindowState()
            if (ws == 0)
            {
                app.remoteClient.maxWindow()
            }
            else
            {
                app.remoteClient.normalWindow()
            }
        });
        var wmin = document.createElement("img")
        wmin.src = "/resources/wmin.png"
        wmin.addEventListener("click", () => app.remoteClient.hideWindow());
        topbar.appendChild(wclose)
        topbar.appendChild(wchange)
        topbar.appendChild(wmin)
        var back = Utils.createSVGPath("Back", "white", () => history.back(), 29)
        var forward = Utils.createSVGPath("Forward", "white", () => history.forward(), 29)
        back.classList.add("left")
        forward.classList.add("left")
        topbar.appendChild(back)
        topbar.appendChild(forward)
        document.body.insertBefore(topbar, document.body.firstChild)
        document.getElementById("main").style.height = "calc(100% - 35px)"
    }

    static setDevToolLogger()
    {
        let debugK = []
        window.addEventListener("keydown", async function (key)
        {
            debugK.push(key.code)
            if ((debugK.includes("ControlLeft") || debugK.includes("ControlRight")) && (debugK.includes("ShiftLeft") || debugK.includes("ShiftRight")) && debugK.includes("KeyI"))
            {
                await app.remoteClient.showDevTool()
                debugK = []
            }
            if ((debugK.includes("ControlLeft") || debugK.includes("ControlRight")) && debugK.includes("KeyR"))
            {
                await app.remoteClient.refreshApp()
            }
        })

        window.addEventListener("keyup", function (key)
        {
            debugK = []
        })
    }
}