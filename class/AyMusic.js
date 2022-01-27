export default class AyMusic
{
    remoteClient = null;
    #eventEl = document.createElement("event");
    settings = {
        gen_langs: "English",
        gen_theme: "Dark",
        gen_discordRPC: true,
        gen_logs: false,
        music_adblock: true,
        music_createMix: false,
        music_vol: 66,
        music_skipS: false
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
            let newS = await this.remoteClient.getSettingFile()
            if (newS)
            {
                newS = JSON.parse(newS)
                for(var x in this.settings)
                {
                    if (typeof newS[x] === "undefined")
                    {
                        console.warn("Adding settings which didn't exists : " + x)
                        newS[x] = this.settings[x]
                    }
                }
                this.settings = newS   
            }
            else
            {
                console.warn("No settings imported. Creating new setting file")
            }
            this.remoteClient.changeSettingFile(JSON.stringify(this.settings))
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
        console.log("Setting : " + settingName + " is changed to : " + value)
    }

    getSetting(settingName)
    {
        console.log("Getting setting : " + settingName + ". Value : " + this.settings[settingName])
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