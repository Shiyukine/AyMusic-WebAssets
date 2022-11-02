import Utils from "../utils/utils.js";
import * as id3 from "../../plugins/id3/id3.js"
import Song from "../music/song.js";
import Singer from "../music/singer.js";
import Album from "../music/album.js";
import LibraryManager from "../libraryManager.js";
import Playlist from "../music/playlist.js";
import InfoPanel from "../../ui/components/infoPanel/infoPanel.js";

export default class LocalMusicHandler {
    
    //obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, 
    //obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName
    static localMusicTemplate = {
        musicID: "",
        albumID: "",
        singerID: ""
    }

    /**
     * @type {[localMusicTemplate]}
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

    static init()
    {
        this.singers.push(new Singer(this.singerUnknownID, "Unknown artist", "", Date.now()))
        this.albums.push(new Album(this.albumUnknownID, "Unknown album", this.singerUnknownID, "Album", "", Date.now()))
    }

    static addMusicToPlaylist(playlistId, musicId)
    {
        this.musicsInPlaylists.push({musicId: musicId, playlistId: playlistId})
        this.setLocalLibrary()
    }

    static getMusicsInPlaylist(plId)
    {
        var list = []
        for(let obj of this.musicsInPlaylists)
        {
            if(obj.playlistId == plId) list.push(obj.musicId)
        }
        return list
    }

    static removeMusicInPlaylist(playlistId, musicId)
    {
        for(let i of LocalMusicHandler.musicsInPlaylists)
        {
            let obj = LocalMusicHandler.musicsInPlaylists[i]
            if(obj.playlistId == playlistId && obj.musicId == musicId) LocalMusicHandler.musicsInPlaylists.splice(i, 1)
            return;
        }
        this.setLocalLibrary()
    }

    static addLocalSinger(name)
    {
        var id = this.generateId();
        var filt = this.singers.filter(sing => sing.name == name);
        if(filt.length == 0) {
            var sing = new Singer(id, name, "", Date.now())
            this.singers.push(sing)
            return sing
        }
        else return filt[0]
    }

    static addLocalAlbum(name, singerName)
    {
        var id = this.generateId()
        var filt = this.albums.filter(al => al.name == name)
        if(filt.length == 0) {
            var al = new Album(id, name, this.addLocalSinger(singerName).id, "Album", "", Date.now())
            this.albums.push(al)
            return al
        }
        else return filt[0]
    }

    static async getLocalLibrary()
    {
        var result = await Utils.app.remoteClient.getUserSettingsFile("UserMusics.json")
        if(result) LocalMusicHandler.musics = JSON.parse(result);
        var result3 = await Utils.app.remoteClient.getUserSettingsFile("UserAlbums.json")
        if(result3) LocalMusicHandler.albums = JSON.parse(result3);
        var result4 = await Utils.app.remoteClient.getUserSettingsFile("UserArtists.json")
        if(result4) LocalMusicHandler.singers = JSON.parse(result4);
        console.log("Local library refreshed")
    }

    static async setLocalLibrary()
    {
        await Utils.app.remoteClient.changeUserSettingsFile("UserMusics.json", JSON.stringify(LocalMusicHandler.musics))
        await Utils.app.remoteClient.changeUserSettingsFile("UserAlbums.json", JSON.stringify(LocalMusicHandler.albums))
        await Utils.app.remoteClient.changeUserSettingsFile("UserArtists.json", JSON.stringify(LocalMusicHandler.singers))
        console.log("User's local library files updated")
    }

    static async addMusic()
    {
        console.log("Adding song to liked song... Waiting user choose")
        var allMusics = []
        var urls = await Utils.app.remoteClient.pickUpMusic()
        let isOk = true;
        for(let i in urls)
        {
            let nurl = urls[i]
            let result = "https://mymusic/" + nurl
            let request = new XMLHttpRequest();
            request.open('GET', result, true);
            request.responseType = 'blob';
            request.onload = function() {
                let reader = new FileReader();
                reader.readAsArrayBuffer(request.response);
                reader.onload =  function(e){
                    id3.fromFile(new File([e.target.result], result.split("\\")[result.split("\\") - 1])).then((tags) => {
                        let audio = new Audio()
                        audio.onloadedmetadata = async () =>
                        {
                            let artist = LocalMusicHandler.addLocalSinger(tags.artist)
                            console.log("Added new local artist : " + artist.id.replace("si_", ""))
                            let album = LocalMusicHandler.addLocalAlbum(tags.album, tags.artist)
                            console.log("Added new local album : " + album.id.replace("al_", "") + ", artist : " + album.singerID.replace("si_", ""))
                            allMusics.push([result, tags.title, "localImg", audio.duration * 1000])
                            if(i == urls.length - 1) {
                                let apiResult = await Utils.apiManager.doPostRequest({
                                    act: "addMultipleSongsLocal",
                                    songs: allMusics
                                })
                                if(apiResult["success"] !== false) {
                                    for(let musicID of apiResult) {
                                        LocalMusicHandler.musics.push({
                                            musicID: musicID,
                                            albumID: album.id,
                                            singerID: artist.id
                                        })
                                        isOk = isOk && await Utils.libManager.addObjToLikedSongs("so_" + musicID)
                                        //avoid small ddos
                                        await Utils.delay(100);
                                    }
                                    if(isOk) {
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
                                else
                                {
                                    let ip = new InfoPanel("Error", "We can't add this music to your liked songs.\nConcerned song : " + nurl + "\nPlease verify your file.", [{
                                        text: "OK", isPositive: true, onclick: () => {
                                            ip.close()
                                        }
                                    }])
                                    document.getElementById("main").appendChild(ip)
                                    ip.show()
                                }
                            }
                        }
                        audio.src = result;
                    });
                };
            };
            request.send();
        }
    }

    static getAlbumByMusicID(musicID) {
        for(let music of LocalMusicHandler.musics)
        {
            if(music.musicID == musicID) 
            {
                for(let album of LocalMusicHandler.albums) 
                {
                    if(album.id == music.albumID)
                    {
                        return album
                    }
                }
            }
        }
        return null;
    }

    static getArtistByMusicID(musicID) {
        for(let music of LocalMusicHandler.musics)
        {
            if(music.musicID == musicID) 
            {
                for(let artist of LocalMusicHandler.singers) 
                {
                    if(artist.id == music.singerID)
                    {
                        return artist
                    }
                }
            }
        }
        return null;
    }


    static generateId()
    {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < 16; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    static removeMusic(id)
    {
        for(let i in LocalMusicHandler.musics)
        {
            let music = LocalMusicHandler.musics[i]
            if(music.id == id) LocalMusicHandler.musics.splice(i, 1)
            return;
        }
        this.setLocalLibrary()
    }

    static getMusics()
    {
        return LocalMusicHandler.musics
    }

    static getMusicById(id)
    {
        for(let music of LocalMusicHandler.musics)
        {
            if(music.id == id) return music;
        }
    }

    static getMusicByUrl(url)
    {
        for(let music of LocalMusicHandler.musics)
        {
            if(music.url == url) return music;
        }
    }

    static isMusicInLocalLibrary(id)
    {
        for(let music of LocalMusicHandler.musics)
        {
            if(music.musicID == id) return true;
        }
        return false;
    }

    static getMusicsByTitle(title)
    {
        var mus = [];
        for(let music of LocalMusicHandler.musics)
        {
            if(music.title == title) mus.push(music)
        }
        return mus;
    }

    static getMusicsByAlbum(album)
    {
        var mus = [];
        for(let music of LocalMusicHandler.musics)
        {
            if(music.album == album) mus.push(music)
        }
        return mus;
    }

    static getMusicsByArtist(artist)
    {
        var mus = [];
        for(let music of LocalMusicHandler.musics)
        {
            if(music.artist == artist) mus.push(music)
        }
        return mus;
    }
}