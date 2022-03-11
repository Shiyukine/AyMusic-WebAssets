export default class Song {

    id = ""
    url = ""
    positionOrDate = ""
    title = ""
    imgUrl = ""
    time = ""
    isExplicit = false
    addedBy = ""
    cropStart = 0
    cropEnd = -1
    singerID = ""
    singerName = ""

    constructor(id, url, positionOrDate, title, imgUrl, time, isExplicit, addedBy, cropStart, cropEnd, singerID, singerName) {
        this.id = id;
        this.url = url;
        this.positionOrDate = positionOrDate;
        this.title = title
        this.imgUrl = imgUrl;
        this.time = time;
        this.isExplicit = isExplicit;
        this.addedBy = addedBy;
        this.cropStart = cropStart;
        this.cropEnd = cropEnd;
        this.singerID = singerID;
        this.singerName = singerName;
        if (this.imgUrl === "")
            this.imgUrl = '/resources/icon.ico';
    }
}