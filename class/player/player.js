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
    currentSongUrl = "";
    currentPlatform = null;
    needPlay = true;

    constructor() {
        window.addEventListener("message", (e) => {
            //console.log(e)
            if (/*e.origin == Utils.servURL.slice(0, -1) &&*/ e.data.message == "jseventcb") {
                this.#eventEl.dispatchEvent(new CustomEvent(e.data.cb));
                if (e.data.cb == "loadedmetadata") {
                    this.changeVolume(this.volume)
                    if (this.needPlay) this.play()
                    else this.pause()
                    //TaskHandler.executeJs(url, "async () => { navigator.mediaSession.metadata = " + navigator.mediaSession.metadata + " }")
                }
            }
        })
    }

    /**
     * 
     * @param {Song} song 
     */
    async playSong(song, play = true) {
        this.needPlay = play
        console.trace()
        console.log("begin to play song " + song.url)
        console.log("Resetting ancient song elements")
        if (this.audioElement != null) {
            this.audioElement.pause()
            this.audioElement = null;
        }
        try {
            TaskHandler.stopWebTaskManually(this.currentUrl, true)
        } catch (e) { }
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
            this.currentPlatform = null
        }
        else {
            this.isLocalMusic = false;
            var platform = await PlatformHandler.getPlatformBySongUrl(song.url)
            this.currentPlatform = platform
            console.log("Platform: " + platform)
            if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform &&
                (await PlatformHandler.getPlatformSettings(platform)).Token == "") {
                console.log("Platform need refresh token")
                await PlatformHandler.refreshTokenForPlatform(platform)
                console.log("Platform token refreshed")
            }
            console.log("2")
            let url = song.url
            if ((await PlatformHandler.getPlatformSettings(platform)).UseListenUrl) {
                console.log("3")
                let urlsplit = (await PlatformHandler.getPlatformUrl(platform, "BaseSongUrl")).split("%id%")
                console.log("4")
                let url2split = (await PlatformHandler.getPlatformUrl(platform, "ListenUrl")).split("%token%").join((await PlatformHandler.getPlatformSettings(platform)).Token)
                    .split("%id%")
                console.log("5")
                for (let spl in urlsplit) {
                    url = url.replace(urlsplit[spl], url2split[spl])
                }
                console.log("6")
                if (!url.includes("?")) url += "?uwu=1"
                if (play) url += "&autoplay=1"
                url += "&volume=" + this.volume
            }
            console.log("7")
            var wtId = TaskHandler.addTask(url, await Utils.app.remoteClient.httpRequestGET(await PlatformHandler.getPlatformUrl(platform, "ListenScript")), true, true, true, (data, wi) => { })
            console.log("8")
            this.currentUrl = url
        }
        this.currentSongUrl = song.url
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

    onNeedTokenChange(callback) {
        this.#eventEl.addEventListener("needtokenchange", callback)
    }

    onSkipAds(callback) {
        this.#eventEl.addEventListener("skipads", callback)
    }

    async play() {
        if (this.isLocalMusic) {
            this.audioElement.play()
        }
        else {
            TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "Play"))
        }
    }

    async pause() {
        if (this.isLocalMusic) {
            this.audioElement.pause()
        }
        else {
            TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "Pause"))
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
        if (await Utils.player.getCurrentTime() > 5000) {
            Utils.player.seek(0)
        }
        else {
            let song = await Utils.queueManager.previousSong()
            this.playSong(song)
        }
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

    async changeVolume(volume) {
        if (!isNaN(volume)) {
            this.volume = volume;
            if (this.isLocalMusic) {
                this.audioElement.volume = volume / 100
            }
            else {
                TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "SetVolume", volume))
            }
        }
    }

    anVol = 0;

    async setMute(mute) {
        this.isMuted = mute
        if (this.isLocalMusic) {
            this.audioElement.muted = mute
        } else {
            let platform = await PlatformHandler.getPlatformBySongUrl(this.currentSongUrl)
            if ((await PlatformHandler.getPlatformSettings(platform)).NoMute) {
                if (this.isMuted) {
                    this.anVol = await Utils.player.getVolume()
                    this.changeVolume(0)
                }
                else {
                    this.changeVolume(this.anVol)
                }
            }
        }
        this.#eventEl.dispatchEvent(new CustomEvent("muted"));
    }

    async getCurrentTime() {
        if (this.isLocalMusic) {
            return this.audioElement.currentTime * 1000
        }
        else {
            let result = await TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "CurrentTime"))
            return result
        }
    }

    async seek(ms) {
        if (this.isLocalMusic) {
            this.audioElement.currentTime = ms / 1000
        }
        else {
            await TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "Seek", ms))
        }
    }

    async getVolume() {
        if (this.isLocalMusic) {
            return this.audioElement.volume * 100
        }
        else {
            let result = parseFloat(await TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "GetVolume")))
            if (!isNaN(result)) return parseFloat(result) * 100;
            else return this.volume
        }
    }

    async getDuration() {
        if (this.isLocalMusic) {
            return this.audioElement.duration * 1000
        }
        else {
            let result = await TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "Duration"))
            return result ? result : -1
        }
    }

    async getState() {
        if (this.isLocalMusic) {
            return !this.audioElement.paused
        }
        else {
            let result = await TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "GetState"))
            return result
        }
    }
}