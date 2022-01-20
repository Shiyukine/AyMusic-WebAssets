import infoPanel from "./ui/components/infoPanel/infoPanel.js";
import Window from "./class/window.js";
import Update from "./class/update.js";
import Utils from "./class/utils/utils.js";
import loginPanel from "./ui/components/loginPanel/loginPanel.js";
import menuWindow from "./ui/windows/menu/menu.js";
import listenWindow from "./ui/windows/listen/listen.js";

async function main()
{
    window.app = Utils.app;
    document.body.ondragstart = () => { return false; };
    customElements.define('info-panel', infoPanel, { extends: "div" });
    customElements.define('login-panel', loginPanel, { extends: "div" });
    customElements.define("left-menu", menuWindow, { extends: "div" });
    customElements.define("listen-window", listenWindow, { extends: "div" });
    //
    Utils.app.loaded = async function ()
    {
        try
        {
            console.log("AyMusic client registered : " + Utils.app.platform);
            if (Utils.app.platform == "Windows")
            {
                Window.setTopBarWindow();
                Window.setDevToolLogger();
            }
            var loadPanel = new infoPanel("Searching for updates...", "Please wait...", null, true);
            document.getElementById("main").appendChild(loadPanel);
            loadPanel.style.width = loadPanel.style.height = "100%";
            loadPanel.style.position = "absolute";
            loadPanel.show();
            console.log("Getting server URL");
            if (!Utils.useLocalServer)
                Utils.servURL = await Utils.app.remoteClient.httpRequestGET("https://raw.githubusercontent.com/Shiyukine/Shiyukine/main/serv.txt");
            else
                Utils.servURL = "http://192.168.0.33/";
            console.log("Server URL : " + Utils.servURL);
            //
            Update.searchUpdate(loadPanel);
            await Utils.delay(2000);
            loadPanel.changeText("Connecting to your account...");
            var logP = new loginPanel(false);
            logP.style.width = logP.style.height = "100%";
            logP.style.position = "absolute";
            document.getElementById("main").appendChild(logP);
            loadPanel.hide();
            logP.logged = async () =>
            {
                loadPanel.changeText("Getting your musics...");
                loadPanel.show();
                await Utils.delay(1000);
                loadPanel.close();
                let lp = document.getElementById("loadPanel");
                lp.children[0].classList.add("pauseSVG");
                let mainPanel = document.getElementById("main");
                mainPanel.style.backgroundImage = "url(/resources/background.jpg)"
                mainPanel.removeChild(lp);
                document.body.classList.remove("loading");
                mainPanel.appendChild(new menuWindow());
                mainPanel.appendChild(new listenWindow())
            };
        }
        catch (e)
        {
            Utils.newError("Unable to reach the server :(", e);
        }
    };
}

main();