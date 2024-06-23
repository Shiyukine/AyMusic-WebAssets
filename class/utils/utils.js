import ApiManager from "../apiManager.js";
import RemoteApp from "../remoteapp.js";

export default class Utils {
    static useLocalServer = true
    static servURL = ""
    static realServURL = ""
    static actualAccount =
        {
            name: "Unknown",
            id: "Unknown",
            email: "Unknown",
            avatarUrl: "/resources/noavatar.png",
            apiKey: "",
        }

    static app = new RemoteApp();
    static apiManager = new ApiManager();

    static pathsData = [];

    static delay(ms) {
        return new Promise(resolve => setTimeout(() => resolve(), ms))
    }

    static currentMiniErrorID = -1

    static async showMiniError(miniErrorID, info, temp = false, colorBg = "", colorText = "") {
        console.error(info)
        document.getElementById("miniInfoP").innerHTML = info
        document.getElementById("miniInfoP").style.color = colorText
        document.getElementById("miniInfo").style.backgroundColor = colorBg
        document.getElementById("miniInfo").classList.add("showInfo")
        document.getElementById("main").classList.add("infoShown")
        document.getElementById("iframes").style.height = "calc(100% - 75px)"
        document.getElementById("bgImgContainer").classList.add("infoShown")
        Utils.currentMiniErrorID = miniErrorID
        if (temp) {
            setTimeout(() => {
                Utils.hideMiniError(miniErrorID)
            }, 3000);
        }
    }

    static async hideMiniError(miniErrorID) {
        if (miniErrorID == Utils.currentMiniErrorID) {
            document.getElementById("miniInfo").ontransitionend = () => {
                document.getElementById("miniInfoP").style.color = ""
                document.getElementById("miniInfo").style.backgroundColor = ""
                document.getElementById("iframes").style.height = "calc(100% - 36px)"
                document.getElementById("miniInfo").ontransitionend = () => { }
            }
            document.getElementById("miniInfo").classList.remove("showInfo")
            document.getElementById("main").classList.remove("infoShown")
            document.getElementById("bgImgContainer").classList.remove("infoShown")
            Utils.currentMiniErrorID = -1
        }
    }

    static msToTime(duration) {
        var milliseconds = Math.floor((duration % 1000) / 100),
            seconds = Math.floor((duration / 1000) % 60),
            minutes = Math.floor((duration / (1000 * 60)) % 60),
            hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

        var thours = hours > 0 ? hours + ":" : "";
        var tminutes = (hours > 0 && minutes < 10 ? "0" + minutes : minutes) + ":";
        var tseconds = seconds < 10 ? "0" + seconds : seconds;

        return thours + tminutes + tseconds/* + "." + milliseconds*/;
    }

    static findIndexOfLike(node) {
        var children = Array.prototype.filter.call(node.parentNode.children, function (child) {
            return node.tagName === child.tagName;
        });
        return children.indexOf(node);

    }

    static createIndexedPathTo(node) {
        var path = [],
            current = node;
        while (current.tagName.toLowerCase() !== 'body') {
            path.push(current.tagName.toLowerCase() + '[' + Utils.findIndexOfLike(current) + ']');
            current = current.parentNode;
        }
        path.push('body[0]');
        return path.reverse().join('.');
    }

    static getOrigin() {
        let origin = "app://root"
        if (Utils.app.platform == "Android") origin = "https://myapp"
        if (!Utils.app.isRelease) origin = "http://localhost:3000"
        return origin
    }

    static async sendSWMessage(message) {
        // This wraps the message posting/response in a promise, which will
        // resolve if the response doesn't contain an error, and reject with
        // the error if it does. If you'd prefer, it's possible to call
        // controller.postMessage() and set up the onmessage handler
        // independently of a promise, but this is a convenient wrapper.
        return new Promise(function (resolve, reject) {
            var messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = function (event) {
                if (event.data.error) {
                    reject(event.data.error);
                } else {
                    resolve(event.data);
                }
            };
            // This sends the message data as well as transferring
            // messageChannel.port2 to the service worker.
            // The service worker can then use the transferred port to reply
            // via postMessage(), which will in turn trigger the onmessage
            // handler on messageChannel.port1.
            // See
            // https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
            navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
        });
    }
}