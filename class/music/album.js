export default class Album {

    id = ""
    name = ""
    singerID = ""
    type = ""
    dateAdded = 0;
    imgUrl = ""
    albumUrl = ""

    constructor(id, name, singerID, type, imgUrl, albumUrl, datedAdded = 0) {
        this.id = id;
        this.name = name;
        this.imgUrl = imgUrl;
        this.singerID = singerID;
        this.type = type;
        this.dateAdded = datedAdded;
        this.albumUrl = albumUrl;
        if (this.imgUrl === "")
            this.imgUrl = '/resources/icon.ico';
    }
}