import Window from "./class/window.js";
import Update from "./class/update.js";
import Utils from "./class/utils/utils.js";
import InfoPanel from "./ui/components/infoPanel/infoPanel.js";
import LoginPanel from "./ui/components/loginPanel/loginPanel.js";
import MenuWindow from "./ui/windows/menu/menu.js";
import ListenWindow from "./ui/windows/listen/listen.js";
import Translations from "./class/translations.js";
import Import from "./class/import.js";
import LocalMusicHandler from "./class/utils/localMusicHandler.js";

async function main() {
    window.app = Utils.app;
    document.body.ondragstart = () => { return false; };
    Import.loadCustomElements()
    //
    Utils.app.loaded = async function () {
        try {
            console.log("AyMusic client registered : " + Utils.app.platform + ", version : " + Utils.app.versionName + " (" + Utils.app.versionId + ")");
            if (Utils.app.platform == "Windows") {
                Window.setTopBarWindow();
                Window.setDevToolLogger();
            }
            new Translations(document.body)
            document.getElementById("version_name").innerText = Utils.app.versionName + " (" + Utils.app.versionId + ")"
            var loadPanel = new InfoPanel("Searching for updates...", "Please wait...", null, true);
            document.getElementById("main").appendChild(loadPanel);
            loadPanel.style.width = loadPanel.style.height = "100%";
            loadPanel.style.position = "absolute";
            loadPanel.show();
            console.log("Getting server URL");
            if (!Utils.useLocalServer)
                Utils.servURL = (await Utils.app.remoteClient.httpRequestGET("https://raw.githubusercontent.com/Shiyukine/Shiyukine/main/serv.txt")).replace("\n", "");
            else
                Utils.servURL = "https://192.168.0.33/";
            await Utils.app.remoteClient.changeServURL(Utils.servURL)
            console.log("Server URL : " + Utils.servURL);
            //
            LocalMusicHandler.init()
            await LocalMusicHandler.getLocalLibrary()
            //
            Update.searchUpdate(loadPanel);
            await Utils.delay(1000);
            loadPanel.changeText("Connecting to your account...");
            var logP = new LoginPanel("");
            logP.style.width = logP.style.height = "100%";
            logP.style.position = "absolute";
            document.getElementById("main").appendChild(logP);
            loadPanel.hide();
            logP.logged = async () => {
                loadPanel.changeText("Getting your playlists...");
                loadPanel.show();
                await Utils.libManager.refreshUserInfo()
                loadPanel.close();
                let lp = document.getElementById("loadPanel");
                lp.children[0].classList.add("pauseSVG");
                let mainPanel = document.getElementById("main");
                document.body.style.backgroundImage = "url(/resources/background.jpg)"
                document.getElementsByClassName("windowTopBar")[0].classList.add("loaded")
                mainPanel.removeChild(lp);
                document.body.classList.remove("loading");
                let menuWin = new MenuWindow()
                Utils.menu = menuWin
                mainPanel.appendChild(menuWin);
                mainPanel.appendChild(new ListenWindow())
            };
        }
        catch (e) {
            Utils.newError("Unable to reach the server :(", e);
        }
    };
}

main();