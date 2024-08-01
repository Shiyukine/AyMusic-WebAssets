import TaskHandler from "../taskHandler.js";
import Utils from "../utils/utils.js";

export default class PlatformHandler {

    static platforms = null;
    static cachedPlatforms = null;
    static searchingTokenForPlatform = [];
    static origin = "app://Cache"
    static loadedByCache = false;

    static searchPlatforms() {
        return new Promise((resolve) => {
            if (!this.platforms) {
                if (Utils.app.platform == "Android") Utils.app.remoteClient.addBypassWebRequest(Utils.servURL + "dl/AyMusic/scripts/servers.json")
                fetch(Utils.servURL + "dl/AyMusic/scripts/servers.json").then(async (result) => {
                    this.platforms = await result.json()
                    Utils.app.remoteClient.saveCache("servers.json", new TextEncoder("utf-8").encode(JSON.stringify(this.platforms)))
                    this.loadedByCache = false
                    this.cachedPlatforms = null
                    resolve(this.platforms)
                }).catch(async (e) => {
                    if (!this.loadedByCache) console.warn("Cannot fetch servers.json, trying to load from cache...", e)
                    if (Utils.app.platform == "Android") this.origin = "https://mycache"
                    fetch(this.origin + "/servers.json").then(async (rep) => {
                        let json = await rep.json()
                        this.loadedByCache = true
                        this.cachedPlatforms = json
                        resolve(json)
                    }).catch((f) => {
                        console.error(f)
                        resolve(null)
                    })
                })
                if (this.loadedByCache) resolve(this.cachedPlatforms)
            }
            else {
                resolve(this.platforms)
            }
        })
    }

    static async getAvailablePlatforms() {
        var platforms = await this.searchPlatforms()
        if (platforms) {
            return platforms["AvailableServers"]
        }
        else {
            return []
        }
    }

    static async getPlatformSettings(platform) {
        var settings = {
            CacheInUserStorage: true,
            RequireVisitBaseUrl: false,
            RequireUserLoggedOnPlatform: false,
            UseListenUrl: true,
            ReplaceInSongUrl: null,
            Token: "",
            ClientToken: "",
            FilterSearch: "",
            NeedDisplayNoneWhenSearching: true,
            NeedDisplayNoneWhenPlaying: true,
            UseIncludeUrlFilter: true,
            NoMute: false,
            AddParamsInSongUrl: true,
            SmallVolumeInSongUrl: false,
            SupportsLogin: true,
            SupportsPlaylistsImport: false,
            MinVersion: 0,
            CookieName: "",
            CookieUrl: "",
            NeedDisconnectBeforeChangeSong: false
        }
        var platforms = await this.searchPlatforms()
        if (platform && platforms) {
            var settingsOverrided = platforms["Servers"][platform]["OverrideSettings"]
            for (var set in settingsOverrided) {
                settings[set] = settingsOverrided[set]
            }
            return settings
        }
        else {
            return settings
        }
    }

    static async getPlatformControl(platform, control, value = "") {
        var platforms = await this.searchPlatforms()
        if (platform && platforms) {
            return platforms["Servers"][platform]["Controls"][control].split("%VALUE%").join(value)
        }
        else return ""
    }

    static async setPlatformSetting(platform, setting, value) {
        var platforms = await this.searchPlatforms()
        if (platform && platforms) {
            platforms["Servers"][platform]["OverrideSettings"][setting] = value
        }
    }

    static async getPlatformUrl(platform, url) {
        var platforms = await this.searchPlatforms()
        /**
         * @type {String}
         */
        if (platform && platforms) {
            var u = platforms["Servers"][platform]["URLs"][url]
            if (u.startsWith("https://") || u.startsWith("http://") || u.startsWith("%")) return u
            else return this.getPlatformPath(platform) + u
        }
        else return ""
    }

    static getPlatformPath(platform) {
        return Utils.servURL + "/dl/AyMusic/scripts/" + platform + "/"
    }

    static async getPlatformBySongUrl(url) {
        let platforms = await this.searchPlatforms()
        if (platforms) {
            for (let platform of platforms["AvailableServers"]) {
                if (url.includes(await PlatformHandler.getPlatformUrl(platform, "ListenUrl")) || url.includes(await PlatformHandler.getPlatformUrl(platform, "BaseSongUrl"))) {
                    return platform
                }
            }
        }
        return ""
    }

    static async refreshTokenForPlatform(platform) {
        return new Promise((resolve, reject) => {
            if (!this.searchingTokenForPlatform.includes(platform)) {
                this.searchingTokenForPlatform.push(platform)
                Utils.app.remoteClient.removeClientToken(platform)
                PlatformHandler.getPlatformUrl(platform, "BaseUrl").then((url) => {
                    if (Utils.app.platform == "Android") {
                        var intv = setInterval(async () => {
                            if (Utils.app.remoteClient.getClientToken(platform)) {
                                let ret = JSON.parse(Utils.app.remoteClient.getClientToken(platform))
                                let auth = ret["auth"]
                                let token = ret["client"]
                                await PlatformHandler.setPlatformSetting(platform, "Token", auth)
                                await PlatformHandler.setPlatformSetting(platform, "ClientToken", token)
                                clearInterval(intv)
                                TaskHandler.stopWebTaskManually(url, true)
                                this.searchingTokenForPlatform.splice(this.searchingTokenForPlatform.indexOf(platform), 1)
                                resolve()
                            }
                        }, 100)
                        Utils.app.remoteClient.loadBackgroundWeb(url)
                    }
                    else {
                        TaskHandler.addTask(url, "", false, true, true, () => {
                            var intv = setInterval(async () => {
                                if (Utils.app.remoteClient.getClientToken(platform)) {
                                    let ret = JSON.parse(Utils.app.remoteClient.getClientToken(platform))
                                    let auth = ret["auth"]
                                    let token = ret["client"]
                                    await PlatformHandler.setPlatformSetting(platform, "Token", auth)
                                    await PlatformHandler.setPlatformSetting(platform, "ClientToken", token)
                                    clearInterval(intv)
                                    TaskHandler.stopWebTaskManually(url, true)
                                    this.searchingTokenForPlatform.splice(this.searchingTokenForPlatform.indexOf(platform), 1)
                                    resolve()
                                }
                            }, 100)
                        })
                    }
                })
            }
            else {
                reject("Already refreshing token for " + platform + "!")
            }
        })
    }
}