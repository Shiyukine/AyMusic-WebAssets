export default class Singer {

    id = ""
    name = ""
    imgUrl = ""
    dateAdded = 0

    constructor(id, name, imgUrl, dateAdded = 0) {
        this.id = id;
        this.name = name;
        this.imgUrl = imgUrl;
        this.dateAdded = dateAdded;
        if (this.imgUrl === "")
            this.imgUrl = '/resources/icon.ico';
    }
}