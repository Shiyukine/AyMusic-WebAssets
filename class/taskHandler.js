import Utils from "./utils/utils.js";

export default class TaskHandler {
    static wbs = [[], []];
    static waiting = [];
    static maxTask = 5;
    static allowBgTask = true;

    static addTask(url, script, urgent, displayFailError, stopTaskManually, callback) {
        var wt = {
            id: Date.now(),
            url: url,
            script: script,
            displayFailError: displayFailError,
            stopTaskManually: stopTaskManually,
            callback: callback
        };
        if (this.wbs[0].length < this.maxTask || urgent) {
            if (urgent) {
                this.waiting.splice(0, 0, wt);
                this.purgeCurrentWebTask(1);
            }
            else {
                this.createTask(wt);
            }
            console.log("Added new task. Url : " + url + ". Urgent : " + urgent + ". " + (this.wbs[0].length + this.waiting.length) + " remaining task");
        }
        else {
            this.waiting.push(wt);
            console.log("Added new task in waiting list. Url : " + url + ". " + (this.wbs[0].length + this.waiting.length) + " remaining task");
        }
    }

    static async createTask(wt) {
        var iframe = document.createElement("iframe");
        iframe.width = 1280;
        iframe.height = 720;
        var adblockcount = 0;
        var iscf = false;
        Utils.app.remoteClient.registerIframeUrl(wt.url, `addEventListener('message', (e) =>
            {
                if(e.origin.includes('app://root'))
                {
                    if(e.data.message == 'js')
                    {
                        parent.postMessage({message: 'callback', data:(() => { ` + wt.script + `})(), id: e.data.id}, 'app://root')
                    }
                }
            })`)
        iframe.onload = async () => {
            wt.callback(await TaskHandler.postJs(iframe, wt))
            if (!wt.stopTaskManually) this.switchTask(wt)
        }
        iframe.allow = "encrypted-media"
        iframe.src = wt.url;
        document.getElementById("iframes").appendChild(iframe)
        this.wbs[0].push(wt);
        this.wbs[1].push(iframe);
        console.log("Task in process : " + wt.url);
    }

    static postJs(iframe, wt) {
        return new Promise((resolve) => {
            window.addEventListener("message", (e) => {
                if (/*e.origin == Utils.servURL.slice(0, -1) &&*/ e.data.id == wt.id) {
                    if (e.data.message == "callback") {
                        resolve(e.data.data)
                    }
                }
            })
            iframe.contentWindow.postMessage({ message: "js", id: wt.id }, wt.url)
        })
    }

    /*private static void bypassCf(string url)
    {
    DONT USE CEF
        bool iscf = false;
        CefSharp.WinForms.ChromiumWebBrowser cwb = new CefSharp.WinForms.ChromiumWebBrowser(url);
        cwb.FrameLoadEnd += async (sender, e) =>
        {
            bool b = e.Frame.IsMain;
            string a = await e.Browser.MainFrame.GetTextAsync();
            iscf = a.Contains("CAPTCHA");
            (Form.ActiveForm as MainForm).Invoke(new MainForm.UICallback(() =>
            {
                if (b)
                {
                    if (!iscf)
                    {

                        (Form.ActiveForm as MainForm).Controls.Remove(cwb);
                        cwb.GetBrowser().CloseBrowser(true);
                        cwb.GetBrowserHost().TryCloseBrowser();
                        cwb.Dispose();
                        MainForm.newErr(new Exception("Captcha passed !"), "");
                    }
                    else
                    {
                        cwb.BringToFront();
                        (Form.ActiveForm as MainForm).Controls.Add(cwb);
                        MainForm.newErr("Please complete the Captcha to continue.", "");
                    }
                }
            }));
        };
    }*/

    static switchTask(wt) {
        if (this.wbs[0].length > 0 && wt != null) {
            document.getElementById("iframes").removeChild(this.wbs[1][this.wbs[0].indexOf(wt)])
            this.wbs[1].splice(this.wbs[0].indexOf(wt), 1)
            this.wbs[0].splice(this.wbs[0].indexOf(wt), 1)
            console.log("Task url : " + wt.url + " has finished. " + (this.wbs[0].length + this.waiting.length) + " remaining task");
        }
        //var b = this.wbs[0].length == 0;
        if (this.waiting.length > 0) {
            var nwt = this.waiting[0];
            this.createTask(nwt);
            this.waiting.splice(this.waiting.indexOf(nwt), 1);
            console.log("Switched 1 task. Url of new task : " + nwt.url + ". " + (this.wbs[0].length + this.waiting.length) + " remaining task");
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

    /*public static void pauseAll(bool pause) {
        try {
            if (pause) {
                foreach(KeyValuePair < WebTask, WebView2 > keys in wbs)
                {
                    if (keys.Value.CoreWebView2 != null) keys.Value.Stop();
                    else keys.Value.Dispose();
                }
                MainForm.addLog("WebTask", "Paused.");
            }
            else {
                foreach(KeyValuePair < WebTask, WebView2 > keys in wbs)
                {
                    keys.Value.Reload();
                }
                MainForm.addLog("WebTask", "Reloading...");
            }
        }
        catch (Exception e)
        {
            MainForm.newErr(e, "Uh, we can't pause background task");
        }
    }*/

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
}
