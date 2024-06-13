import Utils from "../utils/utils.js";
import Singer from "../music/singer.js";
import Album from "../music/album.js";
import InfoPanel from "../../ui/components/infoPanel/infoPanel.js";
import GetMusicTag from "./getMusicTag.js";

export default class LocalMusicHandler {

    //obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, 
    //obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName

    /**
     * @type {[{musicID:String, albumID:String, singerID:String}]}
     */
    static musics = []

    /**
     * @type {[Singer]}
     */
    static singers = []
    static singerUnknownID = "si_----------------"

    /**
     * @type {[Album]}
     */
    static albums = []
    static albumUnknownID = "al_----------------"

    static init() {
        this.singers.push(new Singer(this.singerUnknownID, "Unknown artist", "", Date.now()))
        this.albums.push(new Album(this.albumUnknownID, "Unknown album", this.singerUnknownID, "Album", "", Date.now()))
    }

    static async filePicker() {
        if (Utils.app.platform == "Android") {
            Utils.app.remoteClient.pickUpMusic()
            return new Promise(resolve => {
                window.listeners.filePickerCallback = (urls) => {
                    window.listeners.filePickerCallback = () => { }
                    resolve(urls)
                }
            })
        }
        else {
            return await Utils.app.remoteClient.pickUpMusic()
        }
    }

    static addLocalSinger(name) {
        var id = this.generateId();
        var filt = this.singers.filter(sing => sing.name == name);
        if (filt.length == 0) {
            var sing = new Singer(id, name, "", Date.now())
            this.singers.push(sing)
            return sing
        }
        else return filt[0]
    }

    static addLocalAlbum(name, singerName) {
        var id = this.generateId()
        var filt = this.albums.filter(al => al.name == name)
        if (filt.length == 0) {
            var al = new Album(id, name, this.addLocalSinger(singerName).id, "Album", "", Date.now())
            this.albums.push(al)
            return al
        }
        else return filt[0]
    }

    static async getLocalLibrary() {
        var result = await Utils.app.remoteClient.getUserSettingsFile("UserMusics.json")
        if (result) LocalMusicHandler.musics = JSON.parse(result);
        var result3 = await Utils.app.remoteClient.getUserSettingsFile("UserAlbums.json")
        if (result3) LocalMusicHandler.albums = JSON.parse(result3);
        var result4 = await Utils.app.remoteClient.getUserSettingsFile("UserArtists.json")
        if (result4) LocalMusicHandler.singers = JSON.parse(result4);
        console.log("Local library refreshed")
    }

    static async setLocalLibrary() {
        await Utils.app.remoteClient.changeUserSettingsFile("UserMusics.json", JSON.stringify(LocalMusicHandler.musics))
        await Utils.app.remoteClient.changeUserSettingsFile("UserAlbums.json", JSON.stringify(LocalMusicHandler.albums))
        await Utils.app.remoteClient.changeUserSettingsFile("UserArtists.json", JSON.stringify(LocalMusicHandler.singers))
        console.log("User's local library files updated")
    }

