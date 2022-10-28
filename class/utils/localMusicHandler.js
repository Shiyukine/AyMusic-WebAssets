import Utils from "../utils/utils.js";
import jsmediatags from "../../plugins/jsmediatags/jsmediatags.js"

export default class LocalMusicHandler {
    static localMusicTemplate = {
        id: "",
        url: "",
        title: "",
        album: "",
        songDuration: 0,
        artist: "",
        picture: null,
        year: ""
    }

    /**
     * @type {[localMusicTemplate]}
     */
    static musics = []

    static async getLocalLibrary()
    {
        this.musics = JSON.parse(await Utils.app.remoteClient.getMusicsFile());
    }

    static async setLocalLibrary()
    {
        await Utils.app.remoteClient.changeMusicsFile(JSON.stringify(this.musics))
    }

    static async addMusic()
    {
        var url = await Utils.app.remoteClient.pickUpMusic();
        var musics = this.musics;
        var setLoc = this.setLocalLibrary
        var genId = this.generateId()
        jsmediatags.read("filename.mp3", {
            onSuccess: function(tag) {
              var tags = tag.tags;
              console.log(tags.artist + " - " + tags.title + ", " + tags.album);
              var audio = new Audio()
              audio.onloadedmetadata = () =>
              {
                musics.push({
                    id: genId,
                    url: url,
                    title: tags.title,
                    album: tags.album,
                    songDuration: audio.duration,
                    artist: tags.artist,
                    picture: tags.picture,
                    year: tags.year
                })
                setLoc()
              }
              audio.src = url;
            }
        })
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
        for(let i in this.musics)
        {
            let music = this.musics[i]
            if(music.id == id) this.musics.splice(i, 1)
            return;
        }
        this.setLocalLibrary()
    }

    static getMusics()
    {
        return this.musics
    }

    static getMusicById(id)
    {
        for(let music of this.musics)
        {
            if(music.id == id) return music;
        }
    }

    static getMusicByUrl(url)
    {
        for(let music of this.musics)
        {
            if(music.url == url) return music;
        }
    }

    static getMusicsByTitle(title)
    {
        var mus = [];
        for(let music of this.musics)
        {
            if(music.title == title) mus.push(music)
        }
        return mus;
    }

    static getMusicsByAlbum(album)
    {
        var mus = [];
        for(let music of this.musics)
        {
            if(music.album == album) mus.push(music)
        }
        return mus;
    }

    static getMusicsByArtist(artist)
    {
        var mus = [];
        for(let music of this.musics)
        {
            if(music.artist == artist) mus.push(music)
        }
        return mus;
    }
}