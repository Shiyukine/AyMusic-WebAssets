import LocalMusicHandler from "../utils/localMusicHandler.js"
import Singer from "./singer.js"

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
    aliasSongSingerName = ""
    canBeLoaded = true
    singerUrl = ""
    albumUrl = ""
    /**
     * @type {Array<{aliasSingerName: String, singerID: String, singerImgUrl: String, singerName: String, singerUrl: String}>}
     */
    additionalSingers = []

    constructor(id, url, positionOrDate, title, imgUrl, time, isExplicit, addedBy, cropStart, cropEnd, singerID, singerName, albumName, albumID, albumUrl, singerUrl, additionalSingers = [], aliasTitle = "", aliasSongSingerName = "", aliasSingerName = "") {
        this.id = id;
        this.url = url;
        this.positionOrDate = positionOrDate;
        this.title = (title || "").trim();
        this.imgUrl = imgUrl;
        this.time = time;
        this.isExplicit = isExplicit;
        this.addedBy = addedBy;
        this.cropStart = cropStart;
        this.cropEnd = cropEnd;
        this.singerID = singerID;
        this.singerName = (singerName || "").trim();
        this.albumName = (albumName || "").trim();
        this.albumID = albumID;
        this.aliasTitle = (aliasTitle || "").trim();
        this.singerUrl = singerUrl;
        this.albumUrl = albumUrl;
        this.additionalSingers = additionalSingers;
        if (aliasTitle == "") this.aliasTitle = null;
        this.aliasSingerName = (aliasSingerName || "").trim();
        if (aliasSingerName == "") this.aliasSingerName = null;
        this.aliasSongSingerName = (aliasSongSingerName || "").trim();
        if (aliasSongSingerName == "") this.aliasSongSingerName = null;
        if (this.aliasSongSingerName != null) this.aliasSingerName = (this.aliasSongSingerName || "").trim();
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
                // added actual account id to avoid conflict between users, see localMusicHandler.js
                this.url = this.url.split("_")[0]
            }
            catch (e) {
                //console.error("Unable to get local data for a song.")
                this.canBeLoaded = false
            }
        }
    }
}