import Album from "../music/album.js";
import Playlist from "../music/playlist.js";
import Singer from "../music/singer.js";
import Song from "../music/song.js";
import Utils from "../utils/utils.js";

export default class QueueManager {

    /**
     * @type {[{song:Song,obj:Song|Playlist|Album}]}
     */
    allSongs = [];
    /**
     * @type {[{song:String,obj:String}]}
     */
    allSongsIds = [];
    currentIndex = 0;
    currentObject = null;
    /**
     * @type {Song}
     */
    currentSong = null;
    shuffle = false;
    //0 = no repeat, 1 = repeat pl/al, 2 = repeat song
    repeat = 0;

    #eventEl = document.createElement("event");

    async changeQueue(obj, idSong = "", play = true) {
        try {
            //this.currentObject = obj
            //this.currentSong = null;
            this.allSongs = []
            this.allSongsIds = []
            idSong = idSong.replace("so_", "")
            if (obj.constructor === Song) {
                this.allSongs.push({ song: obj, obj: obj })
                this.allSongsIds.push(obj.id)
                this.currentIndex = 0
                this.currentSong = this.allSongs[0].song
                this.currentObject = this.allSongs[0].obj
                Utils.player.playSong(this.currentSong, play)
                return;
            }
            if (obj.constructor === Playlist) {
                let result = await Utils.apiManager.doPostRequest({
                    act: "getPlaylistSongs",
                    playlistID: obj.id,
                    orderByDesc: obj.id == Utils.libManager.userInfo.likedSongsPlId ? true : false,
                    offset: -1
                })
                let songs = result["songs"]
                for (let i in songs) {
                    let objs = songs[i]
                    let sng = new Song(objs.musicID.replace("so_", ""), objs.url, objs.dateAdded, objs.title, objs.imgUrl, objs.time, objs.isExplicit, objs.addedBy, objs.cropStart, objs.cropEnd, objs.singerID, objs.singerName, objs.albumName, objs.albumID, objs.albumUrl, objs.singerUrl, objs.additionalSingers, objs.aliasTitle, objs.aliasSongSingerName, objs.aliasSingerName)
                    if (sng.canBeLoaded) {
                        this.allSongs.push({ song: sng, obj: obj })
                        this.allSongsIds.push({ song: sng.id, obj: "pl_" + obj.id })
                    }
                }
                if (this.shuffle) this.allSongs = this.shuffleArray(this.allSongs)
                if (idSong != "") {
                    for (let i in this.allSongs) {
                        let sng = this.allSongs[i]
                        if (sng.song.id == idSong.replace("so_", "")) {
                            this.currentIndex = parseInt(i)
                            this.currentSong = sng.song
                            this.currentObject = sng.obj
                        }
                    }
                }
                else {
                    this.currentIndex = 0
                    this.currentSong = this.allSongs[0].song
                    this.currentObject = this.allSongs[0].obj
                }
                if (this.currentObject != null && this.currentSong != null) {
                    this.currentObject = Object.assign(new Playlist(), this.currentObject)
                    if (!this.currentObject.id.startsWith("pl_")) this.currentObject.id = "pl_" + this.currentObject.id
                    Utils.player.playSong(this.currentSong, play)
                }
                else {
                    console.error("Playing a song that cannot be played! Resetting player.")
                }
                return;
            }
            if (obj.constructor === Album) {
                let result = await Utils.apiManager.doPostRequest({
                    act: "getAlbumInfo",
                    id: obj.id,
                    orderByDesc: true,
                    //
                    offset: -1
                })
                let songs = result["songs"]["songs"]
                for (let i in songs) {
                    let objs = songs[i]
                    let sng = new Song(objs.songID.replace("so_", ""), objs.url, objs.albumPosition, objs.title, objs.imgUrl, objs.time, objs.isExplicit, objs.addedBy, objs.cropStart, objs.cropEnd, objs.singerID, objs.singerName, objs.albumName, objs.albumID, objs.albumUrl, objs.singerUrl, objs.additionalSingers, objs.aliasTitle, objs.aliasSongSingerName, objs.aliasSingerName)
                    if (sng.canBeLoaded) {
                        this.allSongs.push({ song: sng, obj: obj })
                        this.allSongsIds.push({ song: sng.id, obj: "al_" + obj.id })
                    }
                }
                if (this.shuffle) this.allSongs = this.shuffleArray(this.allSongs)
                if (idSong != "") {
                    for (let i in this.allSongs) {
                        let sng = this.allSongs[i]
                        if (sng.song.id == idSong) {
                            this.currentIndex = parseInt(i)
                            this.currentSong = sng.song
                            this.currentObject = sng.obj
                        }
                    }
                }
                else {
                    this.currentIndex = 0
                    this.currentSong = this.allSongs[0].song
                    this.currentObject = this.allSongs[0].obj
                }
                this.currentObject = Object.assign(new Album(), this.currentObject)
                if (!this.currentObject.id.startsWith("al_")) this.currentObject.id = "al_" + this.currentObject.id
                Utils.player.playSong(this.currentSong, play)
                return;
            }
            if (obj.constructor === Singer) {
                let result = await Utils.apiManager.doPostRequest({
                    act: "getSingerInfo",
                    id: obj.id
                })
                let songs = result["songs"]
                for (let i in songs) {
                    let objs = songs[i]
                    let sng = new Song(objs.songID.replace("so_", ""), objs.url, objs.albumPosition, objs.title, objs.imgUrl, objs.time, objs.isExplicit, objs.addedBy, objs.cropStart, objs.cropEnd, objs.singerID, objs.singerName, objs.albumName, objs.albumID, objs.albumUrl, objs.singerUrl, objs.additionalSingers, objs.aliasTitle, objs.aliasSongSingerName, objs.aliasSingerName)
                    if (sng.canBeLoaded) {
                        this.allSongs.push({ song: sng, obj: obj })
                        this.allSongsIds.push({ song: sng.id, obj: "si_" + obj.id })
                    }
                }
                if (this.shuffle) this.allSongs = this.shuffleArray(this.allSongs)
                if (idSong != "") {
                    for (let i in this.allSongs) {
                        let sng = this.allSongs[i]
                        if (sng.song.id == idSong) {
                            this.currentIndex = parseInt(i)
                            this.currentSong = sng.song
                            this.currentObject = sng.obj
                        }
                    }
                }
                else {
                    this.currentIndex = 0
                    this.currentSong = this.allSongs[0].song
                    this.currentObject = this.allSongs[0].obj
                }
                this.currentObject = Object.assign(new Singer(), this.currentObject)
                if (!this.currentObject.id.startsWith("si_")) this.currentObject.id = "si_" + this.currentObject.id
                Utils.player.playSong(this.currentSong, play)
                return;
            }
        }
        catch (e) {
            console.error("Cannot change queue !\n", e)
        }
    }

