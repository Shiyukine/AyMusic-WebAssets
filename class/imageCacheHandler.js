import Utils from "./utils/utils.js";

export default class ImageCacheHandler {

    static async init() {
        if (Utils.app.platform == "iOS") {
            console.warn("Service worker is not supported on iOS, using app://cachenew scheme for image caching instead.");
            return;
        }
        try {
            const registration = await navigator.serviceWorker.register("/sw.js", {
                scope: "/",
            });
            if (registration.installing) {
                console.log("Service worker installing");
            } else if (registration.waiting) {
                console.log("Service worker installed");
            } else if (registration.active) {
                console.log("Service worker active");
            }
            if (Utils.app.versionId != Utils.app.getSetting("serviceWorkerVersionCode")) {
                console.log("Service worker version changed, unregistering old service worker");
                await registration.unregister();
                await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                });
                Utils.app.changeSetting("serviceWorkerVersionCode", Utils.app.versionId);
            }
        } catch (error) {
            console.error(`Registration failed with ${error}`);
        }

        navigator.serviceWorker.ready.then((registration) => {
            registration.active.postMessage({
                action: "excludeResource",
                url: Utils.servURL + "dl/",
                includes: true,
            });
            registration.active.postMessage({
                action: "excludeResource",
                url: Utils.servURL + "api/",
                includes: true,
            });
            registration.active.postMessage({
                action: "excludeResource",
                url: "google.com",
                includes: true,
            });
            Utils.postMessageSW = registration.active.postMessage.bind(registration.active);
        });
    }

    static getCacheForImageUrl(url, renew = false) {
        if (!url) return "/resources/icon.ico";

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