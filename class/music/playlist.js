import Utils from "../../../class/utils/utils.js";

export default class Playlist {

    id = ""
    name = ""
    userID = ""
    desc = ""
    imgUrl = ""
    isPrivate = false
    rank = 0

    constructor(id, name, userID, desc, imgUrl, isPrivate, rank) {
        this.id = id;
        this.name = name;
        this.userID = userID;
        this.desc = desc;
        this.imgUrl = imgUrl;
        this.isPrivate = isPrivate;
        this.rank = rank;
        if (this.imgUrl === "")
            this.imgUrl = '/resources/icon.ico';
    }
}