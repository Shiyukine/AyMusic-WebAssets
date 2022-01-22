export default class AyMusic
{
    remoteClient = null;
    #eventEl = document.createElement("event");
    settings = {
        lang: "English",
        theme: "Dark",
        adblock: true,
        createMix: false,
        discordRPC: true,
        writeLogs: false,
        volume: 66,
        skipSilence: false
    }

    constructor()
    {
        this.loaded = function () { }
    }

    /**
    * @param {String} platform The platform
    * @param {String} versionName Name of the actual version
    * @param {Number} versionId ID version
    * @param {Object} remoteClient Object to send information on the client
    */
    async registerClient(platform, versionName, versionId, remoteClient)
    {
        try
        {
            this.platform = platform;
            this.versionName = versionName;
            this.versionId = versionId;
            this.remoteClient = remoteClient;
            let newS = JSON.parse(await this.remoteClient.getSettingFile())
            if (newS)
            {
                Array.from(this.settings).forEach(x =>
                {
                    if (!Array.from(newS).includes(x))
                    {
                        console.warn("Adding settings which didn't exists : " + x)
                        newS[x] = this.settings[x]
                    }
                })
                this.settings = newS
            }
            else
            {
                this.remoteClient.changeSettingFile(JSON.stringify(this.settings))
                console.warn("No settings imported. Creating new setting file")
            }
            this.#eventEl.dispatchEvent(new CustomEvent("loaded"));
        }
        catch (e)
        {
            console.error(e)
        }
    }

    set loaded(callback)
    {
        this.addEventListener("loaded", callback)
    }

    changeSetting(settingName, value)
    {
        this.settings[settingName] = value
        this.remoteClient.changeSettingFile(JSON.stringify(this.settings))
    }

    getSetting(settingName)
    {
        return this.settings[settingName]
    }

    changeLanguage(language)
    {
        this.changeSetting("lang", language)
        this.#eventEl.dispatchEvent(new CustomEvent("langchanged"));
    }

    addEventListener(event, callback)
    {
        this.#eventEl.addEventListener(event, callback)
    }
}