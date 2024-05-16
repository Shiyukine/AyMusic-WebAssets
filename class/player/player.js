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
    currentTime = -1;
    duration = -1;
    state = null;

    constructor() {
        window.addEventListener("message", (e) => {
            //console.log(e)
            if (/*e.origin == Utils.servURL.slice(0, -1) &&*/ e.data.message == "jseventcb") {
                if (e.data.cb == "play") {
                    this.state = true
                }
                if (e.data.cb == "pause") {
                    this.state = false
                }
                this.#eventEl.dispatchEvent(new CustomEvent(e.data.cb));
                if (e.data.cb == "loadedmetadata") {
                    this.changeVolume(this.volume)
                    if (this.needPlay) this.play()
                    else this.pause()
                    //TaskHandler.executeJs(url, "async () => { navigator.mediaSession.metadata = " + navigator.mediaSession.metadata + " }")
                }
            }
            if (/*e.origin == Utils.servURL.slice(0, -1) &&*/ e.data.message == "jseventcbdata") {
                if (e.data.cb == "timeupdate") {
                    this.checkCropSong(e.data.data)
                    this.currentTime = e.data.data
                }
                if (e.data.cb == "loadedmetadata") {
                    this.duration = e.data.data
                    this.changeVolume(this.volume)
                    if (this.needPlay) this.play()
                    else this.pause()
                    //TaskHandler.executeJs(url, "async () => { navigator.mediaSession.metadata = " + navigator.mediaSession.metadata + " }")
                }
                this.#eventEl.dispatchEvent(new CustomEvent(e.data.cb));
            }
        })
    }

    objurl = "";

    /**
     * 
     * @param {Song} song 
     */
    async playSong(song, play = true) {
        this.needPlay = play
        this.duration = -1
        this.currentTime - 1
        this.state = null
        if (this.objurl != "") URL.revokeObjectURL(this.objurl)
        if (this.audioElement != null) {
            this.audioElement.pause()
            this.audioElement = null;
        }
        try {
            if (this.currentPlatform != null && (await PlatformHandler.getPlatformSettings(this.currentPlatform)).NeedDisconnectBeforeChangeSong) {
                await this.disconnect()
            }
            TaskHandler.stopWebTaskManually(this.currentUrl, true)
        } catch (e) { }
        this.currentSongUrl = ""
        console.log("begin to play song " + song.url)
        if (song.imgUrl == "localImg") {
            this.isLocalMusic = true;
            this.audioElement = new Audio()
            this.audioElement.onplay = () => {
                this.state = true
                this.#eventEl.dispatchEvent(new CustomEvent("play"));
                if (document.visibilityState == "hidden")
                    this.#eventEl.dispatchEvent(new CustomEvent("timeupdate"));
            }
            this.audioElement.onpause = () => {
                this.state = false
                this.#eventEl.dispatchEvent(new CustomEvent("pause"));
                if (document.visibilityState == "hidden")
                    this.#eventEl.dispatchEvent(new CustomEvent("timeupdate"));
            }
            this.audioElement.ontimeupdate = () => {
                this.currentTime = this.audioElement.currentTime * 1000
                if (document.visibilityState == "visible") {
                    this.#eventEl.dispatchEvent(new CustomEvent("timeupdate"));
                }
                this.checkCropSong(this.audioElement.currentTime)
            }
            this.audioElement.onloadedmetadata = () => {
                this.duration = this.audioElement.duration * 1000
                this.#eventEl.dispatchEvent(new CustomEvent("loadedmetadata"));
                this.audioElement.volume = this.volume / 100;
                if (play) this.play()
                else this.pause()
                if (document.visibilityState == "hidden")
                    this.#eventEl.dispatchEvent(new CustomEvent("timeupdate"));
            }
            this.audioElement.onvolumechange = () => {
                this.#eventEl.dispatchEvent(new CustomEvent("volumechange"));
            }
            this.audioElement.onended = () => {
                this.#eventEl.dispatchEvent(new CustomEvent("ended"));
                if (document.visibilityState == "hidden")
                    this.#eventEl.dispatchEvent(new CustomEvent("timeupdate"));
            }
            if (Utils.app.platform == "Android") {
                var data = await (await fetch(song.url)).blob()
                let url = URL.createObjectURL(data)
                this.audioElement.src = url
                this.objurl = url
            }
            else {
                this.audioElement.src = song.url
            }
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
            let url = song.url
            if ((await PlatformHandler.getPlatformSettings(platform)).UseListenUrl) {
                let urlsplit = (await PlatformHandler.getPlatformUrl(platform, "BaseSongUrl")).split("%id%")
                let url2split = (await PlatformHandler.getPlatformUrl(platform, "ListenUrl")).split("%token%").join((await PlatformHandler.getPlatformSettings(platform)).Token)
                    .split("%id%")
                for (let spl in urlsplit) {
                    url = url.replace(urlsplit[spl], url2split[spl])
                }
                if ((await PlatformHandler.getPlatformSettings(platform)).AddParamsInSongUrl) {
                    if (!url.includes("?")) url += "?uwu=1"
                    if (play) url += "&autoplay=1"
                    url += "&volume=" + ((await PlatformHandler.getPlatformSettings(platform)).SmallVolumeInSongUrl ? this.volume / 100 : this.volume)
                }
            }
            var wtId = TaskHandler.addTask(url, await Utils.app.httpRequestGET(await PlatformHandler.getPlatformUrl(platform, "ListenScript")), true, true, true, (data, wi) => { }, (await PlatformHandler.getPlatformSettings(platform)).NeedDisplayNoneWhenPlaying)
            this.currentUrl = url
        }
        this.currentSongUrl = song.url
        this.#eventEl.dispatchEvent(new CustomEvent("songchange"));
        console.log("audio element created")
    }

    /**
     * 
     * @param {*} event 
     * @param {(this: HTMLElement, ev: any)} callback 
     * @param {boolean | AddEventListenerOptions | undefined} options 
     */
    addEventListener(event, callback, options = undefined) {
        this.#eventEl.addEventListener(event, callback, options)
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

    onNotConnected(callback) {
        this.#eventEl.addEventListener("notconnected", callback)
    }

    onSkipAds(callback) {
        this.#eventEl.addEventListener("skipads", callback)
    }

    onNeedRefresh(callback) {
        this.#eventEl.addEventListener("needrefresh", callback)
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
        if (Utils.queueManager.currentSong != null) {
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
        }
        this.#eventEl.dispatchEvent(new CustomEvent("muted"));
    }

    async getCurrentTime() {
        if (this.currentTime != -1) return this.currentTime
        if (this.isLocalMusic) {
            return this.audioElement.currentTime * 1000
        }
        else {
            let result = await TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "CurrentTime"))
            return result
        }
    }

    async checkCropSong(time) {
        if (this.isLocalMusic) {
            if (time * 1000 < Utils.queueManager.currentSong.cropStart) {
                this.seek(Utils.queueManager.currentSong.cropStart)
            }
            if (Utils.queueManager.currentSong.cropEnd != -1 && time * 1000 > Utils.queueManager.currentSong.cropEnd) {
                this.seek(await this.getDuration())
            }
        }
        else {
            if (time) {
                if (time < Utils.queueManager.currentSong.cropStart) {
                    this.seek(Utils.queueManager.currentSong.cropStart)
                }
                if (Utils.queueManager.currentSong.cropEnd != -1 && time > Utils.queueManager.currentSong.cropEnd) {
                    this.#eventEl.dispatchEvent(new CustomEvent("ended"));
                }
            }
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
        if (this.duration != -1) return this.duration
        if (this.isLocalMusic) {
            return this.audioElement.duration * 1000
        }
        else {
            let result = await TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "Duration"))
            return result ? result : -1
        }
    }

    async getState() {
        if (this.state != null) return this.state
        if (this.isLocalMusic) {
            return !this.audioElement.paused
        }
        else {
            let result = await TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "GetState"))
            return result
        }
    }

    async disconnect() {
        console.log("disconnecting...")
        if (this.isLocalMusic) {
            return true
        }
        else {
            if (this.currentPlatform != null && (await PlatformHandler.getPlatformSettings(this.currentPlatform)).NeedDisconnectBeforeChangeSong) {
                let result = await TaskHandler.executeJs(this.currentUrl, await PlatformHandler.getPlatformControl(this.currentPlatform, "Disconnect"))
                console.log("disconnect result: " + result)
                return result
            }
            else return true
        }
    }
}