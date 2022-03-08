import Utils from "./utils/utils.js";

export default class ApiManager {
    userId = "";
    apiKey = "";

    refreshApiKey() {
        this.userId = Utils.actualAccount.id
        this.apiKey = Utils.actualAccount.apiKey
    }

    async getAccountInfo() {
        let result = await Utils.app.remoteClient.httpRequestPOST(Utils.servURL + "api/AyMusic/api.php", JSON.stringify({
            apiKey: this.apiKey,
            act: "getUserInfo"
        }))
        console.log(result)
        if (typeof result["content"] !== "undefined") return JSON.parse(result["content"]);
        else return JSON.parse(result)
    }
}