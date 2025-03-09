export default class Singer {

    id = ""
    name = ""
    imgUrl = ""
    dateAdded = 0
    aliasName = ""
    singerUrl = ""

    constructor(id, name, imgUrl, singerUrl, dateAdded = 0, aliasName = "") {
        this.id = id;
        this.name = name ? name.trim() : name;
        this.imgUrl = imgUrl;
        this.dateAdded = dateAdded;
        this.aliasName = aliasName ? aliasName.trim() : aliasName;
        this.singerUrl = singerUrl;
        if (this.imgUrl === "")
            this.imgUrl = '/resources/icon.ico';
    }
}