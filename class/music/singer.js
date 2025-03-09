export default class Singer {

    id = ""
    name = ""
    imgUrl = ""
    dateAdded = 0
    aliasName = ""
    singerUrl = ""

    constructor(id, name, imgUrl, singerUrl, dateAdded = 0, aliasName = "") {
        this.id = id;
        this.name = name.trim();
        this.imgUrl = imgUrl;
        this.dateAdded = dateAdded;
        this.aliasName = aliasName.trim();
        this.singerUrl = singerUrl;
        if (this.imgUrl === "")
            this.imgUrl = '/resources/icon.ico';
    }
}