import Utils from "../utils/utils.js";

export default class PlatformHandler {

    platforms = null;

    static searchPlatforms() {
        return new Promise((resolve) => {
            if (!this.platforms) {
                var result = Utils.app.remoteClient.httpRequestGET(Utils.servURL + "dl/AyMusic/scripts/servers.json")
                resolve(JSON.parse(result))
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
            CacheInUserStorage: false,
            RequireVisitBaseUrl: false,
            RequireUserLoggedOnPlatform: true,
            RestoreSession: 0,
            LastRestoredSession: 0
        }
        var platforms = await this.searchPlatforms()
        var settingsOverrided = platforms["Servers"][platform]["OverrideSettings"]
        for (var set in settingsOverrided) {
            settings[set] = settingsOverrided[set]
        }
        return settings
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

    static async getPlatformPath(platform) {
        return Utils.servURL + "/dl/AyMusic/scripts/" + platform + "/"
    }
}