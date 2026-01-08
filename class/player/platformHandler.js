import TaskHandler from "../taskHandler.js";
import Utils from "../utils/utils.js";

export default class PlatformHandler {

    static platforms = null;
    static cachedPlatforms = null;
    static searchingTokenForPlatform = [];
    static origin = "app://cache"
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
            NeedDisplayNoneWhenSearching: ["Windows", "Android", "Linux"],
            NeedDisplayNoneWhenPlaying: ["Windows", "Android", "Linux"],
            NeedDisplayNoneWhenTokenRefresh: ["Windows", "Android", "Linux"],
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

    static async getPlatformOverrideResponses(platform) {
        var platforms = await this.searchPlatforms()
        if (platform && platforms) {
            return platforms["Servers"][platform]["OverrideResponses"] ? platforms["Servers"][platform]["OverrideResponses"] : []
        }
        else return []
    }

    static async getPlatformBlockRequests(platform) {
        var platforms = await this.searchPlatforms()
        if (platform && platforms) {
            return platforms["Servers"][platform]["BlockRequests"] ? platforms["Servers"][platform]["BlockRequests"] : []
        }
        else return []
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
        return Utils.servURL + "dl/AyMusic/scripts/" + platform + "/"
    }

    static async getPlatformBySongUrl(url) {
        let platforms = await this.searchPlatforms()
        if (platforms) {
            for (let platform of platforms["AvailableServers"]) {
                let baseSongUrl = await this.getPlatformUrl(platform, "BaseSongUrl")
                if (baseSongUrl.includes("%id%")) baseSongUrl = baseSongUrl.split("%id%")[0]
                if (url.includes(await PlatformHandler.getPlatformUrl(platform, "ListenUrl")) || url.includes(baseSongUrl)) {
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
                TaskHandler.stopWebTaskManually(Utils.player.currentSongUrl, true)
                Utils.app.remoteClient.removeClientToken(platform)
                PlatformHandler.getPlatformUrl(platform, "BaseUrl").then(async (url) => {
                    if (Utils.app.platform == "Android") {
                        var intv = setInterval(async () => {
                            if (Utils.app.remoteClient.getClientToken(platform)) {
                                await PlatformHandler.setPlatformSetting(platform, "Token", Utils.app.remoteClient.getClientToken(platform))
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
                                if (await Utils.app.remoteClient.getClientToken(platform)) {
                                    await PlatformHandler.setPlatformSetting(platform, "Token", await Utils.app.remoteClient.getClientToken(platform))
                                    clearInterval(intv)
                                    TaskHandler.stopWebTaskManually(url, true)
                                    this.searchingTokenForPlatform.splice(this.searchingTokenForPlatform.indexOf(platform), 1)
                                    resolve()
                                }
                            }, 100)
                        }, (await PlatformHandler.getPlatformSettings(platform)).NeedDisplayNoneWhenTokenRefresh.includes(Utils.app.platform))
                    }
                })
            }
            else {
                reject("Already refreshing token for " + platform + "!")
            }
        })
    }
}