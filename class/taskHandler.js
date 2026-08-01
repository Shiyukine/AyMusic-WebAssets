import Utils from "./utils/utils.js";

export default class TaskHandler {
    /**
     * @type {Object.<string, {url: string, script: string, stopTaskManually: boolean, callback: function, needDisplayNone: boolean, channel: string}>}
     */
    static wbs = {};
    static allowBgTask = true;
    static blockAdsContent = "";

    static async addAdblock() {
        console.log("Loading adblock injecter")
        let script = await (await fetch(Utils.servURL + "/dl/AyMusic/scripts/adblock_content.js")).text()
        this.blockAdsContent = script
        console.log("Adblock injecter loaded")
    }

    static addTask(url, script, channel, displayFailError /*deprecated*/, stopTaskManually, callback, needDisplayNone = true) {
        var wt = {
            id: Date.now() + (Math.random() + 1).toString(36).substring(7),
            url: url,
            script: script,
            stopTaskManually: stopTaskManually,
            callback: callback,
            needDisplayNone: needDisplayNone,
            channel: channel
        };
        if (this.wbs[channel]) {
            let wtOld = this.wbs[channel]
            this.removeTask(wtOld)
        }
        this.createTask(wt)
        return wt.id
    }

    static async createTask(wt) {
        var iframe = document.createElement("iframe");
        var adblockcount = 0;
        var iscf = false;
        let origin = "app://root"
        if (Utils.app.platform == "Android") origin = "https://myapp"
        if (this.blockAdsContent == "") await this.addAdblock()
        Utils.app.remoteClient.registerIframeUrl(wt.url, `(async () => {\n`
            + this.blockAdsContent + `;\n
            var wtId = "` + wt.id + `"; 
            var wtUrl = "` + wt.url + `";
            var platform = "` + Utils.app.platform + `";
            let func = async () => {
                ` + wt.script.split("app://root").join(origin) + `;
            }
            let retData = null;
            if(platform == "Android") {
                try {
                    retData = await func()
                    parent.postMessage({message: 'callback', data: retData, id: wtId}, '` + origin + `')
                }
                catch(e) {
                    console.warn("Error when evaluating JS");
                    console.warn(e)
                    addEventListener("DOMContentLoaded", async () => {
                        try {
                            retData = await func()
                            parent.postMessage({message: 'callback', data: retData, id: wtId}, '` + origin + `')
                        }
                        catch(e) {
                            parent.postMessage({message: 'callback', data: null, error: e, id: wtId}, '` + origin + `')
                        }
                    })
                }
            }
            else {
                addEventListener("DOMContentLoaded", async () => {
                    try {
                        retData = await func()
                        parent.postMessage({message: 'callback', data: retData, id: wtId}, '` + origin + `')
                    }
                    catch(e) {
                        parent.postMessage({message: 'callback', data: null, error: e, id: wtId}, '` + origin + `')
                    }
                })
                try {
                    retData = await func()
                    parent.postMessage({message: 'callback', data: retData, id: wtId}, '` + origin + `')
                }
                catch(e) {
                    console.warn("Error when evaluating JS");
                    console.warn(e)
                }
            }
            addEventListener('message', async (e) =>
                {
                    if(e.origin.includes('` + origin + `'))
                    {
                        if(e.data.message == 'execjs')
                        {
                            try {
                                eval(e.data.js)().then((result) => {
                                    parent.postMessage({message: 'jscb', data: result, id: e.data.id}, '` + origin + `')
                                })
                            } catch (ex) {
                                console.error(ex)
                                parent.postMessage({message: 'jscb', data: null, id: e.data.id}, '` + origin + `')
                            }
                        }
                    }
                })
            })()`)
        iframe.allow = "autoplay; encrypted-media"
        iframe.style.width = "100%"
        iframe.style.height = "100%"
        if (wt.needDisplayNone) iframe.style.display = "none";
        iframe.id = "iframe_" + wt.id
        iframe.src = wt.url;
        TaskHandler.postJs(iframe, wt).then((data) => {
            wt.callback(data, wt.id)
            if (!wt.stopTaskManually) this.removeTask(wt)
        }).catch((e) => {
            wt.callback(e, wt.id)
            // keep task when debugging
            if (!wt.stopTaskManually || Utils.app.isRelease) this.removeTask(wt)
        })
        document.getElementById("iframes").appendChild(iframe)
        this.wbs[wt.channel] = wt
        console.log("Task in process: " + wt.url);
    }

    static postJs(iframe, wt) {
        let controller = new AbortController();
        return new Promise((resolve, reject) => {
            window.addEventListener("message", (e) => {
                if (/*e.origin == Utils.servURL.slice(0, -1) &&*/ e.data.id == wt.id) {
                    if (e.data.message == "callback") {
                        console.log("Task finished: " + wt.url)
                        controller.abort()
                        if (e.data.error) reject(e.data.error)
                        else resolve(e.data.data)
                    }
                }
            }, { signal: controller.signal })
        })
    }

    static executeJs(url, func) {
        let controller = new AbortController();
        return new Promise((resolve) => {
            let id = Date.now() + (Math.random() + 1).toString(36).substring(7);
            for (let wt of Object.values(this.wbs)) {
                if (wt.url == url) {
                    let iframe = document.getElementById("iframe_" + wt.id)
                    if (!iframe) {
                        console.error("No iframe found for task " + wt.id + " with url " + wt.url)
                        resolve(null)
                        return
                    }
                    window.addEventListener("message", (e) => {
                        //console.log(e)
                        if (/*e.origin == Utils.servURL.slice(0, -1) &&*/ e.data.id == id) {
                            //console.log(e.data)
                            if (e.data.message == "jscb") {
                                controller.abort()
                                resolve(e.data.data)
                            }
                        }
                    }, { signal: controller.signal })
                    let targetOrigin = wt.url;
                    if (Utils.app.platform == "iOS") targetOrigin = "*";
                    iframe.contentWindow.postMessage({ message: "execjs", id: id, js: func }, targetOrigin);
                }
            }
        })
    }

    static async waitConnected(attempt = 0) {
        let miniErrorId = "taskHandlerWait"
        if (attempt > 0) {
            Utils.showMiniError(miniErrorId, "No internet connection. Retrying...", false, "orange", "#000")
        }
        try {
            if (navigator.onLine) {
                Utils.hideMiniError(miniErrorId);
                return;
            }
        }
        catch (e) { }
        let delay = 1000 * Math.pow(2, attempt)
        if (delay > 30000) delay = 30000
        await Utils.delay(delay)
        await this.waitConnected(attempt + 1)
    }

    static async removeTask(wt) {
        if (wt) {
            document.getElementById("iframes").removeChild(document.getElementById("iframe_" + wt.id))
            delete this.wbs[wt.channel]
            console.log("Task url: " + wt.url + " has finished. " + (Object.keys(this.wbs).length) + " remaining task");
        }
    }

    static stopWebTaskManually(url, includeWaiting = undefined /*deprecated*/) {
        for (let wt of Object.values(this.wbs)) {
            if (wt.url == url && wt.stopTaskManually) {
                this.removeTask(wt);
                console.log("Stopped task manually: " + wt.url)
                return true;
            }
        }
        return false;
    }
}
