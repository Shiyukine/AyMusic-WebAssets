import Utils from "./utils/utils.js";
import LoginPanel from "../ui/components/loginPanel/loginPanel.js"

export default class ApiManager {
    userId = "";
    apiKey = "";
    #anDico = {}
    countFailed = 0;
    disconnected = false
    cache = {}
    origin = "app://Cache"

    async init() {
        try {
            if (Utils.app.platform == "Android") this.origin = "https://mycache"
            let rep = await fetch(this.origin + "/API/index")
            let json = await rep.json()
            this.cache = json
        }
        catch {
            Utils.app.remoteClient.saveCache("API/index", new TextEncoder("utf-8").encode(JSON.stringify(this.cache)))
        }
    }

    refreshApiKey() {
        this.userId = Utils.actualAccount.id
        this.apiKey = Utils.actualAccount.apiKey
    }

    async getAccountInfo() {
        return await this.doPostRequest({ act: "getUserInfo" })
    }

    haveCache(body) {
        return JSON.stringify(body) in this.cache
    }

    fetchAPI(body, callback) {
        let result = "";
        if (JSON.stringify(body) in this.cache) {
            fetch(this.origin + "/API/" + this.cache[JSON.stringify(body)]).then(async rep => {
                let json = await rep.json()
                if (json) {
                    result = JSON.stringify(json)
                    if (callback) callback(json)
                }
            })
            this.doPostRequest(body).then(rep => {
                if (rep && result != JSON.stringify(rep)) {
                    if (callback) callback(rep)
                    Utils.app.remoteClient.saveCache("API/" + this.cache[JSON.stringify(body)], new TextEncoder("utf-8").encode(JSON.stringify(rep)))
                }
            })
        }
        else {
            this.doPostRequest(body).then(rep => {
                if (rep) {
                    this.cache[JSON.stringify(body)] = (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2)
                    if (callback) callback(rep)
                    Utils.app.remoteClient.saveCache("API/" + this.cache[JSON.stringify(body)], new TextEncoder("utf-8").encode(JSON.stringify(rep)))
                    Utils.app.remoteClient.saveCache("API/index", new TextEncoder("utf-8").encode(JSON.stringify(this.cache)))
                }
            })
        }
    }

    fetchAPIThenCache(body, callback) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000)
        this.doPostRequest(body, controller).then(rep => {
            if (rep) {
                if (JSON.stringify(body) in this.cache) {
                    if (callback) callback(rep)
                    Utils.app.remoteClient.saveCache("API/" + this.cache[JSON.stringify(body)], new TextEncoder("utf-8").encode(JSON.stringify(rep)))
                }
                else {
                    this.cache[JSON.stringify(body)] = (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2)
                    if (callback) callback(rep)
                    Utils.app.remoteClient.saveCache("API/" + this.cache[JSON.stringify(body)], new TextEncoder("utf-8").encode(JSON.stringify(rep)))
                    Utils.app.remoteClient.saveCache("API/index", new TextEncoder("utf-8").encode(JSON.stringify(this.cache)))
                }
            }
            else {
                if (JSON.stringify(body) in this.cache) {
                    fetch(this.origin + "/API/" + this.cache[JSON.stringify(body)]).then(async rep => {
                        let json = await rep.json()
                        if (json) {
                            if (callback) callback(json)
                        }
                    })
                }
            }
        })
    }

    async doPostRequest(content, controller = null) {
        //console.log("-> POST request : SENDING. Action : " + content.act)
        let start = Date.now();
        var newDico = {
            apiKey: this.apiKey
        }
        for (let i in content) {
            newDico[i] = content[i]
        }
        try {
            if (this.#anDico !== newDico) {
                this.#anDico = newDico
                //let result = await Utils.app.remoteClient.httpRequestPOST(Utils.servURL + "api/AyMusic/api.php", JSON.stringify(newDico))
                const rawResponse = await fetch(Utils.servURL + "api/AyMusic/api.php", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newDico),
                    signal: controller ? controller.signal : null
                });
                var result = await rawResponse.json();
                try {
                    if (result["success"]) {
                        //console.log("<- POST request : OK (" + (Date.now() - start) + "ms)")
                        this.countFailed = 0
                        if (this.disconnected) {
                            Utils.showMiniError(15, "Connected!", true, "rgb(0, 204, 255)", "#000")
                            this.disconnected = false
                        }
                        return result["content"];
                    }
                    else {
                        //console.log("<- POST request : ERROR (" + (Date.now() - start) + "ms)")
                        //console.error(result)
                        this.countFailed += 1
                        if (this.countFailed < 3) {
                            if (result["reason"].includes("Bad API key")) {
                                return new Promise((resolve) => {
                                    var logP = new LoginPanel("refresh");
                                    logP.style.display = "none"
                                    document.getElementById("main").appendChild(logP);
                                    logP.logged = async () => {
                                        resolve(await this.doPostRequest(content))
                                    };
                                })
                            }
                        }
                        else {
                            location.reload()
                        }
                    }
                }
                catch (e) {
                    //console.log("<- POST request : ERROR (" + (Date.now() - start) + "ms)")
                    Utils.newError("Error when fetching API", "This is the error:\n" + JSON.stringify(result))
                    console.error(result)
                    return;
                }
            }
            else return "You're being rate limited"
        }
        catch (e) {
            //console.log("<- POST request : ERROR (" + (Date.now() - start) + "ms)")
            Utils.showMiniError(15, "You are disconnected from the server")
            this.disconnected = true
            return;
        }
    }
}