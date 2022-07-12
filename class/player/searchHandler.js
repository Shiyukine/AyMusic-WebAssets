import InfoPanel from "../../ui/components/infoPanel/infoPanel.js";
import Utils from "../utils/utils.js";
import PlatformHandler from "./platformHandler.js";

export default class SearchHandler {
    #eventEl = document.createElement("event");

    static async searchMusic(criteria, platform) {
        var platSet = await PlatformHandler.getPlatformSettings(platform)
        if (platSet["RequireUserLoggedOnPlatform"]) {
            let panel = new InfoPanel("Login to " + platform + "...", "Checking if you're connected on " + platform, null, true)
            document.getElementById("main").appendChild(panel)
            panel.show()
            //to-do
        }
        if (platSet["RequireVisitBaseUrl"] && Date.now() > platSet["LastRestoredSession"] + platSet["RestoreSession"]) {
            let panel = new InfoPanel("Refreshing " + platform + " user API key...", "Refreshing API key for platform: " + platform, null, true)
            document.getElementById("main").appendChild(panel)
            panel.show()
            //to-do
        }
        var searchUrl = PlatformHandler.getPlatformUrl(platform, "SearchUrl")
        var scriptUrl = PlatformHandler.getPlatformUrl(platform, "ScriptUrl")
        await Utils.app.remoteClient.addWebTask(searchUrl, scriptUrl, false, true, false, (result) => {
            //to-do
        })
    }

    static async searchMusicEverywhere(criteria) {
        for (var platform in await PlatformHandler.getAvailablePlatforms()) {
            this.searchMusic(criteria, platform)
        }
    }
}