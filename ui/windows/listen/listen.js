import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Singer from "../../../class/music/singer.js";
import Song from "../../../class/music/song.js";
import Playlist from "../../../class/music/playlist.js";
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
import SettingsWindow from "../settings/settings.js";
import GestureHandler from "../../../class/gestureHandler.js";
import MediaSessionManager from "../../../class/player/mediaSessionManager.js";
import DiscordRPCHandler from "../../../class/discordRPCHandler.js";

export default class ListenWindow extends HTMLElement {
    needRefreshTime = {
        time: - 1,
        songID: null
    }

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.4s"
        this.style.position = "absolute"
        Import.getData("/ui/windows/listen/listen" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then(async (html) => {
            let insets = JSON.parse(await Utils.app.remoteClient.getWindowInsets());
            this.style.bottom = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? (78 + insets.bottom / devicePixelRatio) + "px" : "0"
            this.style.left = "0"
            this.style.right = "0"
            this.style.zIndex = "2"
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                this.translation = new Translations(shadow.children[1])
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
                    shadow.getElementById("changeState").children[1].classList.add("playSVG")
                    if (!Utils.player.isLocalMusic) {
                        let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                        let origin = "app://root"
                        if (Utils.app.platform == "Android") origin = "https://myapp"
                        let iframeUrl = "IframeUrlMediaSession"
                        if (Utils.app.platform == "Android" || Utils.app.platform == "iOS") iframeUrl = "IframeUrlMediaSessionMobile"
                        MediaSessionManager.overrideMediaSessionTaskUrl(await PlatformHandler.getPlatformUrl(platform, iframeUrl))
                    }
                    shadow.getElementById("music_title").innerText = Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title
                    shadow.getElementById("music_artist").innerText = ""
                    let span = document.createElement("span")
                    span.innerText = Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName
                    span.classList.add("link")
                    span.onclick = async function () {
                        if (!(Utils.app.platform == "Android" || Utils.app.platform == "iOS") && Utils.queueManager.currentSong.imgUrl !== "localImg") {
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
                                if (!(Utils.app.platform == "Android" || Utils.app.platform == "iOS"))
                                    Utils.musicViewer.changeView("si_" + sing.singerID)
                            }
                            this.shadowRoot.getElementById("music_artist").appendChild(span2)
                        }
                    }
                    document.title = shadow.getElementById("music_title").innerText + " • " + shadow.getElementById("music_artist").innerText.split(" • ").join(", ") + " - AyMusic"
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
                        var imge = this.shadowRoot.getElementById("music_img");
                        imge.onerror = () => {
                            imge.src = "/resources/icon.ico"
                        }
                        imge.onload = () => {
                            this.updateMediaSession("metadata", true)
                        }
                        let imgU = "app://data"
                        if (Utils.app.platform == "Android") imgU = "https://mydata";
                        imge.src = imgU + "/Image/" + Utils.queueManager.currentSong.id + ".png"
                    }
                    else {
                        this.shadowRoot.getElementById("music_img").src = Utils.queueManager.currentSong.imgUrl
                        this.updateMediaSession("metadata", true)
                    }
                    MediaSessionManager.setPlaybackStatePlaying(false)
                    this.updateMediaSession("actionHandler", true)
                })
                let firstPlay = true
                Utils.player.onLoadedMetadata(async () => {
                    let dur = await Utils.player.getDuration()
                    if (dur != -1) {
                        pb.changeValue(0)
                        pb.changeMax(dur)
                        shadow.getElementById("maxTime").innerText = Utils.msToTime(dur)
                        shadow.getElementById("curTime").innerText = Utils.msToTime(0)
                        shadow.getElementById("changeState").children[1].classList.remove("playSVG")
                        if (await Utils.player.getState()) {
                            shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Pause"])
                            MediaSessionManager.setPlaybackStatePlaying(true)
                        }
                    }
                    this.updateMediaSession("metadata", true)
                    this.updateMediaSession("actionHandler", true)
                    this.updateMediaSession("playbackState", true)
                    if (firstPlay && Utils.queueManager.currentSong != null && !Utils.player.needPlay) {
                        await Utils.player.seek(Utils.libManager.userInfo.curTime)
                        this.updateMediaSession("playbackState", true)
                        firstPlay = false
                    }
                    if (this.needRefreshTime.time != -1 && this.needRefreshTime.songID == Utils.queueManager.currentSong.id && this.needRefreshTime.time + 5000 < await Utils.player.getDuration()) {
                        await Utils.player.seek(this.needRefreshTime.time)
                        this.needRefreshTime.time = -1
                        this.needRefreshTime.songID = null
                        await Utils.player.play()
                        this.updateMediaSession("playbackState", true)
                    }
                    setTimeout(() => {
                        if (Utils.app.platform == "Android") MediaSessionManager.setPlaybackStatePlaying(true)
                    }, 100)
                })
                Utils.player.onTimeUpdate(async () => {
                    let cur = await Utils.player.getCurrentTime()
                    if (!mouseDownPb) pb.changeValue(cur)
                    if (document.visibilityState == "visible")
                        shadow.getElementById("curTime").firstChild.textContent = Utils.msToTime(cur)
                    if ((cur - Utils.queueManager.currentSong.cropStart) >= 0 && (cur - Utils.queueManager.currentSong.cropStart) < 1000 && await Utils.player.getState()) {
                        DiscordRPCHandler.updateDiscordRPC(pb, false)
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
                    DiscordRPCHandler.updateDiscordRPC(pb, !await Utils.player.getState())
                })
                Utils.musicViewer.onSongChange((e) => {
                    if (e.detail.objId.startsWith("so_") && Utils.queueManager.currentSong.id == e.detail.objId.replace("so_", "")) {
                        shadow.getElementById("music_title").innerText = e.detail.aliasTitle != "" ? e.detail.aliasTitle : Utils.queueManager.currentSong.title
                        shadow.getElementById("music_artist").innerText = ""
                        shadow.getElementById("changeState").children[1].classList.add("playSVG")
                        let span = document.createElement("span")
                        span.innerText = e.detail.aliasSongSingerName != "" ? e.detail.aliasSongSingerName : Utils.queueManager.currentSong.singerName
                        span.classList.add("link")
                        span.onclick = async function () {
                            if (!(Utils.app.platform == "Android" || Utils.app.platform == "iOS") && Utils.queueManager.currentSong.imgUrl !== "localImg") {
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
                                    if (!(Utils.app.platform == "Android" || Utils.app.platform == "iOS"))
                                        Utils.musicViewer.changeView("si_" + sing.singerID)
                                }
                                this.shadowRoot.getElementById("music_artist").appendChild(span2)
                            }
                        }
                        document.title = shadow.getElementById("music_title").innerText + " • " + shadow.getElementById("music_artist").innerText.replace(" • ", ", ") + " - AyMusic"
                        Utils.queueManager.currentSong.cropStart = e.detail.cropStart
                        Utils.queueManager.currentSong.cropEnd = e.detail.cropEnd
                        DiscordRPCHandler.updateDiscordRPC(pb, true)
                        this.updateMediaSession("metadata", true)
                        this.updateMediaSession("actionHandler", true)
                        this.updateMediaSession("playbackState", true)
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
                    Utils.app.changeSetting("shuffle", Utils.queueManager.shuffle)
                    this.updateMediaSession("actionHandler")
                    this.updateMediaSession("playbackState")
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
                    Utils.app.changeSetting("repeat", Utils.queueManager.repeat)
                    this.updateMediaSession("actionHandler")
                    this.updateMediaSession("playbackState")
                })
                Utils.player.onPlay(async () => {
                    shadow.getElementById("changeState").children[1].classList.remove("playSVG")
                    shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Pause"])
                    DiscordRPCHandler.updateDiscordRPC(pb, false)
                    this.updateMediaSession("metadata")
                    this.updateMediaSession("playbackState", true)
                })
                Utils.player.onPause(async () => {
                    shadow.getElementById("changeState").children[1].classList.remove("playSVG")
                    shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Play"])
                    this.updateMediaSession("playbackState", true)
                    if (pb.getValue() != pb.getMax()) {
                        DiscordRPCHandler.updateDiscordRPC(pb, true)
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
                Utils.player.onEnded(async (e) => {
                    if (Utils.queueManager.repeat != 2) {
                        Utils.player.next()
                    }
                    else {
                        if (!e.detail || !e.detail.noSeek) {
                            await Utils.player.seek(0)
                        }
                        await Utils.player.play()
                    }
                })
                Utils.player.onNeedTokenChange(async (e) => {
                    shadow.getElementById("changeState").children[1].classList.add("playSVG")
                    this.needRefreshTime.time = e.detail || await Utils.player.getCurrentTime()
                    if (this.needRefreshTime.time + 5000 < await Utils.player.getDuration()) this.needRefreshTime.songID = Utils.queueManager.currentSong.id
                    else this.needRefreshTime.time = -1
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
                    shadow.getElementById("changeState").children[1].classList.add("playSVG")
                    Utils.player.playSong(Utils.queueManager.currentSong)
                });
                Utils.player.onNeedRefresh(async (e) => {
                    shadow.getElementById("changeState").children[1].classList.add("playSVG")
                    this.needRefreshTime.time = e.detail || await Utils.player.getCurrentTime()
                    if (this.needRefreshTime.time + 5000 < await Utils.player.getDuration()) this.needRefreshTime.songID = Utils.queueManager.currentSong.id
                    else this.needRefreshTime.time = -1
                    Utils.player.playSong(Utils.queueManager.currentSong)
                });
                Utils.player.onNotConnected(async () => {
                    shadow.getElementById("changeState").children[1].classList.add("playSVG")
                    let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                    let errPanel = new InfoPanel("Not connected into " + platform, "You must be connected into " + platform + " to listen a music on this platform!\nIf you're sure to be connected into " + platform + ", please click on \"I'm connected!\".", [
                        {
                            text: "Close", isPositive: false, onclick: () => {
                                errPanel.close()
                            }
                        },
                        {
                            text: "I'm connected!", isPositive: false, onclick: async () => {
                                if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform) Utils.player.needTokenChange()
                                else Utils.player.playSong(Utils.queueManager.currentSong)
                                errPanel.close()
                            }
                        },
                        {
                            text: "Connect", isPositive: true, onclick: async () => {
                                errPanel.close()
                                await SettingsWindow.connectToPlatform(platform)
                            }
                        }], false)
                    document.getElementById("main").appendChild(errPanel)
                });
                Utils.player.onIncompatible(async (e) => {
                    shadow.getElementById("changeState").children[1].classList.add("playSVG")
                    let platform = await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                    let reason = e.detail || "Unknown reason"
                    let errPanel = new InfoPanel("Incompatible platform", platform + " is not compatible with your device.\nReason: " + reason + ".", [
                        {
                            text: "Close", isPositive: true, onclick: () => {
                                errPanel.close()
                            }
                        }
                    ], false)
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
                    var cm3 = new ContextMenu()
                    cm3.beforeShow = () => {
                        let havePl = false;
                        for (let pl of Utils.libManager.userPlaylists) {
                            if (!pl.name.includes("{") && !pl.name.includes("}")) {
                                havePl = true
                                cm3.addElement(pl.name, () => {
                                    Utils.libManager.addSongToAPlaylist(pl.id, "so_" + Utils.queueManager.currentSong.id)
                                })
                            }
                        }
                        if (!havePl) {
                            cm3.addElement("No playlists available", () => { })
                        }
                    }
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
                    cm.beforeShow = async () => {
                        if (Utils.queueManager.currentSong.imgUrl !== "localImg") {
                            cm.addElement("{lib.openLink}", () => {
                                Utils.app.remoteClient.openLink(Utils.queueManager.currentSong.url)
                            })
                        }
                        cm.addElement("{lib.modifySong}", () => {
                            Utils.musicViewer.changeView("so_" + Utils.queueManager.currentSong.id)
                        })
                        cm.addSubContextMenu("{timer}", cm2)
                        cm.addSubContextMenu("{lib.addToPl}", cm3)
                        if (Utils.queueManager.currentSong != null
                            && Utils.queueManager.currentObject != null
                            && Utils.queueManager.currentObject.id != "pl_" + Utils.libManager.userInfo.likedSongsPlId
                            && Utils.libManager.userPlaylists.filter((pl) => pl.id == Utils.queueManager.currentObject.id.replace("pl_", "")).length > 0) {
                            let result = await Utils.apiManager.doPostRequest({
                                act: "getIdSongsInPlaylist",
                                playlistID: Utils.queueManager.currentObject.id.replace("pl_", ""),
                                orderByDesc: false
                            })
                            if (result.includes("so_" + Utils.queueManager.currentSong.id)) {
                                cm.addElement("{lib.removeFromCurrentPl}", () => {
                                    Utils.libManager.removeSongFromAPlaylist(Utils.queueManager.currentObject.id.replace("pl_", ""), "so_" + Utils.queueManager.currentSong.id)
                                })
                            }
                        }
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
                Utils.apiManager.doPostRequest({ act: "getUserInfo" }).then(async (rep) => {
                    if (rep.curMusic != null) {
                        if (rep.curObject.startsWith("pl_")) {
                            let result = null;
                            for (let pl of rep.playlists) {
                                if ("pl_" + pl.id == rep.curObject) {
                                    let npl = new Playlist(pl.id, pl.name, pl.userID, pl.desc, pl.imgUrl, pl.isPrivate, pl.rank)
                                    result = npl;
                                }
                            }
                            await Utils.queueManager.changeQueue(result, rep.curMusic, window.enableFirstAutoPlay || false)
                        }
                        else if (rep.curObject.startsWith("al_")) {
                            Utils.apiManager.fetchAPI({
                                act: "getAlbumInfo",
                                id: rep.curObject.replace("al_", ""),
                                offset: 0
                            }, async (result) => {
                                let al = result["albumInfo"]
                                await Utils.queueManager.changeQueue(new Album(al.id, al.name, al.singerID, al.type, al.imgUrl, al.albumUrl), rep.curMusic, window.enableFirstAutoPlay || false)
                            })
                        }
                        else if (rep.curObject.startsWith("si_")) {
                            Utils.apiManager.fetchAPI({
                                act: "getSingerInfo",
                                id: rep.curObject.replace("si_", "")
                            }, async (result) => {
                                let al = result["singerInfo"]
                                await Utils.queueManager.changeQueue(new Singer(al.id, al.name, al.imgUrl, al.singerUrl, al.aliasName), rep.curMusic, window.enableFirstAutoPlay || false)
                            })
                        }
                        else {
                            Utils.apiManager.fetchAPI({
                                act: "getSongInfo",
                                id: rep.curMusic.replace("so_", "")
                            }, async (obj) => {
                                await Utils.queueManager.changeQueue(new Song(obj.songID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID, obj.albumUrl, obj.singerUrl, obj.additionalSingers, obj.aliasTitle, obj.aliasSongSingerName, obj.aliasSingerName), rep.curMusic, window.enableFirstAutoPlay || false)
                            })
                        }
                    }
                })
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
                window.listeners.player.setShuffle = (shuffle) => Utils.player.changeShuffle(shuffle)
                window.listeners.player.setRepeat = (repeat) => Utils.player.changeRepeat(repeat)
                window.listeners.queue.view = () => {
                    let songs = []
                    var curI = Utils.queueManager.currentIndex
                    for (let i in Utils.queueManager.allSongs) {
                        if (i > curI && i - curI < 50) {
                            let song = Utils.queueManager.allSongs[i].song
                            songs.push({
                                id: song.id,
                                objId: Utils.queueManager.allSongs[i].obj.id,
                                title: song.title,
                                artist: song.singerName,
                                album: song.albumName,
                                duration: song.time,
                                icon: song.imgUrl,
                            })
                        }
                    }
                    return JSON.stringify(songs)
                }
                window.listeners.queue.moveTo = (songId) => {
                    for (let songInfo of Utils.queueManager.allSongs) {
                        if (songInfo.song.id == songId) {
                            Utils.queueManager.seekToSong(songInfo.song)
                            break;
                        }
                    }
                }
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
                let gesture = new GestureHandler(shadow.querySelector("#left"), false)
                gesture.addEventListener("left", () => {
                    if (Utils.queueManager.canNext()) {
                        Utils.player.next()
                        gesture.acceptGesture()
                    }
                })
                gesture.addEventListener("right", () => {
                    if (Utils.queueManager.canPrevious()) {
                        Utils.player.previous(true)
                        gesture.acceptGesture()
                    }
                })
            }
        })
    }

    async updateMediaSession(part, allContexts = false) {
        let context = {
            mainFrame: allContexts || Utils.queueManager.currentSong.imgUrl == "localImg",
            subFrame: allContexts || Utils.queueManager.currentSong.imgUrl != "localImg"
        }
        if (part == "metadata") {
            let imgSrc = this.shadowRoot.getElementById("music_img").src
            if (!Utils.queueManager.currentSong.canBeLoaded) imgSrc = "/resources/icon.ico"
            let singer = Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName
            for (let sing of Utils.queueManager.currentSong.additionalSingers) {
                singer += ", " + (sing.aliasSingerName != null ? sing.aliasSingerName : sing.singerName)
            }
            MediaSessionManager.setMetadata({
                title: Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title,
                artist: singer,
                album: Utils.queueManager.currentSong.albumName,
                artwork: [
                    { src: imgSrc, sizes: '512x512', type: 'image/png' },
                ]
            }, context);
        }
        else if (part == "playbackState") {
            MediaSessionManager.setPlaybackState({
                position: await Utils.player.getCurrentTime() / 1000,
                duration: this.shadowRoot.getElementById("pb").getMax() / 1000,
                playbackRate: 1,
                playing: await Utils.player.getState(),
                shuffle: Utils.queueManager.shuffle,
                repeat: Utils.queueManager.repeat
            }, context);
        }
        else if (part == "actionHandler") {
            MediaSessionManager.setActionHandler('previoustrack', Utils.queueManager.canPrevious() ? () => {
                Utils.player.previous()
            } : null, context);
            MediaSessionManager.setActionHandler("nexttrack", Utils.queueManager.canNext() ? () => {
                Utils.player.next()
            } : null, context);
            MediaSessionManager.setActionHandler('play', () => { Utils.player.play() }, context);
            MediaSessionManager.setActionHandler('pause', () => { Utils.player.pause() }, context);
            MediaSessionManager.setActionHandler('seekbackward', null, context);
            MediaSessionManager.setActionHandler('seekforward', null, context);
            MediaSessionManager.setActionHandler('seekto', (e) => { if (e.seekTime) Utils.player.seek(e.seekTime * 1000) }, context);
        }
    }

    disconnectedCallback() {
        this.translation.end()
        //this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
        this.__proto__ = null
    }
}