export default class Singer {

    id = ""
    name = ""
    imgUrl = ""
    dateAdded = 0
    aliasName = ""

    constructor(id, name, imgUrl, dateAdded = 0, aliasName = "") {
        this.id = id;
        this.name = name;
        this.imgUrl = imgUrl;
        this.dateAdded = dateAdded;
        this.aliasName = aliasName;
        if (this.imgUrl === "")
            this.imgUrl = '/resources/icon.ico';
    }
}