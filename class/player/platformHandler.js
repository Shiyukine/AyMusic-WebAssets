import TaskHandler from "../taskHandler.js";
import Utils from "../utils/utils.js";

export default class PlatformHandler {

    static platforms = null;

    static searchPlatforms() {
        return new Promise((resolve) => {
            if (!this.platforms) {
                Utils.app.remoteClient.httpRequestGET(Utils.servURL + "dl/AyMusic/scripts/servers.json").then((result) => {
                    this.platforms = JSON.parse(result)
                    resolve(this.platforms)
                })
            }
            else {
                resolve(this.platforms)
            }
        })
    }

    static async getAvailablePlatforms() {
        var platforms = await this.searchPlatforms()
        return platforms["AvailableServers"]
    }

    static async getPlatformSettings(platform) {
        var settings = {
            CacheInUserStorage: true,
            RequireVisitBaseUrl: false,
            RequireUserLoggedOnPlatform: false,
            RestoreSession: 0,
            LastRestoredSession: 0,
            Token: ""
        }
        var platforms = await this.searchPlatforms()
        var settingsOverrided = platforms["Servers"][platform]["OverrideSettings"]
        for (var set in settingsOverrided) {
            settings[set] = settingsOverrided[set]
        }
        return settings
    }

    static async setPlatformSetting(platform, setting, value) {
        var platforms = await this.searchPlatforms()
        this.platforms["Servers"][platform]["OverrideSettings"][setting] = value
    }

    static async getPlatformUrl(platform, url) {
        var platforms = await this.searchPlatforms()
        /**
         * @type {String}
         */
        var u = platforms["Servers"][platform]["URLs"][url]
        if (u.startsWith("https://") || u.startsWith("http://")) return u
        else return this.getPlatformPath(platform) + u
    }

    static getPlatformPath(platform) {
        return Utils.servURL + "/dl/AyMusic/scripts/" + platform + "/"
    }

    static async getPlatformBySongUrl(url) {
        for (let platform of await this.searchPlatforms()) {
            if (url.includes(await PlatformHandler.getPlatformUrl(platform, "ListenUrl"))) {
                return platform
            }
        }
    }

    static async refreshTokenForPlatform(platform) {
        return new Promise((resolve) => {
            PlatformHandler.getPlatformUrl(platform, "BaseUrl").then((url) => {
                TaskHandler.addTask(url, "", true, true, false, () => {
                    var intv = setInterval(async () => {
                        if (Utils.app.remoteClient.getClientToken(platform)) {
                            await PlatformHandler.setPlatformSetting(platform, "Token", Utils.app.remoteClient.getClientToken(platform))
                            await PlatformHandler.setPlatformSetting(platform, "LastRestoredSession", Date.now())
                            clearInterval(intv)
                            resolve()
                        }
                    }, 1000)
                })
            })
        })
    }
}