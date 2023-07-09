import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Song from "../../../class/music/song.js";
import PlatformHandler from "../../../class/player/platformHandler.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import ProgressBar from "../../components/progressBar/progressBar.js";
import QueueViewerWindow from "../queueViewer/queueViewer.js";

export default class ListenWindow extends HTMLDivElement {
    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        this.style.position = "absolute"
        this.style.bottom = "0"
        this.style.left = "0"
        this.style.right = "0"
        Import.getData("/ui/windows/listen/listen.html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                /**
                 * @type {ProgressBar}
                 */
                let pb = shadow.getElementById("pb");
                /**
                 * @type {ProgressBar}
                 */
                let pbVol = shadow.getElementById("pbVol");
                this.shadowRoot.getElementById("listen").ontransitionend = () => { };
                this.shadowRoot.getElementById("listen").style = ""
                let firstS = true;
                Utils.player.onSongChange(async () => {
                    this.clearUrls()
                    if (!Utils.player.isLocalMusic) {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        Utils.app.remoteClient.registerIframeUrl(await PlatformHandler.getPlatformUrl(platform, "IframeUrl"), `addEventListener('message', async (e) =>
                        {
                            if(e.origin.includes('app://root'))
                            {
                                if(e.data.message == 'changeMediaMetadata')
                                {
                                    navigator.mediaSession.metadata = new window.MediaMetadata({
                                        title: e.data.inData.title,
                                        artist: e.data.inData.artist,
                                        album: e.data.inData.album,
                                        artwork: JSON.parse(e.data.inData.artwork)
                                    });
                                }
                                if(e.data.message == 'changePositionState')
                                {
                                    navigator.mediaSession.setPositionState({
                                        playbackRate: e.data.inData.pR,
                                        position: e.data.inData.cur,
                                        duration: e.data.inData.dur
                                    });
                                }
                                if(e.data.message == 'setActionHandler')
                                {
                                    navigator.mediaSession.setActionHandler(e.data.inData.action, (event) => { 
                                        parent.postMessage({message: 'setActionHandlerCB', action: e.data.inData.action, id: e.data.id, event: event}, 'app://root')
                                        if(e.data.platform == "Spotify") parent.parent.postMessage({message: 'setActionHandlerCB', action: e.data.inData.action, id: e.data.id, event: event}, 'app://root')
                                    });
                                }
                            }
                        })`)
                    }
                    shadow.getElementById("music_title").innerText = Utils.queueManager.currentSong.title
                    shadow.getElementById("music_artist").innerText = Utils.queueManager.currentSong.singerName
                    shadow.getElementById("like").children[0].setAttribute("d", Utils.libManager.isSongIsInLikedSongs(Utils.queueManager.currentSong) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
                    Utils.libManager.userInfo.curObject = Utils.queueManager.currentObject.id
                    Utils.libManager.userInfo.curMusic = "so_" + Utils.queueManager.currentSong.id
                    shadow.getElementById("next").style.color = Utils.queueManager.canNext() ? "white" : "gray"
                    shadow.getElementById("previous").style.color = Utils.queueManager.canPrevious() ? "white" : "gray"
                    navigator.mediaSession.playbackState = "paused";
                    if (!firstS) {
                        await Utils.apiManager.doPostRequest({
                            act: "updateUserInfo",
                            curTime: 0,
                            curMusic: Utils.libManager.userInfo.curMusic,
                            curObject: Utils.libManager.userInfo.curObject
                        })
                    }
                    firstS = false
                    if (Utils.player.isLocalMusic) {
                        if (Utils.queueManager.currentSong.canBeLoaded) {
                            var imge = this.shadowRoot.getElementById("music_img");
                            imge.onerror = () => {
                                imge.src = "/resources/icon.ico"
                            }
                            imge.onload = async () => {
                                let blob = await (await fetch(imge.src)).blob();
                                let dataUrl = await new Promise(resolve => {
                                    let reader = new FileReader();
                                    reader.onload = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                });
                                navigator.mediaSession.metadata = new window.MediaMetadata({
                                    title: Utils.queueManager.currentSong.title,
                                    artist: Utils.queueManager.currentSong.singerName,
                                    album: Utils.queueManager.currentSong.albumName,
                                    artwork: [
                                        { src: dataUrl, sizes: '512x512', type: 'image/png' },
                                    ]
                                });
                            }
                            imge.src = "app://cache/Image/" + Utils.queueManager.currentSong.id + ".png"
                        }
                        else {
                            this.shadowRoot.getElementById("music_img").src = "/resources/icon.ico"
                            navigator.mediaSession.metadata = new window.MediaMetadata({
                                title: Utils.queueManager.currentSong.title,
                                artist: Utils.queueManager.currentSong.singerName,
                                album: Utils.queueManager.currentSong.albumName,
                                artwork: [
                                    { src: "/resources/icon.ico", sizes: '512x512', type: 'image/png' },
                                ]
                            });
                        }
                    }
                    else {
                        this.shadowRoot.getElementById("music_img").src = Utils.queueManager.currentSong.imgUrl
                        navigator.mediaSession.metadata = new window.MediaMetadata({
                            title: Utils.queueManager.currentSong.title,
                            artist: Utils.queueManager.currentSong.singerName,
                            album: Utils.queueManager.currentSong.albumName,
                            artwork: [
                                { src: Utils.queueManager.currentSong.imgUrl, sizes: '512x512', type: 'image/png' },
                            ]
                        });
                    }
                    navigator.mediaSession.setActionHandler('previoustrack', Utils.queueManager.canPrevious() ? () => {
                        Utils.player.previous()
                    } : null);
                    navigator.mediaSession.setActionHandler("nexttrack", Utils.queueManager.canNext() ? () => {
                        Utils.player.next()
                    } : null);
                    navigator.mediaSession.setActionHandler('play', () => { Utils.player.play() });
                    navigator.mediaSession.setActionHandler('pause', () => { Utils.player.pause() });
                    //navigator.mediaSession.setActionHandler('stop', () => { /* Code excerpted. */ });
                    //navigator.mediaSession.setActionHandler('seekbackward', () => { /* Code excerpted. */ });
                    //navigator.mediaSession.setActionHandler('seekforward', () => { /* Code excerpted. */ });
                    navigator.mediaSession.setActionHandler('seekto', (e) => { if (e.seekTime) Utils.player.seek(e.seekTime) });
                })
                let firstPlay = true
                Utils.player.onLoadedMetadata(async () => {
                    let dur = await Utils.player.getDuration()
                    if (dur != -1) {
                        pb.changeValue(0)
                        pb.changeMax(dur)
                        shadow.getElementById("maxTime").innerText = Utils.msToTime(dur)
                        shadow.getElementById("curTime").innerText = Utils.msToTime(0)
                        if (await Utils.player.getState()) {
                            shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Pause"])
                            navigator.mediaSession.playbackState = "playing";
                        }
                    }
                    if (!Utils.player.isLocalMusic) {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        this.updateMediaSession("changeMediaMetadata", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                        this.updateMediaSession("setActionHandler", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                    }
                    if (firstPlay && Utils.queueManager.currentSong != null) {
                        await Utils.player.seek(Utils.libManager.userInfo.curTime)
                        firstPlay = false
                    }
                })
                Utils.player.onTimeUpdate(async () => {
                    let cur = await Utils.player.getCurrentTime()
                    if (!mouseDownPb) pb.changeValue(cur)
                    shadow.getElementById("curTime").innerText = Utils.msToTime(cur)
                    navigator.mediaSession.setPositionState({
                        playbackRate: 1,
                        position: cur,
                        duration: pb.getMax()
                    });
                    if (!Utils.player.isLocalMusic) {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        this.updateMediaSession("changeMediaMetadata", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                        this.updateMediaSession("setActionHandler", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                        this.updateMediaSession("changePositionState", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), {
                            pR: 1,
                            cur: cur,
                            dur: pb.getMax()
                        })
                    }
                    if (cur >= 0 && cur < 1000 && Utils.app.getSetting("gen_discordRPC") && await Utils.player.getState()) {
                        this.updateDiscordRPC(pb, false)
                    }
                })
                let lastTime = /*await Utils.player.getCurrentTime()*/0;
                setInterval(async () => {
                    let cur = await Utils.player.getCurrentTime()
                    if (cur != lastTime && await Utils.player.getDuration()) {
                        Utils.libManager.userInfo.curObject = Utils.queueManager.currentObject.id
                        Utils.libManager.userInfo.curMusic = "so_" + Utils.queueManager.currentSong.id
                        await Utils.apiManager.doPostRequest({
                            act: "updateUserInfo",
                            curTime: cur,
                            curMusic: Utils.libManager.userInfo.curMusic,
                            curObject: Utils.libManager.userInfo.curObject
                        })
                        lastTime = cur
                    }
                }, 15000)
                let mouseDownPb = false;
                pb.onChanging(() => {
                    mouseDownPb = true;
                })
                pb.onRelease(() => {
                    mouseDownPb = false;
                    Utils.player.seek(pb.getValue());
                })
                Utils.player.onShuffleChange(() => {
                    if (Utils.queueManager.shuffle) {
                        shadow.getElementById("shuffle").children[0].setAttribute("fill", "#00ccff")
                    }
                    else {
                        shadow.getElementById("shuffle").children[0].setAttribute("fill", "currentColor")
                    }
                    shadow.getElementById("next").style.color = Utils.queueManager.canNext() ? "white" : "gray"
                    shadow.getElementById("previous").style.color = Utils.queueManager.canPrevious() ? "white" : "gray"
                    navigator.mediaSession.setActionHandler('previoustrack', Utils.queueManager.canPrevious() ? () => {
                        Utils.player.previous()
                    } : null);
                    navigator.mediaSession.setActionHandler("nexttrack", Utils.queueManager.canNext() ? () => {
                        Utils.player.next()
                    } : null);
                    Utils.app.changeSetting("shuffle", Utils.queueManager.shuffle)
                })
                Utils.player.onRepeatChange(() => {
                    if (Utils.queueManager.repeat == 0) {
                        shadow.getElementById("repeat").children[0].setAttribute("fill", "currentColor")
                        shadow.getElementById("repeat").children[0].setAttribute("d", Utils.pathsData["Repeat"])
                    }
                    else if (Utils.queueManager.repeat == 1) {
                        shadow.getElementById("repeat").children[0].setAttribute("fill", "#00ccff")
                        shadow.getElementById("repeat").children[0].setAttribute("d", Utils.pathsData["Repeat"])
                    }
                    else {
                        shadow.getElementById("repeat").children[0].setAttribute("fill", "#00ccff")
                        shadow.getElementById("repeat").children[0].setAttribute("d", Utils.pathsData["RepeatOne"])
                    }
                    shadow.getElementById("next").style.color = Utils.queueManager.canNext() ? "white" : "gray"
                    shadow.getElementById("previous").style.color = Utils.queueManager.canPrevious() ? "white" : "gray"
                    navigator.mediaSession.setActionHandler('previoustrack', Utils.queueManager.canPrevious() ? () => {
                        Utils.player.previous()
                    } : null);
                    navigator.mediaSession.setActionHandler("nexttrack", Utils.queueManager.canNext() ? () => {
                        Utils.player.next()
                    } : null);
                    Utils.app.changeSetting("repeat", Utils.queueManager.repeat)
                })
                Utils.player.onPlay(async () => {
                    if (!Utils.player.isLocalMusic) {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        this.updateMediaSession("changeMediaMetadata", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                        this.updateMediaSession("setActionHandler", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                    }
                    shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Pause"])
                    navigator.mediaSession.playbackState = "playing";
                    this.updateDiscordRPC(pb, false)
                })
                Utils.player.onPause(async () => {
                    if (!Utils.player.isLocalMusic) {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        this.updateMediaSession("changeMediaMetadata", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                        this.updateMediaSession("setActionHandler", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                    }
                    shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Play"])
                    navigator.mediaSession.playbackState = "paused";
                    if (Utils.app.getSetting("gen_discordRPC") && pb.getValue() != pb.getMax()) {
                        this.updateDiscordRPC(pb, true)
                    }
                })
                let anVol = 0;
                Utils.player.onVolumeChange(async () => {
                    let vol = await Utils.player.getVolume()
                    if (Utils.player.volume != pbVol.getValue()) {
                        pbVol.changeValue(vol);
                    }
                    if (vol > 0) anVol = vol
                    Utils.app.changeSetting("music_vol", vol)
                })
                Utils.player.onMuted(() => {
                    if (Utils.player.isMuted) shadow.getElementById("volSvg").children[0].setAttribute("d", Utils.pathsData["VolumeOff"])
                    else {
                        if (pbVol.getValue() == 0 || Utils.player.isMuted) {
                            shadow.getElementById("volSvg").children[0].setAttribute("d", Utils.pathsData["VolumeOff"])
                        }
                        else if (pbVol.getValue() < 34) {
                            shadow.getElementById("volSvg").children[0].setAttribute("d", Utils.pathsData["VolumeLow"])
                        }
                        else if (pbVol.getValue() < 67) {
                            shadow.getElementById("volSvg").children[0].setAttribute("d", Utils.pathsData["VolumeMedium"])
                        }
                        else {
                            shadow.getElementById("volSvg").children[0].setAttribute("d", Utils.pathsData["VolumeHigh"])
                        }
                    }
                    Utils.app.changeSetting("mute", Utils.player.isMuted)
                })
                /*pbVol.onRelease(() => {
                    Utils.player.changeVolume(pbVol.getValue());
                })*/
                pbVol.onValueChange(() => {
                    Utils.player.changeVolume(pbVol.getValue());
                    if (pbVol.getValue() == 0 || Utils.player.isMuted) {
                        shadow.getElementById("volSvg").children[0].setAttribute("d", Utils.pathsData["VolumeOff"])
                    }
                    else if (pbVol.getValue() < 34) {
                        shadow.getElementById("volSvg").children[0].setAttribute("d", Utils.pathsData["VolumeLow"])
                    }
                    else if (pbVol.getValue() < 67) {
                        shadow.getElementById("volSvg").children[0].setAttribute("d", Utils.pathsData["VolumeMedium"])
                    }
                    else {
                        shadow.getElementById("volSvg").children[0].setAttribute("d", Utils.pathsData["VolumeHigh"])
                    }
                })
                Utils.player.changeRepeat(parseInt(Utils.app.getSetting("repeat")))
                Utils.player.changeShuffle(Utils.app.getSetting("shuffle"))
                Utils.player.onEnded(async () => {
                    if (Utils.queueManager.repeat != 2) {
                        Utils.player.next()
                    }
                    else {
                        await Utils.player.seek(0)
                        await Utils.player.play()
                    }
                })
                Utils.player.onNeedTokenChange(async () => {
                    let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                    console.log("Platform need refresh token")
                    await PlatformHandler.refreshTokenForPlatform(platform)
                    console.log("Platform token refreshed")
                    Utils.player.playSong(Utils.queueManager.currentSong)
                })
                Utils.player.onSkipAds(async () => {
                    Utils.player.playSong(Utils.queueManager.currentSong)
                });
                Utils.libManager.onAddSongToLikedSongs((e) => {
                    if (Utils.queueManager.currentSong != null && e.detail.objId == "so_" + Utils.queueManager.currentSong.id) {
                        shadow.getElementById("like").children[0].setAttribute("d", Utils.libManager.isSongIsInLikedSongs(Utils.queueManager.currentSong) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
                    }
                });
                Utils.libManager.onRemoveSongFromLikedSongs((e) => {
                    if (Utils.queueManager.currentSong != null && e.detail.objId == "so_" + Utils.queueManager.currentSong.id) {
                        shadow.getElementById("like").children[0].setAttribute("d", Utils.libManager.isSongIsInLikedSongs(Utils.queueManager.currentSong) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
                    }
                });
                let queueViewer = new QueueViewerWindow()
                //document.getElementById("main").appendChild(queueViewer)
                shadow.getElementById("queue").onclick = () => {
                    if (queueViewer.isClosed) {
                        queueViewer.show()
                    }
                    else {
                        queueViewer.hide()
                    }
                }
                shadow.getElementById("changeState").onclick = async () => {
                    let state = await Utils.player.getState()
                    if (state) {
                        Utils.player.pause()
                    }
                    else {
                        Utils.player.play()
                    }
                }
                shadow.getElementById("next").onclick = () => {
                    if (Utils.queueManager.canNext()) Utils.player.next()
                }
                shadow.getElementById("previous").onclick = () => {
                    if (Utils.queueManager.canPrevious()) Utils.player.previous()
                }
                shadow.getElementById("repeat").onclick = () => {
                    Utils.player.changeRepeat(Utils.queueManager.repeat < 2 ? Utils.queueManager.repeat + 1 : 0)
                }
                shadow.getElementById("shuffle").onclick = () => {
                    Utils.player.changeShuffle(!Utils.queueManager.shuffle)
                }
                shadow.getElementById("like").onclick = () => {
                    Utils.libManager.addOrRemoveSongLikedSongs(Utils.queueManager.currentSong)
                }
                shadow.getElementById("volSvg").onclick = () => {
                    Utils.player.setMute(!Utils.player.isMuted)
                }
                if (Utils.libManager.userInfo.curMusic != null) {
                    if (Utils.libManager.userInfo.curObject == null) {
                        let obj = await Utils.apiManager.doPostRequest({
                            act: "getSongInfo",
                            id: Utils.libManager.userInfo.curMusic
                        })
                        await Utils.queueManager.changeQueue(new Song(obj.songID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID), "", false)
                    }
                    else if (Utils.libManager.userInfo.curObject.startsWith("pl_")) {
                        let result = null;
                        for (let pl of Utils.libManager.userPlaylists) {
                            if ("pl_" + pl.id == Utils.libManager.userInfo.curObject) {
                                result = pl;
                            }
                        }
                        await Utils.queueManager.changeQueue(result, Utils.libManager.userInfo.curMusic, false)
                    }
                    else if (Utils.libManager.userInfo.curObject.startsWith("al_")) {
                        let result = await Utils.apiManager.doPostRequest({
                            act: "getAlbumInfo",
                            id: Utils.libManager.userInfo.curObject.replace("al_", ""),
                            offset: 0
                        })
                        let al = result["albumInfo"]
                        await Utils.queueManager.changeQueue(new Album(al.id, al.name, al.singerID, al.type, al.imgUrl), Utils.libManager.userInfo.curMusic, false)
                    }
                }
                pbVol.changeValue(parseInt(Utils.app.getSetting("music_vol")))
                if (Utils.app.getSetting("mute")) Utils.player.setMute(true)
                window.addEventListener("message", (e) => {
                    //console.log(e)
                    //console.log(e.data)
                    if (e.data.message == "setActionHandlerCB") {
                        if (e.data.action == "previoustrack") {
                            Utils.player.previous()
                        }
                        if (e.data.action == "nexttrack") {
                            Utils.player.next()
                        }
                        if (e.data.action == "play") {
                            Utils.player.play()
                        }
                        if (e.data.action == "pause") {
                            Utils.player.pause()
                        }
                        if (e.data.action == "seekto") {
                            if (e.data.event.seekTime) Utils.player.seek(e.data.event.seekTime)
                        }
                    }
                })
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.style.opacity = "1"
            }
        })
    }

    urlsCreated = []

    createObjURL(blob) {
        let u = URL.createObjectURL(blob)
        this.urlsCreated.push(u)
    }

    clearUrls() {
        for (let url of this.urlsCreated) {
            URL.revokeObjectURL(url)
        }
    }

    async updateMediaSession(part, url, data) {
        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl);
        [frames[0], frames[0].frames[0]].forEach((x) => {
            if (part == "changeMediaMetadata") {
                x.postMessage({
                    message: part, inData: {
                        title: navigator.mediaSession.metadata.title,
                        album: navigator.mediaSession.metadata.album,
                        artist: navigator.mediaSession.metadata.artist,
                        artwork: JSON.stringify(navigator.mediaSession.metadata.artwork),
                    }, platform: platform
                }, url)
            }
            if (part == "changePositionState") {
                x.postMessage({ message: part, inData: data, platform: platform }, url)
            }
            if (part == "setActionHandler") {
                let id = Date.now() + (Math.random() + 1).toString(36).substring(7);
                if (Utils.queueManager.canPrevious()) x.postMessage({ message: part, inData: { action: "previoustrack" }, id: id, platform: platform }, url)
                if (Utils.queueManager.canNext()) x.postMessage({ message: part, inData: { action: "nexttrack" }, id: id, platform: platform }, url)
                x.postMessage({ message: part, inData: { action: "play" }, id: id, platform: platform }, url)
                x.postMessage({ message: part, inData: { action: "pause" }, id: id, platform: platform }, url)
                x.postMessage({ message: part, inData: { action: "seekto" }, id: id, platform: platform }, url)
            }
        })
    }

    async updateDiscordRPC(pb, setNothing = false) {
        if (Utils.app.getSetting("gen_discordRPC")) {
            if (!setNothing) {
                let buttons = []
                if (!Utils.player.isLocalMusic) buttons.push({ label: "Listen music", url: Utils.queueManager.currentSong.url })
                if (!Utils.servURL.includes("192.168")) buttons.push({ label: "Download AyMusic", url: Utils.servURL + "projects/AyMusic.php" })
                let plat = Utils.player.isLocalMusic ? "icon" : (await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)).toLowerCase()
                let platName = Utils.player.isLocalMusic ? "Local music" : await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                let out = {
                    details: "Listening " + Utils.queueManager.currentSong.title,
                    state: "By " + Utils.queueManager.currentSong.singerName,
                    endTimestamp: Date.now() + (Utils.queueManager.currentSong.time - pb.getValue()),
                    largeImageKey: "icon",
                    largeImageText: "AyMusic by Aketsuky",
                    smallImageKey: plat,
                    smallImageText: "Listening on " + platName,
                    instance: false,
                }
                if (buttons.length > 0) out["buttons"] = buttons
                Utils.app.remoteClient.discordRPC(out)
            }
            else {
                Utils.app.remoteClient.discordRPC({})
            }
        }
    }
}