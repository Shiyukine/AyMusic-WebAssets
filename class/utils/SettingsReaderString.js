export default class SettingsReaderString
{
    constructor(text)
    {
        this.text = text
        this.table = [[], []]
        if (text)
        {
            var lines = []
            lines = text.split("\n")
            if (text.includes("\r"))
                lines = text.split("\r\n")
            lines.forEach(x =>
            {
                var set = x.split(" = ")
                if (set[0] != "")
                {
                    this.table[0].push(set[0])
                    this.table[1].push(set[1])
                }
                else console.error("Enter empty string!")
            });
        }
    }

    getAll()
    {
        return this.table
    }

    getSettings()
    {
        return this.table[0]
    }

    getString(setting)
    {
        let set = this.table[1][this.table[0].indexOf(setting)]
        if (set == undefined) throw "Value not found!"
        return set
    }

    getInt(setting)
    {
        var set = this.getString(setting)
        return parseInt(set)
    }

    getFloat(setting)
    {
        var set = this.getString(setting)
        return parseFloat(set)
    }

    getBoolean(setting)
    {
        var set = this.getString(setting)
        return (set == "True" || set == "true" ? true : false)
    }

    getArray(setting)
    {
        var set = this.getString(setting)
        return set.split(";")
    }

    settingExists(setting)
    {
        return this.table[1][this.table[0].indexOf(setting)] != undefined
    }
}