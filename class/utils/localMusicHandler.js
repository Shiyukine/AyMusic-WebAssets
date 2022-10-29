import Utils from "../utils/utils.js";
import * as id3 from "../../plugins/id3/id3.js"
import Song from "../music/song.js";
import Singer from "../music/singer.js";
import Album from "../music/album.js";
import LibraryManager from "../libraryManager.js";
import Playlist from "../music/playlist.js";

export default class LocalMusicHandler {
    
    //obj.musicID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, 
    //obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName
    static localMusicTemplate = {
        musicID: "",
        url: "",
        dateAdded: 0,
        title: "",
        imgUrl: "",
        time: 0,
        isExplicit: false,
        addedBy: "",
        cropStart: 0,
        cropEnd: -1,
        singerID: "",
        singerName: "",
        albumeName: ""
    }

    /**
     * @type {[localMusicTemplate]}
     */
    static musics = []

    /**
     * @type {[{musicId, playlistId}]}
     */
    static musicsInPlaylists = []

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
        this.singers.push(new Singer(this.singerUnknownID, "Unknown artist", null, Date.now()))
        this.albums.push(new Album(this.albumUnknownID, "Unknown album", this.singerUnknownID, "Album", null, Date.now()))
    }

    static addMusicToPlaylist(playlistId, musicId)
    {
        this.musicsInPlaylists.push({musicId: musicId, playlistId: playlistId})
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
            var sing = new Singer(id, name, null, Date.now())
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
            var al = new Album(id, name, this.addLocalSinger(singerName).id, "Album", null, Date.now())
            this.albums.push(al)
            return al
        }
        else return filt[0]
    }

    static async getLocalLibrary()
    {
        var result = await Utils.app.remoteClient.getMusicsFile()
        if(result) LocalMusicHandler.musics = JSON.parse(result);
        var result2 = await Utils.app.remoteClient.getPlaylistsFile()
        if(result2) LocalMusicHandler.musicsInPlaylists = JSON.parse(result2);
        console.log("Local library refreshed")
    }

    static async setLocalLibrary()
    {
        await Utils.app.remoteClient.changeMusicsFile(JSON.stringify(LocalMusicHandler.musics))
        await Utils.app.remoteClient.changePlaylistsFile(JSON.stringify(LocalMusicHandler.musicsInPlaylists))
        console.log("User's local library files updated")
    }

    static async addMusic()
    {
        console.log("Adding song to liked song... Waiting user choose")
        var input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => { 
            var file = e.target.files[0];
            id3.fromFile(file).then((tags) => {
                var audio = new Audio()
                audio.onloadedmetadata = () =>
                {
                    var artist = this.addLocalSinger(tags.artist)
                    console.log("Added new local artist : " + artist.id)
                    var album = this.addLocalAlbum(tags.album, tags.artist)
                    console.log("Added new local album : " + album.id + ", artist : " + album.singerID)
                    LocalMusicHandler.musics.push({
                        musicID: this.generateId(),
                        url: URL.createObjectURL(file),
                        dateAdded: Date.now(),
                        title: tags.title,
                        imgUrl: tags.images[0].data,
                        time: audio.duration,
                        isExplicit: false,
                        addedBy: "You",
                        cropStart: 0,
                        cropEnd: -1,
                        singerID: artist.id,
                        singerName: artist.name,
                        albumeName: album.name
                    })
                    //LocalMusicHandler.musics.push(new Song("so_" + LocalMusicHandler.generateId(), URL.createObjectURL(file), Date.now(), tags.title, tags.images[0].data, audio.duration, false, "You", 0, -1, artist.id, artist.name, album.name))
                    LocalMusicHandler.setLocalLibrary()
                    console.log("Song added to liked song !")
                }
                audio.src = URL.createObjectURL(file);
            });
        }
        input.click();
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