    seekToSong(song) {
        for (let i in this.allSongs) {
            let sng = this.allSongs[i]
            if (sng.song.id == song.id) {
                this.currentIndex = parseInt(i)
                this.currentSong = sng.song
                this.currentObject = sng.obj
                if (sng.obj != null) {
                    if (sng.obj.constructor === Playlist) {
                        this.currentObject = Object.assign(new Playlist(), this.currentObject)
                        if (!this.currentObject.id.startsWith("pl_")) this.currentObject.id = "pl_" + this.currentObject.id
                    }
                    if (sng.obj.constructor === Album) {
                        this.currentObject = Object.assign(new Album(), this.currentObject)
                        if (!this.currentObject.id.startsWith("al_")) this.currentObject.id = "al_" + this.currentObject.id
                    }
                    if (sng.obj.constructor === Singer) {
                        this.currentObject = Object.assign(new Singer(), this.currentObject)
                        if (!this.currentObject.id.startsWith("si_")) this.currentObject.id = "si_" + this.currentObject.id
                    }
                }
                Utils.player.playSong(this.currentSong, true)
                return;
            }
        }
        console.error("Cannot seek to song, song not found in queue!");
    }

    /**
     * 
     * @param {Song} song 
     */
    addToQueue(song) {
        this.allSongs.splice(this.currentIndex + 1, 0, { song: song, obj: song });
        this.#eventEl.dispatchEvent(new CustomEvent("queuechange"));
    }

