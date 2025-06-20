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
import ThemeColor from "./class/themeColor.js";
import MusicViewerWindow from "./ui/windows/musicViewer/musicViewer.js";
import TaskHandler from "./class/taskHandler.js";

async function main() {
    window.app = Utils.app;
    window.newError = Utils.newError;
    document.getElementById("main").ondragstart = () => { return false; };
    Import.loadCustomElements()
    Utils.pathsData = JSON.parse(await Import.getData("./resources/paths.json"))
    //
    window.listeners.changeDocumentVisibility = (visi) => {
        window.documentVisible = visi
        if (visi) {
            document.documentElement.style.display = ""
            document.documentElement.style.visibility = ""
        }
        else {
            document.documentElement.style.display = "none"
            document.documentElement.style.visibility = "collapse"
        }
        TaskHandler.executeJs(Utils.player.currentUrl, "() => { changeDocumentVisibility(" + visi + ");}")
    }
    Utils.app.loaded = async function () {
        if (!window.loaded) {
            window.loaded = true;
            try {
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                });
                if (registration.installing) {
                    console.log("Service worker installing");
                } else if (registration.waiting) {
                    console.log("Service worker installed");
                } else if (registration.active) {
                    console.log("Service worker active");
                }
            } catch (error) {
                console.error(`Registration failed with ${error}`);
            }
            try {
                console.log("AyMusic client registered: " + Utils.app.platform + ", version: " + Utils.app.versionName + " (" + Utils.app.versionId + "), isRelease: " + Utils.app.isRelease);
                if (Utils.app.platform == "Windows" || Utils.app.platform == "Linux" || Utils.app.platform == "MacOS") {
                    Window.setTopBarWindow();
                    Window.setDevToolLogger();
                }
                if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") {
                    document.getElementById("main_style").href = "/main_mobile.css";
                }
                await Translations.init()
                this.translation = new Translations(document.body)
                new ThemeColor(document.body)
                window.addEventListener("popstate", (e) => {
                    if (!e.state) {
                        console.warn("No state in popstate event!")
                        history.forward()
                    }
                })
                if (window.forceRestart && Utils.app.isRelease) {
                    let info = new InfoPanel("Warning after updating app", "The new version is installed! But there is a problem.\n"
                        + "For your security, please manually restart AyMusic.\n"
                        + "Please see https://github.com/castlabs/electron-releases/issues/165\nfor more information.", [{
                            text: "Close app", isPositive: true, onclick: () => {
                                Utils.app.remoteClient.closeWindow()
                            }
                        }], false);
                    document.getElementById("main").appendChild(info)
                    await info.showDialog()
                }
                var loadPanel = new InfoPanel("Searching for updates...", "Please wait...", null, true);
                loadPanel.style.width = loadPanel.style.height = "100%";
                loadPanel.style.position = "absolute";
                //loadPanel.show();
                console.log("Getting server URL");
                Utils.realServURL = (await Utils.app.httpRequestGET("https://raw.githubusercontent.com/Shiyukine/Shiyukine/main/serv.txt")).replace("\n", "");
                if (Utils.app.isRelease)
                    Utils.servURL = Utils.realServURL;
                else
                    Utils.servURL = "https://192.168.0.33/";
                await Utils.app.remoteClient.changeServURL(Utils.servURL)
                console.log("Server URL: " + Utils.servURL);
                navigator.serviceWorker.ready.then((registration) => {
                    navigator.serviceWorker.controller.postMessage({
                        action: "excludeResource",
                        url: Utils.servURL + "dl/",
                        includes: true,
                    });
                    navigator.serviceWorker.controller.postMessage({
                        action: "excludeResource",
                        url: Utils.servURL + "api/",
                        includes: true,
                    });
                });
                //
                LocalMusicHandler.init()
                await LocalMusicHandler.getLocalLibrary()
                //
                await Utils.apiManager.init()
                //
                //await Adblock.init()
                //
                Update.searchUpdate(loadPanel);
                //loadPanel.changeText("Connecting to your account...", "Please wait...");
                //loadPanel.changeloading(true)
                //
                // add all consent links here
                Utils.app.remoteClient.registerIframeUrl("https://consent.google.com/", `setInterval(() => document.getElementsByClassName("saveButtonContainer")[0].children[0].submit(), 100)`)
                if (Utils.app.platform == "Windows") {
                    Utils.app.remoteClient.registerIframeUrl("https://consent.youtube.com/", `setInterval(() => document.querySelectorAll("form")[1].submit(), 100)`)
                }
                else if (Utils.app.platform == "Android") {
                    Utils.app.remoteClient.registerIframeUrl("https://consent.youtube.com/", `let alrE = false; setInterval(async () => { 
                        if(alrE) return
                        let data = {}
                        let dataStr = ""
                        document.querySelectorAll("form")[1].querySelectorAll("input").forEach(x => {
                            data[x.name] = x.value
                            dataStr += x.name + "=" + x.value + "&"
                        })
                        dataStr = dataStr.slice(0, -1)
                        if(data["continue"]) alrE = true
                        if(${Utils.app.platform == "Android"}) boundobject.addInterceptAllWebRequest("https://consent.youtube.com/save")
                        if(${Utils.app.platform == "Android"}) boundobject.addInterceptAllWebRequest("https://consent.youtube.com/")
                        console.log(window.boundobject.httpRequestPOST("https://consent.youtube.com/save", dataStr, "application/x-www-form-urlencoded"))
                        location.href = data["continue"]
                    }, 100)`)
                    //for ping only
                    Utils.app.remoteClient.addInterceptAllWebRequest("https://google.com/")
                    //Spotify account authorization
                    Utils.app.remoteClient.addInterceptAllWebRequest("https://accounts.spotify.com/authorize", true)
                }
                //
                var cb = async () => {
                    if (Utils.app.platform == "Android") {
                        Utils.app.remoteClient.syncCookies()
                    }
                    loadPanel.changeText("Getting your playlists...");
                    Utils.libManager.refreshUserInfo(() => {
                        let lp = document.getElementById("loadPanel");
                        lp.children[0].classList.add("pauseSVG");
                        let mainPanel = document.getElementById("main");
                        if (Utils.app.platform == "Windows" || Utils.app.platform == "Linux" || Utils.app.platform == "MacOS")
                            document.getElementsByClassName("windowTopBar")[0].classList.add("loaded")
                        mainPanel.removeChild(lp);
                        document.body.classList.remove("loading");
                        let menuWin = new MenuWindow()
                        Utils.menu = menuWin
                        let viewerWin = new MusicViewerWindow()
                        Utils.musicViewer = viewerWin
                        mainPanel.appendChild(menuWin);
                        mainPanel.appendChild(new ListenWindow())
                    })
                    if (Utils.app.settings.firstOpen) {
                        var info = new InfoPanel("Welcome to AyMusic!", "Hello! Thanks for testing our app.\n"
                            + "We would like to remind you that this app isn't in its release state. So, the Aketsuky Team can reset the database and it may have bugs in several features of AyMusic.\n"
                            + "Thanks for reading, and if you find a bug, please report it to Aketsuky Team!", [{
                                text: "OK", isPositive: true, onclick: () => {
                                    info.close()
                                    Utils.app.changeSetting("firstOpen", false)
                                }
                            }], false);
                        document.getElementById("main").appendChild(info)
                    }
                }
                if (Utils.app.remoteClient.haveCookie(Utils.servURL, "PHPSESSID").length > 0 && Utils.apiManager.haveCache({ act: "getUserInfo" })) {
                    cb()
                }
                else {
                    var logP = new LoginPanel("");
                    logP.style.width = logP.style.height = "100%";
                    logP.style.position = "absolute";
                    document.getElementById("main").appendChild(logP);
                    logP.notConnected = () => {
                        loadPanel.hide();
                    }
                    logP.logged = () => {
                        cb()
                    }
                }
            }
            catch (e) {
                Utils.newError("Unable to reach the server :(", e);
            }
        }
    };
}

main();