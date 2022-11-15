import Utils from "./utils/utils.js";
import LoginPanel from "../ui/components/loginPanel/loginPanel.js"

export default class ApiManager {
    userId = "";
    apiKey = "";
    #anDico = {}

    refreshApiKey() {
        this.userId = Utils.actualAccount.id
        this.apiKey = Utils.actualAccount.apiKey
    }

    async getAccountInfo() {
        return await this.doPostRequest({ act: "getUserInfo" })
    }

    async doPostRequest(content) {
        console.log("-> POST request : SENDING. Action : " + content.act)
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
                let result = await Utils.app.remoteClient.httpRequestPOST(Utils.servURL + "api/AyMusic/api.php", JSON.stringify(newDico))
                try {
                    result = JSON.parse(result);
                    if (result["success"]) {
                        console.log("<- POST request : OK (" + (Date.now() - start) + "ms)")
                        return result["content"];
                    }
                    else {
                        console.log("<- POST request : ERROR (" + (Date.now() - start) + "ms)")
                        console.error(result)
                        if (result["reason"].includes("API")) {
                            return new Promise((resolve) => {
                                var logP = new LoginPanel("refresh");
                                logP.style.display = "none"
                                document.getElementById("main").appendChild(logP);
                                logP.logged = async () => {
                                    resolve(this.doPostRequest(content))
                                };
                            })
                        }
                    }
                }
                catch (e) {
                    console.log("<- POST request : ERROR (" + (Date.now() - start) + "ms)")
                    console.error(result)
                    return result;
                }
            }
            else return {
                content: "You're being rate limited"
            }
        }
        catch (e) {
            console.log("<- POST request : ERROR (" + (Date.now() - start) + "ms)")
            Utils.newError("Can't connect to the server", "The server is offline or maybe there is a maintenance.\nPlease wait.")
            return e;
        }
    }
}