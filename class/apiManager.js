import Utils from "./utils/utils.js";

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
        if (this.#anDico !== newDico) {
            this.#anDico = newDico
            let result = await Utils.app.remoteClient.httpRequestPOST(Utils.servURL + "api/AyMusic/api.php", JSON.stringify(newDico))
            try {
                result = JSON.parse(result)["content"];
                console.log("<- POST request : OK (" + (Date.now() - start) + "ms)")
                return result;
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
}