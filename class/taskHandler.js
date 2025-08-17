import Utils from "./utils/utils.js";

export default class TaskHandler {
    static wbs = [[], []];
    static waiting = [];
    static maxTask = 5;
    static allowBgTask = true;
    static blockAdsContent = "";

    static async addAdblock() {
        console.log("Loading adblock injecter")
        let script = await Utils.app.httpRequestGET(Utils.servURL + "/dl/AyMusic/scripts/adblock_content.js")
        this.blockAdsContent = script
        console.log("Adblock injecter loaded")
    }

    static addTask(url, script, urgent, displayFailError, stopTaskManually, callback, needDisplayNone = true) {
        var wt = {
            id: Date.now(),
            url: url,
            script: script,
            displayFailError: displayFailError,
            stopTaskManually: stopTaskManually,
            callback: callback,
            needDisplayNone: needDisplayNone
        };
        if (this.wbs[0].length < this.maxTask || urgent) {
            if (urgent) {
                this.waiting.splice(0, 0, wt);
                this.purgeCurrentWebTask(1);
            }
            else {
                this.createTask(wt);
            }
            console.log("Added new task. Url: " + url + ". Urgent: " + urgent + ". " + (this.wbs[0].length + this.waiting.length) + " remaining task");
        }
        else {
            this.waiting.push(wt);
            console.log("Added new task in waiting list. Url: " + url + ". " + (this.wbs[0].length + this.waiting.length) + " remaining task");
        }
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
            var wtId = ` + wt.id + `; 
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
        if (wt.needDisplayNone) iframe.style.display = "none"
        iframe.src = wt.url;
        TaskHandler.postJs(iframe, wt).then((data) => {
            wt.callback(data, wt.id)
            if (!wt.stopTaskManually) this.switchTask(wt)
        }).catch((e) => {
            wt.callback(e, wt.id)
            // keep task when debugging
            if (!wt.stopTaskManually || Utils.app.isRelease) this.switchTask(wt)
        })
        document.getElementById("iframes").appendChild(iframe)
        this.wbs[0].push(wt);
        this.wbs[1].push(iframe);
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
            for (let i in this.wbs[0]) {
                let wt = this.wbs[0][i]
                if (wt.url == url) {
                    let iframe = this.wbs[1][i]
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
                    iframe.contentWindow.postMessage({ message: "execjs", id: id, js: func }, wt.url)
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

    static async switchTask(wt) {
        if (this.wbs[0].length > 0 && wt != null) {
            document.getElementById("iframes").removeChild(this.wbs[1][this.wbs[0].indexOf(wt)])
            this.wbs[1].splice(this.wbs[0].indexOf(wt), 1)
            this.wbs[0].splice(this.wbs[0].indexOf(wt), 1)
            console.log("Task url: " + wt.url + " has finished. " + (this.wbs[0].length + this.waiting.length) + " remaining task");
        }
        //var b = this.wbs[0].length == 0;
        if (this.waiting.length > 0) {
            var nwt = this.waiting[0];
            //await this.waitConnected()
            this.createTask(nwt);
            this.waiting.splice(this.waiting.indexOf(nwt), 1);
            console.log("Switched 1 task. Url of new task: " + nwt.url + ". " + (this.wbs[0].length + this.waiting.length) + " remaining task");
        }
    }

    static purgeCurrentWebTask(number) {
        //-1 for all
        if (this.wbs[0].length >= this.maxTask) {
            if (number > 0) {
                for (let i = 0; i < number; i++) {
                    this.switchTask(this.wbs[0][0]);
                }
            }
            else {
                for (let wt of this.wbs[0]) {
                    this.switchTask(wt);
                }
            }
            console.log("Purged " + number + " tasks");
        }
        else {
            this.switchTask(null);
            console.log("Purged no tasks.");
        }
    }

    static haveTasksForUrl(url, includeWaiting) {
        var i = 0;
        for (let wt of this.wbs[0]) {
            if (wt.url == url) i++;
        }
        if (includeWaiting) {
            for (let wt of this.waiting) {
                if (wt.url == url) i++;
            }
        }
        return i;
    }

    static stopWebTaskManually(url, includeWaiting) {
        for (let wt of this.wbs[0]) {
            if (wt.url == url && wt.stopTaskManually) this.switchTask(wt);
        }
        if (includeWaiting) {
            for (let wt of this.waiting) {
                if (wt.url == url && wt.stopTaskManually) this.switchTask(wt);
            }
        }
    }

    static getFirstTaskForUrl(url, includeWaiting) {
        for (let wt of this.wbs[0]) {
            if (wt.url == url) return wt;
        }
        if (includeWaiting) {
            for (let wt of this.waiting) {
                if (wt.url == url) return wt;
            }
        }
        return null;
    }
}
