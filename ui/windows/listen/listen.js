import ImageCacheHandler from "../../../class/imageCacheHandler.js";
import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Singer from "../../../class/music/singer.js";
import Song from "../../../class/music/song.js";
import PlatformHandler from "../../../class/player/platformHandler.js";
import TimerHandler from "../../../class/player/timerHandler.js";
import TaskHandler from "../../../class/taskHandler.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import ContextMenu from "../../components/contextMenu/contextMenu.js";
import InfoPanel from "../../components/infoPanel/infoPanel.js";
import ProgressBar from "../../components/progressBar/progressBar.js";
import ListenViewerWindow from "../listenViewer/listenViewer.js";
import LyricsViewerWindow from "../lyricsViewer/lyricsViewer.js";
import QueueViewerWindow from "../queueViewer/queueViewer.js";

export default class ListenWindow extends HTMLDivElement {
    fakeMetadata = {
        title: null,
        artist: null,
        album: null,
        artwork: [
            { src: null, sizes: '512x512', type: 'image/png' },
        ]
    }
    needRefreshTime = -1

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.4s"
        this.style.position = "absolute"
        this.style.bottom = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "78px" : "0"
        this.style.left = "0"
        this.style.right = "0"
        this.style.zIndex = "2"
        Import.getData("/ui/windows/listen/listen" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                this.style.opacity = "1"
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
                        let origin = "app://root"
                        if (Utils.app.platform == "Android") origin = "https://myapp"
                        let iframeUrl = "IframeUrlMediaSession"
                        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") iframeUrl = "IframeUrlMediaSessionMobile"
                        Utils.app.remoteClient.registerIframeUrl(await PlatformHandler.getPlatformUrl(platform, iframeUrl), `addEventListener('message', async (e) =>
                        {
                            if(e.origin.includes('` + origin + `'))
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
                                        position: e.data.inData.cur / 1000,
                                        duration: e.data.inData.dur / 1000
                                    });
                                }
                                if(e.data.message == 'setActionHandler')
                                {
                                    navigator.mediaSession.setActionHandler(e.data.inData.action, (event) => { 
                                        if(parent.parent) parent.parent.postMessage({message: 'setActionHandlerCB', action: e.data.inData.action, id: e.data.id, event: event}, '` + origin + `')
                                        else parent.postMessage({message: 'setActionHandlerCB', action: e.data.inData.action, id: e.data.id, event: event}, '` + origin + `')
                                    });
                                }
                            }
                        })`)
                    }
                    shadow.getElementById("music_title").innerText = Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title
                    shadow.getElementById("music_artist").innerText = ""
                    let span = document.createElement("span")
                    span.innerText = Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName
                    span.classList.add("link")
                    span.onclick = async function () {
                        if (Utils.queueManager.currentSong.imgUrl !== "localImg") {
                            Utils.musicViewer.changeView("si_" + Utils.queueManager.currentSong.singerID)
                        }
                    }
                    this.shadowRoot.getElementById("music_artist").appendChild(span)
                    if (Utils.queueManager.currentSong.imgUrl !== "localImg") {
                        for (let sing of Utils.queueManager.currentSong.additionalSingers) {
                            let sep = document.createElement("span")
                            sep.innerText = " • "
                            this.shadowRoot.getElementById("music_artist").appendChild(sep)
                            let span2 = document.createElement("span")
                            span2.innerText = sing.aliasSingerName != null ? sing.aliasSingerName : sing.singerName
                            span2.classList.add("link")
                            span2.onclick = async function () {
                                Utils.musicViewer.changeView("si_" + sing.singerID)
                            }
                            this.shadowRoot.getElementById("music_artist").appendChild(span2)
                        }
                    }
                    document.title = shadow.getElementById("music_title").innerText + " • " + shadow.getElementById("music_artist").innerText.replace(" • ", ", ") + " - AyMusic"
                    if (Utils.player.isLocalMusic) {
                        if (!this.shadowRoot.getElementById("music_title").classList.contains("nohover")) this.shadowRoot.getElementById("music_title").classList.add("nohover")
                        if (!this.shadowRoot.getElementById("music_artist").classList.contains("nohover")) this.shadowRoot.getElementById("music_artist").classList.add("nohover")
                    }
                    else {
                        if (this.shadowRoot.getElementById("music_title").classList.contains("nohover")) this.shadowRoot.getElementById("music_title").classList.remove("nohover")
                        if (this.shadowRoot.getElementById("music_artist").classList.contains("nohover")) this.shadowRoot.getElementById("music_artist").classList.remove("nohover")
                    }
                    shadow.getElementById("like").children[0].setAttribute("d", Utils.libManager.isSongIsInLikedSongs(Utils.queueManager.currentSong) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
                    Utils.libManager.userInfo.curObject = Utils.queueManager.currentObject.id
                    Utils.libManager.userInfo.curMusic = "so_" + Utils.queueManager.currentSong.id
                    shadow.getElementById("next").style.color = Utils.queueManager.canNext() ? "white" : "gray"
                    shadow.getElementById("previous").style.color = Utils.queueManager.canPrevious() ? "white" : "gray"
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
                                if (Utils.app.platform != "Android") {
                                    let blob = await (await fetch(imge.src)).blob();
                                    let dataUrl = await new Promise(resolve => {
                                        let reader = new FileReader();
                                        reader.onload = () => resolve(reader.result);
                                        reader.readAsDataURL(blob);
                                    });
                                    navigator.mediaSession.metadata = new window.MediaMetadata({
                                        title: Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title,
                                        artist: Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName,
                                        album: Utils.queueManager.currentSong.albumName,
                                        artwork: [
                                            { src: dataUrl, sizes: '512x512', type: 'image/png' },
                                        ]
                                    });
                                }
                                else {
                                    this.fakeMetadata = {
                                        title: Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title,
                                        artist: Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName,
                                        album: Utils.queueManager.currentSong.albumName,
                                        artwork: [
                                            { src: imge.src, sizes: '512x512', type: 'image/png' },
                                        ]
                                    }
                                }
                            }
                            let imgU = "app://data"
                            if (Utils.app.platform == "Android") imgU = "https://mydata";
                            imge.src = imgU + "/Image/" + Utils.queueManager.currentSong.id + ".png"
                        }
                        else {
                            this.shadowRoot.getElementById("music_img").src = "/resources/icon.ico"
                            if (Utils.app.platform != "Android") {
                                navigator.mediaSession.metadata = new window.MediaMetadata({
                                    title: Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title,
                                    artist: Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName,
                                    album: Utils.queueManager.currentSong.albumName,
                                    artwork: [
                                        { src: "/resources/icon.ico", sizes: '512x512', type: 'image/png' },
                                    ]
                                });
                            }
                            else {
                                this.fakeMetadata = {
                                    title: Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title,
                                    artist: Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName,
                                    album: Utils.queueManager.currentSong.albumName,
                                    artwork: [
                                        { src: "/resources/icon.ico", sizes: '512x512', type: 'image/png' },
                                    ]
                                }
                            }
                        }
                    }
                    else {
                        let iUrl = await ImageCacheHandler.getCacheForImageUrl(Utils.queueManager.currentSong.imgUrl)
                        this.shadowRoot.getElementById("music_img").src = iUrl
                        if (Utils.app.platform != "Android") {
                            navigator.mediaSession.metadata = new window.MediaMetadata({
                                title: Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title,
                                artist: Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName,
                                album: Utils.queueManager.currentSong.albumName,
                                artwork: [
                                    { src: Utils.queueManager.currentSong.imgUrl, sizes: '512x512', type: 'image/png' },
                                ]
                            });
                        }
                        else {
                            this.fakeMetadata = {
                                title: Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title,
                                artist: Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName,
                                album: Utils.queueManager.currentSong.albumName,
                                artwork: [
                                    { src: Utils.queueManager.currentSong.imgUrl, sizes: '512x512', type: 'image/png' },
                                ]
                            }
                        }
                    }
                    if (Utils.app.platform != "Android") {
                        navigator.mediaSession.playbackState = "paused";
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
                    }
                    else {
                        Utils.app.remoteClient.sessionChangePlaying(false)
                    }
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
                            if (Utils.app.platform != "Android") {
                                navigator.mediaSession.playbackState = "playing";
                            }
                            else {
                                Utils.app.remoteClient.sessionChangePlaying(true)
                            }
                        }
                    }
                    if (!Utils.player.isLocalMusic) {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        this.updateMediaSession("changeMediaMetadata", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                        this.updateMediaSession("setActionHandler", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                        this.updateMediaSession("changePositionState", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), {
                            pR: 1,
                            cur: pb.getValue(),
                            dur: pb.getMax()
                        })
                    }
                    else {
                        if (Utils.app.platform == "Android") {
                            Utils.app.remoteClient.sessionChangeMediaMetadata(this.fakeMetadata.title, this.fakeMetadata.album, this.fakeMetadata.artist, this.fakeMetadata.artwork[0].src)
                        }
                    }
                    if (firstPlay && Utils.queueManager.currentSong != null && !Utils.player.needPlay) {
                        await Utils.player.seek(Utils.libManager.userInfo.curTime)
                        firstPlay = false
                    }
                    if (this.needRefreshTime != -1) {
                        await Utils.player.seek(this.needRefreshTime * 1000)
                        this.needRefreshTime = -1
                        Utils.player.play()
                    }
                })
                Utils.player.onTimeUpdate(async () => {
                    let cur = await Utils.player.getCurrentTime()
                    if (!mouseDownPb) pb.changeValue(cur)
                    if (document.visibilityState == "visible")
                        shadow.getElementById("curTime").firstChild.textContent = Utils.msToTime(cur)
                    if (!Utils.player.isLocalMusic) {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        //this.updateMediaSession("changeMediaMetadata", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                        //this.updateMediaSession("setActionHandler", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                        if (Utils.app.platform == "Android") {
                            this.updateMediaSession("changePositionState", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), {
                                pR: 1,
                                cur: cur,
                                dur: pb.getMax()
                            })
                        }
                    }
                    else {
                        if (Utils.app.platform != "Android") {
                            navigator.mediaSession.setPositionState({
                                playbackRate: 1,
                                position: cur / 1000,
                                duration: pb.getMax() / 1000
                            });
                        }
                        else {
                            let data = {
                                pR: 1,
                                cur: cur,
                                dur: pb.getMax()
                            }
                            Utils.app.remoteClient.sessionChangePositionState(data.cur, data.dur, data.pR)
                        }
                    }
                    if ((cur - Utils.queueManager.currentSong.cropStart) >= 0 && (cur - Utils.queueManager.currentSong.cropStart) < 1000 && await Utils.player.getState()) {
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
                pb.onRelease(async () => {
                    mouseDownPb = false;
                    await Utils.player.seek(pb.getValue());
                    this.updateDiscordRPC(pb, false)
                })
                Utils.musicViewer.onSongChange((e) => {
                    if (e.detail.objId.startsWith("so_") && Utils.queueManager.currentSong.id == e.detail.objId.replace("so_", "")) {
                        shadow.getElementById("music_title").innerText = e.detail.aliasTitle != "" ? e.detail.aliasTitle : Utils.queueManager.currentSong.title
                        shadow.getElementById("music_artist").innerText = ""
                        let span = document.createElement("span")
                        span.innerText = e.detail.aliasSongSingerName != "" ? e.detail.aliasSongSingerName : Utils.queueManager.currentSong.singerName
                        span.classList.add("link")
                        span.onclick = async function () {
                            if (Utils.queueManager.currentSong.imgUrl !== "localImg") {
                                Utils.musicViewer.changeView("si_" + Utils.queueManager.currentSong.singerID)
                            }
                        }
                        this.shadowRoot.getElementById("music_artist").appendChild(span)
                        if (Utils.queueManager.currentSong.imgUrl !== "localImg") {
                            for (let sing of Utils.queueManager.currentSong.additionalSingers) {
                                let sep = document.createElement("span")
                                sep.innerText = " • "
                                this.shadowRoot.getElementById("music_artist").appendChild(sep)
                                let span2 = document.createElement("span")
                                span2.innerText = sing.aliasSingerName != null ? sing.aliasSingerName : sing.singerName
                                span2.classList.add("link")
                                span2.onclick = async function () {
                                    Utils.musicViewer.changeView("si_" + sing.singerID)
                                }
                                this.shadowRoot.getElementById("music_artist").appendChild(span2)
                            }
                        }
                        document.title = shadow.getElementById("music_title").innerText + " • " + shadow.getElementById("music_artist").innerText.replace(" • ", ", ") + " - AyMusic"
                        Utils.queueManager.currentSong.cropStart = e.detail.cropStart
                        Utils.queueManager.currentSong.cropEnd = e.detail.cropEnd
                        this.updateDiscordRPC(pb, true)
                    }
                })
                Utils.player.onShuffleChange(async () => {
                    if (Utils.queueManager.shuffle) {
                        shadow.getElementById("shuffle").children[0].setAttribute("fill", "#00ccff")
                    }
                    else {
                        shadow.getElementById("shuffle").children[0].setAttribute("fill", "currentColor")
                    }
                    shadow.getElementById("next").style.color = Utils.queueManager.canNext() ? "white" : "gray"
                    shadow.getElementById("previous").style.color = Utils.queueManager.canPrevious() ? "white" : "gray"
                    if (Utils.app.platform != "Android") {
                        navigator.mediaSession.setActionHandler('previoustrack', Utils.queueManager.canPrevious() ? () => {
                            Utils.player.previous()
                        } : null);
                        navigator.mediaSession.setActionHandler("nexttrack", Utils.queueManager.canNext() ? () => {
                            Utils.player.next()
                        } : null);
                    }
                    Utils.app.changeSetting("shuffle", Utils.queueManager.shuffle)
                    if (!Utils.player.isLocalMusic && Utils.queueManager.currentSong != null) {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        this.updateMediaSession("setActionHandler", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                    }
                })
                Utils.player.onRepeatChange(async () => {
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
                    if (Utils.app.platform != "Android") {
                        navigator.mediaSession.setActionHandler('previoustrack', Utils.queueManager.canPrevious() ? () => {
                            Utils.player.previous()
                        } : null);
                        navigator.mediaSession.setActionHandler("nexttrack", Utils.queueManager.canNext() ? () => {
                            Utils.player.next()
                        } : null);
                    }
                    Utils.app.changeSetting("repeat", Utils.queueManager.repeat)
                    if (!Utils.player.isLocalMusic && Utils.queueManager.currentSong != null) {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        this.updateMediaSession("setActionHandler", await PlatformHandler.getPlatformUrl(platform, "IframeUrlMediaSession"), null)
                    }
                })
                Utils.player.onPlay(async () => {
                    let cur = await Utils.player.getCurrentTime()
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
                    shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Pause"])
                    if (Utils.app.platform != "Android") {
                        navigator.mediaSession.playbackState = "playing";
                    }
                    else {
                        Utils.app.remoteClient.sessionChangePlaying(true)
                    }
                    this.updateDiscordRPC(pb, false)
                })
                Utils.player.onPause(async () => {
                    let cur = await Utils.player.getCurrentTime()
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
                    shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Play"])
                    if (Utils.app.platform != "Android") {
                        navigator.mediaSession.playbackState = "paused";
                    }
                    else {
                        Utils.app.remoteClient.sessionChangePlaying(false)
                    }
                    if (pb.getValue() != pb.getMax()) {
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
                    if (Utils.player.isMuted && Utils.player.volume != 0)
                        Utils.player.setMute(false)
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
                    try {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        console.log("Platform need refresh token")
                        await PlatformHandler.refreshTokenForPlatform(platform)
                        console.log("Platform token refreshed")
                        Utils.player.playSong(Utils.queueManager.currentSong)
                    }
                    catch (e) {
                        console.warn(e)
                    }
                })
                Utils.player.onSkipAds(async () => {
                    Utils.player.playSong(Utils.queueManager.currentSong)
                });
                Utils.player.onNeedRefresh(async () => {
                    this.needRefreshTime = await Utils.player.getCurrentTime()
                    Utils.player.playSong(Utils.queueManager.currentSong)
                });
                Utils.player.onNotConnected(async () => {
                    let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                    let errPanel = new InfoPanel("Not connected into " + platform, "You must be connected into " + platform + " to listen a music on this platform!\nIf you're sure to be connected into " + platform + ", please click on \"I'm connected!\".", [
                        {
                            text: "OK", isPositive: true, onclick: () => {
                                errPanel.close()
                            }
                        },
                        {
                            text: "I'm connected!", isPositive: false, onclick: () => {
                                location.reload()
                            }
                        }], false)
                    document.getElementById("main").appendChild(errPanel)
                });
                Utils.libManager.onAddSongToLikedSongs((e) => {
                    if (Utils.queueManager.currentSong != null && e.detail.objId == "so_" + Utils.queueManager.currentSong.id) {
                        shadow.getElementById("like").children[0].setAttribute("d", Utils.pathsData["Heart"])
                    }
                });
                Utils.libManager.onRemoveSongFromLikedSongs((e) => {
                    if (Utils.queueManager.currentSong != null && e.detail.objId == "so_" + Utils.queueManager.currentSong.id) {
                        shadow.getElementById("like").children[0].setAttribute("d", Utils.pathsData["HeartOutline"])
                    }
                });
                if (Utils.app.platform != "Android" && Utils.app.platform != "iOS") {
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
                    let lyrics = new LyricsViewerWindow()
                    //document.getElementById("main").appendChild(queueViewer)
                    shadow.getElementById("lyrics").onclick = () => {
                        if (lyrics.isClosed) {
                            lyrics.show()
                        }
                        else {
                            lyrics.hide()
                        }
                    }
                    var cm = new ContextMenu()
                    var cm2 = new ContextMenu()
                    cm2.beforeShow = () => {
                        if (TimerHandler.timers != -1) {
                            cm2.addElement("{timer.clear}", () => {
                                TimerHandler.clearTimers()
                            })
                        }
                        cm2.addElement("{timer.5}", () => {
                            TimerHandler.addTimer(5)
                        })
                        cm2.addElement("{timer.10}", () => {
                            TimerHandler.addTimer(10)
                        })
                        cm2.addElement("{timer.15}", () => {
                            TimerHandler.addTimer(15)
                        })
                        cm2.addElement("{timer.30}", () => {
                            TimerHandler.addTimer(30)
                        })
                        cm2.addElement("{timer.45}", () => {
                            TimerHandler.addTimer(45)
                        })
                        cm2.addElement("{timer.60}", () => {
                            TimerHandler.addTimer(60)
                        })
                    }
                    cm.beforeShow = () => {
                        if (Utils.queueManager.currentSong.imgUrl !== "localImg") {
                            cm.addElement("{lib.openLink}", () => {
                                Utils.app.remoteClient.openLink(Utils.queueManager.currentSong.url)
                            })
                        }
                        cm.addElement("{lib.modifySong}", () => {
                            Utils.musicViewer.changeView("so_" + Utils.queueManager.currentSong.id)
                        })
                        cm.addSubContextMenu("{timer}", cm2)
                    }
                    shadow.getElementById("menu").onclick = (e) => {
                        cm.show(e)
                    }
                }
                else {
                    let lvw = new ListenViewerWindow()
                    //document.getElementById("main").appendChild(queueViewer)
                    shadow.getElementById("left").onclick = () => {
                        if (lvw.isClosed) {
                            lvw.show()
                        }
                        else {
                            lvw.close()
                        }
                    }
                    window.listeners.showListenViewerWindow = () => {
                        lvw.show()
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
                if (Utils.app.platform != "Android" && Utils.app.platform != "iOS") {
                    shadow.getElementById("music_title").onclick = () => {
                        if (Utils.queueManager.currentSong.imgUrl !== "localImg") {
                            Utils.musicViewer.changeView("al_" + Utils.queueManager.currentSong.albumID)
                        }
                    }
                }
                if (Utils.libManager.userInfo.curMusic != null) {
                    if (Utils.libManager.userInfo.curObject.startsWith("pl_")) {
                        let result = null;
                        for (let pl of Utils.libManager.userPlaylists) {
                            if ("pl_" + pl.id == Utils.libManager.userInfo.curObject) {
                                result = pl;
                            }
                        }
                        await Utils.queueManager.changeQueue(result, Utils.libManager.userInfo.curMusic, false)
                    }
                    else if (Utils.libManager.userInfo.curObject.startsWith("al_")) {
                        Utils.apiManager.fetchAPI({
                            act: "getAlbumInfo",
                            id: Utils.libManager.userInfo.curObject.replace("al_", ""),
                            offset: 0
                        }, async (result) => {
                            let al = result["albumInfo"]
                            await Utils.queueManager.changeQueue(new Album(al.id, al.name, al.singerID, al.type, al.imgUrl, al.albumUrl), Utils.libManager.userInfo.curMusic, false)
                        })
                    }
                    else if (Utils.libManager.userInfo.curObject.startsWith("si_")) {
                        Utils.apiManager.fetchAPI({
                            act: "getSingerInfo",
                            id: Utils.libManager.userInfo.curObject.replace("si_", "")
                        }, async (result) => {
                            let al = result["singerInfo"]
                            await Utils.queueManager.changeQueue(new Singer(al.id, al.name, al.imgUrl, al.singerUrl, al.aliasName), Utils.libManager.userInfo.curMusic, false)
                        })
                    }
                    else {
                        Utils.apiManager.fetchAPI({
                            act: "getSongInfo",
                            id: Utils.libManager.userInfo.curMusic.replace("so_", "")
                        }, async (obj) => {
                            await Utils.queueManager.changeQueue(new Song(obj.songID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.albumUrl, obj.singerUrl, obj.additionalSingers, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName), Utils.libManager.userInfo.curMusic, false)
                        })
                    }
                }
                pbVol.changeValue(parseInt(Utils.app.getSetting("music_vol")))
                if (Utils.app.getSetting("mute")) Utils.player.setMute(true)
                window.listeners.player.previous = () => Utils.player.previous()
                window.listeners.player.disconnect = () => Utils.player.disconnect()
                window.listeners.player.next = () => Utils.player.next()
                let audioPrio = false;
                window.listeners.player.play = () => {
                    Utils.player.play()
                }
                window.listeners.player.setVolume = (vol) => {
                    Utils.player.changeVolume(vol)
                }
                window.listeners.player.pause = () => Utils.player.pause()
                window.listeners.player.seek = (time) => Utils.player.seek(time)
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
                            if (e.data.event.seekTime) Utils.player.seek(e.data.event.seekTime * 1000)
                        }
                    }
                })
                window.addEventListener("keydown", async (e) => {
                    if (e.key == " " && e.target == document.body && !e.repeat) {
                        if (await Utils.player.getState()) {
                            Utils.player.pause()
                        }
                        else {
                            Utils.player.play()
                        }
                    }
                })
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
        if (Utils.app.platform != "Android") {
            let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl);
            let ifr = [frames[0]]
            try {
                ifr.push(frames[0].frames[0])
            }
            catch { }
            ifr.forEach((x) => {
                if (typeof x != "undefined") {
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
                }
            })
        }
        else {
            if (part == "changeMediaMetadata") {
                Utils.app.remoteClient.sessionChangeMediaMetadata(this.fakeMetadata.title, this.fakeMetadata.album, this.fakeMetadata.artist, this.fakeMetadata.artwork[0].src)
            }
            if (part == "changePositionState") {
                Utils.app.remoteClient.sessionChangePositionState(data.cur, data.dur, data.pR)
            }
            if (part == "setActionHandler") {

            }
            //Utils.app.remoteClient.setMediaSession()
        }
    }

    async updateDiscordRPC(pb, setNothing = false) {
        if (Utils.app.settings.gen_discordRPC) {
            if (!setNothing) {
                let buttons = []
                if (!Utils.player.isLocalMusic) buttons.push({ label: "Listen this music", url: Utils.queueManager.currentSong.url })
                buttons.push({ label: "Download AyMusic", url: Utils.realServURL + "projects/AyMusic.php" })
                let plat = Utils.player.isLocalMusic ? "icon" : (await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)).toLowerCase()
                let platName = Utils.player.isLocalMusic ? "their PC" : await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                let singer = Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName
                for (let sing of Utils.queueManager.currentSong.additionalSingers) {
                    singer += ", " + (sing.aliasSingerName != null ? sing.aliasSingerName : sing.singerName)
                }
                let out = {
                    details: "Listening " + (Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title),
                    state: "By " + (singer),
                    endTimestamp: Date.now() + ((Utils.queueManager.currentSong.cropEnd != -1 ? Utils.queueManager.currentSong.cropEnd : pb.getMax()) - pb.getValue()),
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

    disconnectedCallback() {
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
    }
}