import Utils from "./utils/utils.js";

export default class ImageCacheHandler {
    static cache = {}
    static origin = "app://Cache"

    static async init() {
        try {
            if (Utils.app.platform == "Android") this.origin = "https://mycache"
            let rep = await fetch(this.origin + "/Image/index")
            let json = await rep.json()
            this.cache = json
        }
        catch {
            Utils.app.remoteClient.saveCache("Image/index", new TextEncoder("utf-8").encode(JSON.stringify(this.cache)))
        }
        console.log("Image cache handler loaded")
    }

    static haveCacheForImageUrl(url) {
        return url in this.cache
    }

    static async getCacheForImageUrl(url, renew = false) {
        try {
            if (!renew && this.haveCacheForImageUrl(url)) {
                return this.origin + "/Image/" + this.cache[url][0]
            }
            else {
                let rdm = (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2) + (Utils.app.platform == "Android" ? ".jpg" : "")
                if (Utils.app.platform == "Android") Utils.app.remoteClient.addBypassWebRequest(url)
                let raw = await fetch(url)
                let rep = await raw.arrayBuffer()
                if (Utils.app.platform == "Android") {
                    let view = new Uint8Array(rep)
                    Utils.app.remoteClient.saveCache("Image/" + rdm, view)
                }
                else await Utils.app.remoteClient.saveCache("Image/" + rdm, rep)
                this.cache[url] = [rdm, Date.now()]
                Utils.app.remoteClient.saveCache("Image/index", new TextEncoder("utf-8").encode(JSON.stringify(this.cache)))
                return this.origin + "/Image/" + rdm
            }
        }
        catch (e) {
            console.warn("Error while caching image: " + url + ". Using non-cached image instead.")
            return url
        }
    }

    static haveCacheForObjectID(id) {
        return id in this.cache
    }

    static async getImgUrlCachedForObjectID(id, defaultUrl) {
        if (this.haveCacheForObjectID(id)) {
            if (this.cache[id][2] != defaultUrl) {
                if (Utils.app.platform == "Android") Utils.app.remoteClient.addBypassWebRequest(defaultUrl)
                let raw = await fetch(defaultUrl)
                let rep = await raw.arrayBuffer()
                if (Utils.app.platform == "Android") {
                    let view = new Uint8Array(rep)
                    Utils.app.remoteClient.saveCache("Image/" + this.cache[id][0], view)
                }
                else await Utils.app.remoteClient.saveCache("Image/" + this.cache[id][0], rep)
                this.cache[id] = [this.cache[id][0], Date.now(), defaultUrl]
                Utils.app.remoteClient.saveCache("Image/index", new TextEncoder("utf-8").encode(JSON.stringify(this.cache)))
                return this.origin + "/Image/" + this.cache[id][0]
            }
            else {
                return this.origin + "/Image/" + this.cache[id][0]
            }
        }
        else {
            let rdm = (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2) + (Utils.app.platform == "Android" ? ".jpg" : "")
            if (Utils.app.platform == "Android") Utils.app.remoteClient.addBypassWebRequest(defaultUrl)
            let raw = await fetch(defaultUrl)
            let rep = await raw.arrayBuffer()
            if (Utils.app.platform == "Android") {
                let view = new Uint8Array(rep)
                Utils.app.remoteClient.saveCache("Image/" + rdm, view)
            }
            else await Utils.app.remoteClient.saveCache("Image/" + rdm, rep)
            this.cache[id] = [rdm, Date.now(), defaultUrl]
            Utils.app.remoteClient.saveCache("Image/index", new TextEncoder("utf-8").encode(JSON.stringify(this.cache)))
            return this.origin + "/Image/" + rdm
        }
    }
}