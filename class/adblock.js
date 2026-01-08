import Utils from "./utils/utils.js";

export default class Adblock {
    static cache = {}
    static origin = "app://cache"

    static async init() {
        try {
            if (Utils.app.platform == "Android") this.origin = "https://mycache"
            let rep = await fetch(this.origin + "/Adblock/index")
            let json = await rep.json()
            this.cache = json
        }
        catch {
            Utils.app.remoteClient.saveCache("Adblock/index", new TextEncoder("utf-8").encode(JSON.stringify(this.cache)))
        }
        await this.loadFilter("https://pgl.yoyo.org/adservers/serverlist.php?hostformat=hosts&showintro=1&mimetype=plaintext", (url) => {
            if (url.startsWith("||")) {
                return url.replace("||", "").split('^')[0]
            }
        });
        await this.loadFilter("https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_2_Base/filter.txt", (url) => {
            if (url.startsWith("127.0")) {
                var u = url.split(' ');
                return u[1];
            }
            if (url.startsWith("||")) {
                return url.replace("||", "").split('^')[0];
            }
        });
        await this.loadFilter("https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_3_Spyware/filter.txt", (url) => {
            if (url.startsWith("127.0")) {
                var u = url.split(' ');
                return u[1];
            }
            if (url.startsWith("||")) {
                return url.replace("||", "").split('^')[0];
            }
        });
        await this.loadFilter("https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_11_Mobile/filter.txt", (url) => {
            if (url.startsWith("127.0")) {
                var u = url.split(' ');
                return u[1];
            }
            if (url.startsWith("||")) {
                return url.replace("||", "").split('^')[0];
            }
        });
        await this.loadFilter("https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_15_DnsFilter/filter.txt", (url) => {
            if (url.startsWith("127.0")) {
                var u = url.split(' ');
                return u[1];
            }
            if (url.startsWith("||")) {
                return url.replace("||", "").split('^')[0];
            }
        });
        await this.loadFilter("https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_14_Annoyances/filter.txt", (url) => {
            if (url.startsWith("127.0")) {
                var u = url.split(' ');
                return u[1];
            }
            if (url.startsWith("||")) {
                return url.replace("||", "").split('^')[0];
            }
        });
        await this.loadFilter(Utils.servURL + "/dl/Anime%20Hub/Scripts/adblock.txt", (url) => {
            if (url.startsWith("||")) {
                return url.replace("||", "");
            }
        });
        await this.loadFilter("https://raw.githubusercontent.com/marcelbohland/Android-Webview-Adblock-Example/master/app/src/main/res/raw/adblockserverlist.txt", (url) => {
            return url.split(":::::").join("")
        })
        console.log("Adblock loaded")
    }

    static async loadFilter(url, cb) {
        try {
            console.log("Loading ad filter: " + url)
            if (url in this.cache) {
                if (Date.now() - this.cache[url][1] < 7 * 24 * 60 * 60 * 1000) {
                    let rep = await fetch(this.origin + "/Adblock/" + this.cache[url][0])
                    let json = await rep.text()
                    let out = json.split("\n")
                    let toAdd = []
                    out.forEach(x => {
                        let ret = cb(x)
                        if (ret != null) toAdd.push(ret)
                    })
                    if (Utils.app.remoteClient.addBadUrl) Utils.app.remoteClient.addBadUrl(toAdd)
                }
                else {
                    console.log("Downloading new filter ad, reason: expired")
                    let raw = await fetch(url)
                    let rep = await raw.text()
                    Utils.app.remoteClient.saveCache("Adblock/" + this.cache[url][0], new TextEncoder("utf-8").encode(rep))
                    //
                    let out = rep.split("\n")
                    out.forEach(x => {
                        let ret = cb(x)
                        if (Utils.app.remoteClient.addBadUrl && ret != null) Utils.app.remoteClient.addBadUrl(ret)
                    })
                }
            }
            else {
                console.log("Downloading new filter ad, reason: not exist")
                this.cache[url] = [(Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2), Date.now()]
                let raw = await fetch(url)
                let rep = await raw.text()
                Utils.app.remoteClient.saveCache("Adblock/" + this.cache[url][0], new TextEncoder("utf-8").encode(rep))
                Utils.app.remoteClient.saveCache("Adblock/index", new TextEncoder("utf-8").encode(JSON.stringify(this.cache)))
            }
            console.log("Ad filter loaded")
        }
        catch (e) {
            Utils.newError("Unable to load adblock", "Url: " + url + "\n" + e)
        }
    }
}