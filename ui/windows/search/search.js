import Import from "../../../class/import.js";
import PlatformHandler from "../../../class/player/platformHandler.js";
import TaskHandler from "../../../class/taskHandler.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";

export default class SearchWindow extends HTMLDivElement {
    selectedServer = "icon";
    isClosed = false;
    controller = new AbortController();

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        Import.getData("/ui/windows/search/search.html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.style.opacity = "1"
                for (let serv of await PlatformHandler.getAvailablePlatforms()) {
                    let opt = document.createElement("option")
                    opt.value = serv.toLowerCase()
                    opt.innerText = serv
                    shadow.getElementById("serv_picker").appendChild(opt)
                }
                shadow.getElementById("serv_picker").addEventListener("change", () => {
                    //icon = all
                    this.selectedServer = shadow.getElementById("serv_picker").value
                    shadow.getElementById("serv_ico").src = "/resources/" + shadow.getElementById("serv_picker").value + ".ico"
                })
                shadow.getElementById("tb_search").addEventListener("keydown", async (e) => {
                    if (e.key == "Enter") {
                        if (this.selectedServer != "icon") {
                            this.searchForAPlatform(this.selectedServer)
                        }
                    }
                })
            }
        })
    }

    close() {
        this.isClosed = true
        while (this.firstChild) {
            this.removeChild(this.lastChild);
        }
        this.controller.abort()
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    async searchForAPlatform(server) {
        var platform = this.capitalizeFirstLetter(server)
        if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform &&
            Date.now() - (await PlatformHandler.getPlatformSettings(platform)).LastRestoredSession > (await PlatformHandler.getPlatformSettings(platform)).RestoreSession) {
            console.log("Platform need refresh token")
            await PlatformHandler.refreshTokenForPlatform(platform)
            console.log("Platform token refreshed")
        }
        var searchUrl = await PlatformHandler.getPlatformUrl(platform, "SearchUrl")
        searchUrl = searchUrl.split("%search%").join(this.shadowRoot.getElementById("tb_search").value)
        if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform) {
            searchUrl = searchUrl.split("%token%").join((await PlatformHandler.getPlatformSettings(platform)).Token)
        }
        console.log("Search url: " + searchUrl)
        TaskHandler.addTask(searchUrl, await Utils.app.remoteClient.httpRequestGET(await PlatformHandler.getPlatformUrl(platform, "SearchScript")), false, true, false, (data) => {
            console.log(data)
        })
    }
}