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
        firstOpen: true,
        other_hwacc: true,
        serviceWorkerVersionCode: 0,
    }
    registered = false;
    haveCallback = null;

    constructor() {
        this.loaded = function () { }
    }

    /**
    * @param {String} platform The platform
    * @param {String} versionName Name of the actual version
    * @param {Number} versionId ID version
    * @param {Object} remoteClient Object to send information on the client
    * @param {Boolean} isRelease Know if the package is in release state or not
    */
    async registerClient(platform, versionName, versionId, remoteClient, isRelease) {
        if (!this.registered && this.haveCallback.toString() != "function () { }") {
            this.registered = true;
            try {
                //force change settings for mobile
                this.settings = {
                    gen_langs: "English",
                    gen_theme: "Dark",
                    gen_discordRPC: platform != "Android" && platform != "iOS",
                    gen_logs: platform == "Android" || platform == "iOS",
                    music_adblock: true,
                    music_createMix: false,
                    music_vol: platform == "Android" || platform == "iOS" ? 100 : 66,
                    music_skipS: false,
                    shuffle: false,
                    repeat: 0,
                    mute: false,
                    firstOpen: true,
                    other_hwacc: true
                }
                this.platform = platform;
                this.versionName = versionName + (!isRelease ? "+debug" : "");
                this.versionId = versionId;
                this.remoteClient = remoteClient;
                this.isRelease = isRelease;
                let newS = await this.remoteClient.getSettingFile()
                if (newS) {
                    newS = JSON.parse(newS)
                    for (var x in this.settings) {
                        if (typeof newS[x] === "undefined") {
                            console.warn("Adding settings which didn't exists: " + x)
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
        else {
            console.warn("Client already registred! Ignoring.")
        }
    }

    receiveEventClient(event) {
        this.#eventEl.dispatchEvent(new CustomEvent(event));
    }

    set loaded(callback) {
        this.haveCallback = callback;
        this.#eventEl.addEventListener("loaded", callback)
    }

    changeSetting(settingName, value) {
        this.settings[settingName] = value
        this.remoteClient.changeSettingFile(JSON.stringify(this.settings))
        console.log("Setting: " + settingName + " is changed to: " + value)
    }

    getSetting(settingName) {
        console.log("Getting setting: " + settingName + ". Value: " + this.settings[settingName])
        return this.settings[settingName]
    }

    changeLanguage(language) {
        this.#eventEl.dispatchEvent(new CustomEvent("langchanged"));
    }

    changeTheme(theme) {
        this.#eventEl.dispatchEvent(new CustomEvent("themechanged"));
    }

    addEventListener(event, callback, options) {
        this.#eventEl.addEventListener(event, callback, options)
    }

    async httpRequestGET(url) {
        if (Utils.app.platform == "Android") {
            return new Promise(r => {
                window.listeners.httpRequestCallback = (data) => {
                    window.listeners.httpRequestCallback = (data) => { }
                    r(data)
                }
                Utils.app.remoteClient.httpRequestGET(url)
            })
        }
        else return await Utils.app.remoteClient.httpRequestGET(url, {
            headers: {
                "pragma": "no-cache",
                "cache-control": "no-cache"
            }
        })
    }

    /**
     * Forward touch events to the main window
     * Deprecated
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