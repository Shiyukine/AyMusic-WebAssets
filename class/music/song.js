import LocalMusicHandler from "../utils/localMusicHandler.js"
import * as id3 from "../../plugins/id3/id3.js"

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
    albumName = ""
    img = null
    albumID = ""
    aliasTitle = ""
    aliasSingerName = ""
    canBeLoaded = true

    constructor(id, url, positionOrDate, title, imgUrl, time, isExplicit, addedBy, cropStart, cropEnd, singerID, singerName, albumName, albumID, aliasTitle = "", aliasSingerName = "") {
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
        this.albumName = albumName;
        this.albumID = albumID;
        this.aliasTitle = aliasTitle;
        if (aliasTitle == "") this.aliasTitle = null
        this.aliasSingerName = aliasSingerName;
        if (aliasSingerName == "") this.aliasSingerName = null
        if (this.imgUrl === "")
            this.imgUrl = '/resources/icon.ico';
        if (this.imgUrl === "localImg") {
            try {
                var si = LocalMusicHandler.getArtistByMusicID(id)
                var al = LocalMusicHandler.getAlbumByMusicID(id)
                this.singerName = si.name
                this.albumName = al.name
                this.albumID = al.id
                this.singerID = si.id
            }
            catch (e) {
                //console.error("Unable to get local data for a song.")
                this.canBeLoaded = false
            }
        }
    }
}