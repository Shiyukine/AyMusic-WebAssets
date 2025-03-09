export default class Playlist {

    id = ""
    name = ""
    userID = ""
    desc = ""
    imgUrl = ""
    isPrivate = false
    rank = 0
    dateAdded = 0

    constructor(id, name, userID, desc, imgUrl, isPrivate, rank, dateAdded = 0) {
        this.id = id;
        this.name = name ? name.trim() : name;
        this.userID = userID;
        this.desc = desc;
        this.imgUrl = imgUrl;
        this.isPrivate = isPrivate;
        this.rank = rank;
        this.dateAdded = dateAdded;
        if (this.imgUrl === "")
            this.imgUrl = '/resources/icon.ico';
    }
}