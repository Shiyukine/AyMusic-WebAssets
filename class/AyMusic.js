export default class AyMusic
{
    remoteClient = null;
    #eventEl = null;
    settings = {}

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
            this.settings = JSON.parse(await this.remoteClient.getSettingFile())
            if (!this.settings)
            {
                console.error("There are no settings imported !")
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
        this.#eventEl = document.createElement("event")
        this.#eventEl.addEventListener("loaded", callback)
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
}