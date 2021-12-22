import infoPanel from "./ui/components/infoPanel/infoPanel.js";
import AyMusic from "./class/AyMusic.js";
import Window from "./class/window.js";
import Update from "./class/update.js";
import Utils from "./class/utils/utils.js";
import loginPanel from "./ui/components/loginPanel/loginPanel.js";
import menuWindow from "./ui/windows/menu/menu.js";

async function main()
{
    document.body.ondragstart = () => { return false }
    /**
     * @type {AyMusic}
     */
    app = new AyMusic()
    app.loaded = async function ()
    {
        try
        {
            console.log("AyMusic client registered : " + app.platform);
            if (app.platform == "Windows")
            {
                Window.setTopBarWindow()
                Window.setDevToolLogger()
            }
            var loadPanel = new infoPanel(document.getElementById("main"), "Searching for updates...", "Please wait...", null, true)
            loadPanel.show()
            console.log("Getting server URL")
            if (!Utils.useLocalServer)
                Utils.servURL = await app.remoteClient.httpRequestGET("https://raw.githubusercontent.com/Shiyukine/Shiyukine/main/serv.txt")
            else
                Utils.servURL = "http://192.168.0.33/"
            console.log("Server URL : " + Utils.servURL)
            //
            Update.searchUpdate(loadPanel)
            await Utils.delay(2000)
            loadPanel.changeText("Connecting to your account...")
            var logP = new loginPanel(document.getElementById("main"), false)
            loadPanel.hide()
            logP.logged = async () =>
            {
                loadPanel.changeText("Getting your musics...")
                loadPanel.show()
                await Utils.delay(1000)
                loadPanel.close()
                let lp = document.getElementById("loadPanel")
                lp.children[0].classList.add("pauseSVG")
                let mainPanel = document.getElementById("main")
                mainPanel.removeChild(lp)
                document.body.classList.remove("loading")
                new menuWindow(mainPanel)
            }
        }
        catch (e)
        {
            Utils.newError("Unable to reach the server :(", e)
        }
    }
}

main()