import Utils from "./utils/utils.js";

export default class ImageCacheHandler {
    static getCacheForImageUrl(url, renew = false) {
        if (!url) return ""

        let origin = "app://cachenew"

        if (Utils.app.platform == "iOS") return origin + "/get?url=" + encodeURIComponent(url) + (renew ? "&renew=true" : "")
        else {
            if (renew) {
                navigator.serviceWorker.controller.postMessage({
                    action: "deleteCache",
                    cacheKey: url
                })
            }
            return url
        }
    }
}