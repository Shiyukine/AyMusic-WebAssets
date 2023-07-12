import Utils from "./utils/utils.js";

export default class App {
    remoteClient = null;
    #eventEl = document.createElement("event");
    settings = {
        gen_langs: "English",
        gen_theme: "Dark",
        gen_discordRPC: true,
        gen_logs: false,
        music_adblock: true,
        music_createMix: false,
        music_vol: 66,
        music_skipS: false,
        shuffle: false,
        repeat: 0,
        mute: false,
        firstOpen: true
    }

    constructor() {
        this.loaded = function () { }
    }

    /**
    * @param {String} platform The platform
    * @param {String} versionName Name of the actual version
    * @param {Number} versionId ID version
    * @param {Object} remoteClient Object to send information on the client
    */
    async registerClient(platform, versionName, versionId, remoteClient) {
        try {
            this.platform = platform;
            this.versionName = versionName;
            this.versionId = versionId;
            this.remoteClient = remoteClient;
            let newS = await this.remoteClient.getSettingFile()
            if (newS) {
                newS = JSON.parse(newS)
                for (var x in this.settings) {
                    if (typeof newS[x] === "undefined") {
                        console.warn("Adding settings which didn't exists : " + x)
                        newS[x] = this.settings[x]
                    }
                }
                this.settings = newS
            }
            else {
                console.warn("No settings imported. Creating new setting file")
            }
            this.remoteClient.changeSettingFile(JSON.stringify(this.settings))
            this.#eventEl.dispatchEvent(new CustomEvent("loaded"));
        }
        catch (e) {
            console.error(e)
        }
    }

    set loaded(callback) {
        this.addEventListener("loaded", callback)
    }

    changeSetting(settingName, value) {
        this.settings[settingName] = value
        this.remoteClient.changeSettingFile(JSON.stringify(this.settings))
        console.log("Setting : " + settingName + " is changed to : " + value)
    }

    getSetting(settingName) {
        console.log("Getting setting : " + settingName + ". Value : " + this.settings[settingName])
        return this.settings[settingName]
    }

    changeLanguage(language) {
        this.#eventEl.dispatchEvent(new CustomEvent("langchanged"));
    }

    changeTheme(theme) {
        this.#eventEl.dispatchEvent(new CustomEvent("themechanged"));
    }

    addEventListener(event, callback) {
        this.#eventEl.addEventListener(event, callback)
    }

    /**
     * Forward touch events to the main window
     * @param {HTMLElement} element 
     */
    async addForwardTouch(element, leftMouseDownEvent, leftMouseUpEvent, rightMouseDownEvent, rightMouseUpEvent) {
        //var id = Utils.createIndexedPathTo(element)
        console.log("adding ignore touch to ", element)
        var rect = element.getBoundingClientRect();
        var x = rect.left;
        var y = rect.top;
        var width = rect.right - rect.left;
        var height = rect.bottom - rect.top;
        var style = window.getComputedStyle(element);
        var isVisible = style.display !== "none";
        let self = this;
        /*setInterval(async () => {
            var nrect = element.getBoundingClientRect();
            if (x != nrect.left || y != nrect.top ||
                width != nrect.right - nrect.left || height != nrect.bottom - nrect.top) {
                if (element.parentElement) {
                    rect = element.getBoundingClientRect();
                    x = rect.left;
                    y = rect.top;
                    width = rect.right - rect.left;
                    height = rect.bottom - rect.top;
                    style = window.getComputedStyle(element);
                    isVisible = style.display !== "none";
                    await self.remoteClient.modifyIgnoreTouch(id, x, y, width, height, isVisible)
                    console.log("modified ignore touch of " + id)
                }
                else {
                    await self.remoteClient.removeIgnoreTouch(id)
                    console.log("removed ignore touch of " + id)
                }
            }
        }, 10);*/
        await this.remoteClient.addIgnoreTouch(element);
    }
}