    static async addMusic() {
        console.log("Adding song to liked song... Waiting user choose")
        var allMusics = []
        var musicInfo = []
        var urls = await LocalMusicHandler.filePicker()
        let isOk = true;
        let counter = 0;
        for (let i in urls) {
            let nurl = urls[i][0]
            let nbaseFileName = urls[i][1]
            let result = LocalMusicHandler.getLocalUrl() + nurl
            var gmt = new GetMusicTag(result, nbaseFileName)
            gmt.getTags().then(async (tags) => {
                let artist = LocalMusicHandler.addLocalSinger(tags != null && tags.artist != null ? tags.artist : "Unknown artist")
                console.log("Added new local artist : " + artist.id.replace("si_", ""))
                let album = LocalMusicHandler.addLocalAlbum(tags != null && tags.album != null ? tags.album : "Unknown album", tags != null && tags.artist != null ? tags.artist : "Unknown artist")
                console.log("Added new local album : " + album.id.replace("al_", "") + ", artist : " + album.singerID.replace("si_", ""))
                // added actual account id to avoid conflict between users
                allMusics.push([result + "_" + Utils.actualAccount.id, tags != null && tags.title != null ? tags.title : null, "localImg", tags.duration])
                if (tags != null && tags.image != null) {
                    let imgD = tags.image
                    if (Utils.app.platform == "Android") {
                        var bytes = new Uint8Array(tags.image);
                        imgD = []
                        for (let i = 0; i < bytes.byteLength; i++) {
                            imgD.push(bytes[i])
                        }
                    }
                    musicInfo.push([artist.id, album.id, imgD])
                }
                else musicInfo.push([artist.id, album.id, null])
                counter++
                if (counter == urls.length) {
                    let apiResult = await Utils.apiManager.doPostRequest({
                        act: "addMultipleSongsLocal",
                        songs: allMusics
                    })
                    if (apiResult["success"] !== false) {
                        for (let j in apiResult) {
                            let musicID = apiResult[j]
                            let mi = musicInfo[j]
                            LocalMusicHandler.musics.push({
                                musicID: musicID,
                                albumID: mi[1],
                                singerID: mi[0]
                            })
                            try {
                                await Utils.app.remoteClient.saveData("Image/" + musicID + ".png", mi[2])
                            }
                            catch (e) {

                            }
                            isOk = isOk && await Utils.libManager.addObjToLikedSongs("so_" + musicID)
                            //avoid small ddos
                            await Utils.delay(100);
                        }
                        if (isOk) {
                            LocalMusicHandler.setLocalLibrary()
                            let ip = new InfoPanel("Success", "Song added to liked songs !", [{
                                text: "OK", isPositive: true, onclick: () => {
                                    ip.close()
                                }
                            }])
                            document.getElementById("main").appendChild(ip)
                            ip.show()
                        }
                    }
                    else {
                        let ip = new InfoPanel("Error", "We can't add this music to your liked songs.\nConcerned song : " + nurl + "\nPlease verify your file.", [{
                            text: "OK", isPositive: true, onclick: () => {
                                ip.close()
                            }
                        }])
                        document.getElementById("main").appendChild(ip)
                        ip.show()
                    }
                }
            })
        }
    }

    static getAlbumByMusicID(musicID) {
        for (let music of LocalMusicHandler.musics) {
            if (music.musicID == musicID) {
                for (let album of LocalMusicHandler.albums) {
                    if (album.id == music.albumID) {
                        return album
                    }
                }
            }
        }
        return null;
    }

    static getArtistByMusicID(musicID) {
        for (let music of LocalMusicHandler.musics) {
            if (music.musicID == musicID) {
                for (let artist of LocalMusicHandler.singers) {
                    if (artist.id == music.singerID) {
                        return artist
                    }
                }
            }
        }
        return null;
    }


    static generateId() {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < 16; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    static async removeMusic(id) {
        for (let i in LocalMusicHandler.musics) {
            let music = LocalMusicHandler.musics[i]
            if (music.musicID == id) {
                LocalMusicHandler.musics.splice(i, 1)
                await this.setLocalLibrary()
                return;
            }
        }
    }

    static getMusics() {
        return LocalMusicHandler.musics
    }

    static getAlbums() {
        return LocalMusicHandler.albums
    }

    static getArtists() {
        return LocalMusicHandler.singers
    }

    static getMusicById(id) {
        for (let music of LocalMusicHandler.musics) {
            if (music.musicID == id) return music;
        }
        return null;
    }

    static isMusicInLocalLibrary(id) {
        for (let music of LocalMusicHandler.musics) {
            if (music.musicID == id) return true;
        }
        return false;
    }

    static getMusicsByAlbum(albumID) {
        var mus = [];
        for (let music of LocalMusicHandler.musics) {
            if (music.albumID == albumID) mus.push(music)
        }
        return mus;
    }

    static getMusicsByArtist(artistID) {
        var mus = [];
        for (let music of LocalMusicHandler.musics) {
            if (music.artistID == artistID) mus.push(music)
        }
        return mus;
    }

    static getLocalUrl() {
        if (Utils.app.platform == "Android") return "https://myfiles/";
        else {
            return "app://localfiles/";
        }
    }
}