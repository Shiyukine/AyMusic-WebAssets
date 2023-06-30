import Song from "../music/song.js";
import TaskHandler from "../taskHandler.js";
import Utils from "../utils/utils.js";
import PlatformHandler from "./platformHandler.js";

export default class Player {

    /**
     * @type {HTMLAudioElement}
     */
    audioElement = null;

    #eventEl = document.createElement("event");
    isLocalMusic = false;
    volume = 100;
    isMuted = false;
    currentUrl = "";

    /**
     * 
     * @param {Song} song 
     */
    async playSong(song, play = true) {
        console.log("begin to play song " + song.url)
        console.log("Resetting ancient song elements")
        if (this.audioElement != null) {
            this.audioElement.pause()
            this.audioElement = null;
        }
        TaskHandler.stopWebTaskManually(this.currentUrl, true)
        console.log("Resetted. Creating new audio element")
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
            this.currentUrl = song.url
        }
        else {
            this.isLocalMusic = false;
            var platform = await PlatformHandler.getPlatformBySongUrl(song.url)
            console.log("Platform: " + platform)
            if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform &&
                (await PlatformHandler.getPlatformSettings(platform)).Token == "") {
                console.log("Platform need refresh token")
                await PlatformHandler.refreshTokenForPlatform(platform)
                console.log("Platform token refreshed")
            }
            let url = song.url
            if ((await PlatformHandler.getPlatformSettings(platform)).UseListenUrl) {
                let urlsplit = (await PlatformHandler.getPlatformUrl(platform, "BaseSongUrl")).split("%id%")
                let url2split = (await PlatformHandler.getPlatformUrl(platform, "ListenUrl")).split("%token%").join((await PlatformHandler.getPlatformSettings(platform)).Token)
                    .split("%id%")
                for (let spl in urlsplit) {
                    url = url.replace(urlsplit[spl], url2split[spl])
                }
                TaskHandler.addTask(url, "", true, true, true, (data) => {
                    this.currentUrl = url
                })
            }
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

    onMuted(callback) {
        this.#eventEl.addEventListener("muted", callback)
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
            Utils.queueManager.allSongs = Utils.queueManager.shuffleArray(Utils.queueManager.allSongs)
        }
        else {
            for (let i = 0; i < Utils.queueManager.allSongsIds.length; i++) {
                let id = Utils.queueManager.allSongsIds[i].song
                let id2 = Utils.queueManager.allSongsIds[i].obj.split("_")[1]
                for (let y = 0; y < Utils.queueManager.allSongs.length; y++) {
                    if (Utils.queueManager.allSongs[y].song.id == id && Utils.queueManager.allSongs[y].obj.id == id2) {
                        let temp = Utils.queueManager.allSongs[i]
                        Utils.queueManager.allSongs[i] = Utils.queueManager.allSongs[y]
                        Utils.queueManager.allSongs[y] = temp
                    }
                }
            }
        }
        for (let y = 0; y < Utils.queueManager.allSongs.length; y++) {
            if (Utils.queueManager.allSongs[y].song.id == Utils.queueManager.currentSong.id
                && Utils.queueManager.allSongsIds[y].obj == Utils.queueManager.currentObject.id) {
                Utils.queueManager.currentIndex = y;
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

    setMute(mute) {
        this.isMuted = mute
        if (this.isLocalMusic) {
            this.audioElement.muted = mute
        }
        this.#eventEl.dispatchEvent(new CustomEvent("muted"));
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