    /**
     * 
     * @param {number} index 
     */
    removeFromQueue(index) {
        if (index < 0 || index >= this.allSongs.length) {
            console.error("Cannot remove from queue, index out of bounds!");
            return;
        }
        this.allSongs.splice(index, 1);
        if (index <= this.currentIndex && this.currentIndex > 0) {
            this.currentIndex--;
        }
        this.#eventEl.dispatchEvent(new CustomEvent("queuechange"));
    }

    /**
     * @param {Playlist} playlist
     */
    async addPlaylistToQueue(playlist) {
        let result = await Utils.apiManager.doPostRequest({
            act: "getPlaylistSongs",
            playlistID: playlist.id,
            orderByDesc: playlist.id == Utils.libManager.userInfo.likedSongsPlId ? true : false,
            offset: -1
        })
        let songs = result["songs"]
        for (let i in songs) {
            let objs = songs[i]
            let sng = new Song(objs.musicID.replace("so_", ""), objs.url, objs.dateAdded, objs.title, objs.imgUrl, objs.time, objs.isExplicit, objs.addedBy, objs.cropStart, objs.cropEnd, objs.singerID, objs.singerName, objs.albumName, objs.albumID, objs.albumUrl, objs.singerUrl, objs.additionalSingers, objs.aliasTitle, objs.aliasSongSingerName, objs.aliasSingerName)
            if (sng.canBeLoaded) {
                this.allSongs.push({ song: sng, obj: playlist })
                this.allSongsIds.push({ song: sng.id, obj: "pl_" + playlist.id })
            }
        }
        this.#eventEl.dispatchEvent(new CustomEvent("queuechange"));
    }

    async nextSong() {
        let song = null;
        if (this.currentIndex + 1 < this.allSongs.length) {
            this.currentIndex++;
            song = this.allSongs[this.currentIndex];
        }
        else {
            if (this.repeat > 0) {
                this.currentIndex = 0;
                song = this.allSongs[this.currentIndex]
            }
        }
        this.currentSong = song.song;
        this.currentObject = song.obj;
        if (song.obj != null) {
            if (song.obj.constructor === Playlist) {
                this.currentObject = Object.assign(new Playlist(), this.currentObject)
                if (!this.currentObject.id.startsWith("pl_")) this.currentObject.id = "pl_" + this.currentObject.id
            }
            if (song.obj.constructor === Album) {
                this.currentObject = Object.assign(new Album(), this.currentObject)
                if (!this.currentObject.id.startsWith("al_")) this.currentObject.id = "al_" + this.currentObject.id
            }
            if (song.obj.constructor === Singer) {
                this.currentObject = Object.assign(new Singer(), this.currentObject)
                if (!this.currentObject.id.startsWith("si_")) this.currentObject.id = "si_" + this.currentObject.id
            }
        }
        return song.song;
    }

    canNext() {
        return this.currentIndex + 1 < this.allSongs.length || this.repeat == 1 || this.repeat == 2
    }

    shuffleArray(array) {
        let currentIndex = array.length, randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    async previousSong(force = false) {
        if (!force && !Utils.player.songLoading && Utils.player.currentTime != -1 && await Utils.player.getCurrentTime() > 5000) {
            return this.currentSong
        }
        let song = null;
        if (this.currentIndex - 1 > -1) {
            this.currentIndex--;
            song = this.allSongs[this.currentIndex];
        }
        else {
            if (this.repeat > 0) {
                this.currentIndex = this.allSongs.length - 1;
                song = this.allSongs[this.currentIndex]
            }
        }
        this.currentSong = song.song;
        this.currentObject = song.obj;
        if (song.obj != null) {
            if (song.obj.constructor === Playlist) {
                this.currentObject = Object.assign(new Playlist(), this.currentObject)
                if (!this.currentObject.id.startsWith("pl_")) this.currentObject.id = "pl_" + this.currentObject.id
            }
            if (song.obj.constructor === Album) {
                this.currentObject = Object.assign(new Album(), this.currentObject)
                if (!this.currentObject.id.startsWith("al_")) this.currentObject.id = "al_" + this.currentObject.id
            }
        }
        return song.song;
    }

    canPrevious() {
        return this.currentIndex - 1 > -1 || this.repeat == 1 || this.repeat == 2
    }

    onQueueChanged(callback) {
        this.#eventEl.addEventListener("queuechange", callback)
    }
}