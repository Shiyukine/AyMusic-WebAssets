import Song from "../music/song.js";
import Utils from "../utils/utils.js";

export default class Player {

    /**
     * @type {HTMLAudioElement}
     */
    audioElement = null;

    #eventEl = document.createElement("event");
    isLocalMusic = false;
    volume = 100;

    /**
     * 
     * @param {Song} song 
     */
    playSong(song, play = true) {
        console.log("begin to play song " + song.url)
        console.log("Resetting ancient song elements")
        if (this.audioElement != null) {
            this.audioElement.pause()
            this.audioElement = null;
        }
        console.log("Resetted. Creating new audio element")
        //local music
        if (song.imgUrl == "localImg") {
            this.isLocalMusic = true;
            this.audioElement = new Audio()
            this.audioElement.onplay = () => {
                this.#eventEl.dispatchEvent(new CustomEvent("play"));
            }
            this.audioElement.onpause = () => {
                this.#eventEl.dispatchEvent(new CustomEvent("pause"));
            }
            this.audioElement.ontimeupdate = () => {
                this.#eventEl.dispatchEvent(new CustomEvent("timeupdate"));
            }
            this.audioElement.onloadedmetadata = () => {
                console.log("audio element OK")
                this.#eventEl.dispatchEvent(new CustomEvent("loadedmetadata"));
                this.audioElement.volume = this.volume / 100;
                if (play) this.play()
                else this.pause()
            }
            this.audioElement.onvolumechange = () => {
                this.#eventEl.dispatchEvent(new CustomEvent("volumechange"));
            }
            this.audioElement.onended = () => {
                this.#eventEl.dispatchEvent(new CustomEvent("ended"));
            }
            this.audioElement.src = song.url
        }
        else {
            this.isLocalMusic = false;
        }
        this.#eventEl.dispatchEvent(new CustomEvent("songchange"));
        console.log("audio element created")
    }

    onPlay(callback) {
        this.#eventEl.addEventListener("play", callback)
    }

    onPause(callback) {
        this.#eventEl.addEventListener("pause", callback)
    }

    onTimeUpdate(callback) {
        this.#eventEl.addEventListener("timeupdate", callback)
    }

    onVolumeChange(callback) {
        this.#eventEl.addEventListener("volumechange", callback)
    }

    onLoadedMetadata(callback) {
        this.#eventEl.addEventListener("loadedmetadata", callback)
    }

    onEnded(callback) {
        this.#eventEl.addEventListener("ended", callback)
    }

    onShuffleChange(callback) {
        this.#eventEl.addEventListener("shufflechange", callback)
    }

    onRepeatChange(callback) {
        this.#eventEl.addEventListener("repeatchange", callback)
    }

    onSongChange(callback) {
        this.#eventEl.addEventListener("songchange", callback)
    }

    play() {
        if (this.isLocalMusic) {
            this.audioElement.play()
        }
    }

    pause() {
        if (this.isLocalMusic) {
            this.audioElement.pause()
        }
    }

    async next() {
        console.log("next song")
        let song = await Utils.queueManager.nextSong()
        if (song) this.playSong(song)
        else {
            Utils.queueManager.changeQueue(Utils.queueManager.currentObject, "", false)
        }
    }

    async previous() {
        console.log("previous song")
        let song = await Utils.queueManager.previousSong()
        this.playSong(song)
    }

    changeShuffle(activate) {
        console.log("changing shuffle")
        Utils.queueManager.shuffle = activate
        if (Utils.queueManager.shuffle) {
            for (let y = 0; y < Utils.queueManager.allSongs.length; y++) {
                if (Utils.queueManager.allSongs[y].song.id == Utils.queueManager.currentSong.id
                    && Utils.queueManager.allSongs[y].obj.id == Utils.queueManager.currentObject.id) {
                    Utils.queueManager.currentIndex = y;
                }
            }
            Utils.queueManager.allSongs = Utils.queueManager.shuffleArray(Utils.queueManager.allSongs)
        }
        else {
            for (let i = 0; i < Utils.queueManager.allSongsIds.length; i++) {
                let id = Utils.queueManager.allSongsIds[i].song
                let id2 = Utils.queueManager.allSongsIds[i].obj
                for (let y = 0; y < Utils.queueManager.allSongs.length; y++) {
                    if (Utils.queueManager.allSongs[y].song.id == id && Utils.queueManager.allSongs[y].obj.id == id2) {
                        let temp = Utils.queueManager.allSongs[i]
                        Utils.queueManager.allSongs[i] = Utils.queueManager.allSongs[y]
                        Utils.queueManager.allSongs[y] = temp
                        if (Utils.queueManager.allSongs[y].song.id == Utils.queueManager.currentSong.id
                            && Utils.queueManager.allSongs[y].obj.id == Utils.queueManager.currentObject.id) {
                            Utils.queueManager.currentIndex = y;
                        }
                    }
                }
            }
        }
        this.#eventEl.dispatchEvent(new CustomEvent("shufflechange"));
    }

    changeRepeat(repeat) {
        console.log("changing repeat")
        Utils.queueManager.repeat = repeat
        this.#eventEl.dispatchEvent(new CustomEvent("repeatchange"));
    }

    changeVolume(volume) {
        this.volume = volume;
        if (this.isLocalMusic) {
            this.audioElement.volume = volume / 100
        }
    }

    getCurrentTime() {
        if (this.isLocalMusic) {
            return this.audioElement.currentTime * 1000
        }
        return -1;
    }

    seek(ms) {
        if (this.isLocalMusic) {
            this.audioElement.currentTime = ms / 1000
        }
    }

    getVolume() {
        if (this.isLocalMusic) {
            return this.audioElement.volume * 100
        }
        return -1;
    }

    getDuration() {
        if (this.isLocalMusic) {
            return this.audioElement.duration * 1000
        }
        return -1;
    }

    getState() {
        if (this.isLocalMusic) {
            return !this.audioElement.paused
        }
        else {
            return false;
        }
    }
}