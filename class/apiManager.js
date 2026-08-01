import Utils from "./utils/utils.js";
import LoginPanel from "../ui/components/loginPanel/loginPanel.js"

export default class ApiManager {
    userId = "";
    apiKey = "";
    #anDico = {}
    countFailed = 0;
    disconnected = false
    cache = {}
    origin = "app://cache"
    /**
     * @type {EventTarget}
     */
    event = null;
    alreadyWaitingLogin = false;

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
                    if (callback) callback(json, true)
                }
            })
            this.doPostRequest(body).then(rep => {
                if (rep && result != JSON.stringify(rep)) {
                    if (rep.success !== false) {
                        if (callback) callback(rep, false)
                        Utils.app.remoteClient.saveCache("API/" + this.cache[JSON.stringify(body)], new TextEncoder("utf-8").encode(JSON.stringify(rep)))
                    }
                    else console.error("Error from API:", rep["reason"])
                }
            })
        }
        else {
            this.doPostRequest(body).then(rep => {
                if (rep) {
                    if (rep.success !== false) {
                        this.cache[JSON.stringify(body)] = (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2)
                        if (callback) callback(rep, false)
                        Utils.app.remoteClient.saveCache("API/" + this.cache[JSON.stringify(body)], new TextEncoder("utf-8").encode(JSON.stringify(rep)))
                        Utils.app.remoteClient.saveCache("API/index", new TextEncoder("utf-8").encode(JSON.stringify(this.cache)))
                    }
                    else console.error("Error from API:", rep["reason"])
                }
            })
        }
    }

    async doPostRequest(content, retry = 0) {
        //console.log("-> POST request : SENDING. Action : " + content.act)
        var newDico = {
            apiKey: this.apiKey,
            platform: Utils.app.platform,
            version: Utils.app.versionId,
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
                    body: JSON.stringify(newDico)
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
                        if (result["reason"].includes("Bad API key")) {
                            if (!this.alreadyWaitingLogin) {
                                this.alreadyWaitingLogin = true;
                                this.event = document.createElement("event");
                                var logP = new LoginPanel("refresh");
                                logP.style.display = "none"
                                document.getElementById("main").appendChild(logP);
                                logP.notConnected = () => {
                                    logP.style.display = ""
                                }
                                logP.logged = async () => {
                                    this.userId = Utils.actualAccount.id
                                    this.apiKey = Utils.actualAccount.apiKey
                                    this.event.dispatchEvent(new Event("apiKeyRefreshed"));
                                    this.alreadyWaitingLogin = false;
                                };
                            }
                            return new Promise((resolve) => {
                                this.event.addEventListener("apiKeyRefreshed", async () => {
                                    let rep = await this.doPostRequest(content)
                                    resolve(rep)
                                })
                            })
                        }
                        else return result
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
            let delay = 1000 * Math.pow(2, retry)
            if (delay > 30000) delay = 30000
            await Utils.delay(delay)
            return await this.doPostRequest(content, retry + 1)
        }
    }
}