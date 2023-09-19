import TaskHandler from "../taskHandler.js";
import Utils from "../utils/utils.js";

export default class PlatformHandler {

    static platforms = null;

    static searchPlatforms() {
        return new Promise((resolve) => {
            try {
                if (!this.platforms) {
                    let result = Utils.app.remoteClient.httpRequestGET(Utils.servURL + "dl/AyMusic/scripts/servers.json")
                    if (result.then) {
                        result.then((result) => {
                            try {
                                this.platforms = JSON.parse(result)
                                resolve(this.platforms)
                            }
                            catch (e) {
                                console.error(e)
                                resolve(null)
                            }
                        })
                    }
                    else {
                        this.platforms = JSON.parse(result)
                        resolve(JSON.parse(result))
                    }
                }
                else {
                    resolve(this.platforms)
                }
            }
            catch (e) {
                console.error(e)
                resolve(null)
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
            FilterSearch: "",
            NeedDisplayNoneWhenSearching: true,
            NeedDisplayNoneWhenPlaying: true,
            UseIncludeUrlFilter: true,
            NoMute: false,
            AddParamsInSongUrl: true,
            SmallVolumeInSongUrl: false
        }
        var platforms = await this.searchPlatforms()
        if (platforms) {
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
        if (platforms) {
            return platforms["Servers"][platform]["Controls"][control].split("%VALUE%").join(value)
        }
        else return ""
    }

    static async setPlatformSetting(platform, setting, value) {
        var platforms = await this.searchPlatforms()
        if (platforms) {
            platforms["Servers"][platform]["OverrideSettings"][setting] = value
        }
    }

    static async getPlatformUrl(platform, url) {
        var platforms = await this.searchPlatforms()
        /**
         * @type {String}
         */
        if (platforms) {
            var u = platforms["Servers"][platform]["URLs"][url]
            if (u.startsWith("https://") || u.startsWith("http://")) return u
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
        return new Promise((resolve) => {
            Utils.app.remoteClient.removeClientToken(platform)
            PlatformHandler.getPlatformUrl(platform, "BaseUrl").then((url) => {
                if (Utils.app.platform == "Android") {
                    var intv = setInterval(async () => {
                        if (Utils.app.remoteClient.getClientToken(platform)) {
                            await PlatformHandler.setPlatformSetting(platform, "Token", Utils.app.remoteClient.getClientToken(platform))
                            clearInterval(intv)
                            TaskHandler.stopWebTaskManually(url, true)
                            resolve()
                        }
                    }, 1000)
                    Utils.app.remoteClient.loadBackgroundWeb(url)
                }
                else {
                    TaskHandler.addTask(url, "", false, true, true, () => {
                        var intv = setInterval(async () => {
                            if (Utils.app.remoteClient.getClientToken(platform)) {
                                await PlatformHandler.setPlatformSetting(platform, "Token", Utils.app.remoteClient.getClientToken(platform))
                                clearInterval(intv)
                                TaskHandler.stopWebTaskManually(url, true)
                                resolve()
                            }
                        }, 1000)
                    })
                }
            })
        })
    }
}