import InfoPanel from "../ui/components/infoPanel/infoPanel.js"
import Utils from "./utils/utils.js"

export default class Update {

    /**
     * @type {InfoPanel}
     */
    static infoPanel = null;

    static async searchUpdate(panelInfo) {
        let curUpdate = 0
        let maxUpdate = 0
        return new Promise(resolve => {
            Update.infoPanel = panelInfo
            var a = (state) => {
                Update.infoPanel.changeloading(state.cur / state.max * 100)
                if (state.step == 0) Update.infoPanel.changeText(null, "Downloading update file...")
                if (state.step == 1) Update.infoPanel.changeText(null, "Checking files...")
                if (state.step == 2) Update.infoPanel.changeText(null, "Verifying files...")
                if (state.step == 3) {
                    curUpdate = state.cur
                    maxUpdate = state.max
                }
                if (state.step == 4) {
                    Update.infoPanel.changeText("Updating...", "Downloading update " + curUpdate + "/" + maxUpdate + "\n" + Math.floor(state.cur / 1000 / 1000) + " MB/" + Math.floor(state.max / 1000 / 1000) + " MB")
                }
                if (state.step == 5) {
                    if (Utils.app.platform == "Android") {
                        Update.infoPanel.changeText("New version available", "An update is available. Please install the update.")
                    }
                    else {
                        Update.infoPanel.changeText(null, "Applying update...")
                    }
                }
                if (state.step == -1) {
                    window.updateCallBack = undefined;
                    resolve()
                }
                if (state.step == -2) {
                    //Update.infoPanel.changeText("Can't search for updates", "Error when searching updates:\n" + state.error)
                    var info = new InfoPanel("Can't search for updates", "Error when searching updates:\n" + state.error, [{
                        text: "Retry", isPositive: true, onclick: () => {
                            Utils.app.remoteClient.searchUpdates()
                            info.close()
                        }
                    }], false);
                    document.getElementById("main").appendChild(info)
                }
            }
            window.updateCallBack = a;
            Utils.app.remoteClient.onUpdateStateChange(a)
            Utils.app.remoteClient.searchUpdates()
        })
    }
}