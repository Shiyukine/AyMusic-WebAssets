import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Singer from "../../../class/music/singer.js";
import Song from "../../../class/music/song.js";
import PlatformHandler from "../../../class/player/platformHandler.js";
import TimerHandler from "../../../class/player/timerHandler.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import ContextMenu from "../../components/contextMenu/contextMenu.js";
import ProgressBar from "../../components/progressBar/progressBar.js";
import LyricsViewerWindow from "../lyricsViewer/lyricsViewer.js";
import QueueViewerWindow from "../queueViewer/queueViewer.js";
import GestureHandler from "../../../class/gestureHandler.js";

export default class ListenViewerWindow extends HTMLElement {
    isClosed = true;
    controller = new AbortController();
    id = Date.now()
    goToMusicViewer = ""

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.4s"
        this.style.position = "absolute"
        this.style.bottom = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "0" : "78px"
        this.style.left = "0"
        this.style.right = "0"
        this.style.top = "0"
        this.style.zIndex = "3"
        Import.getData("/ui/windows/listenViewer/listenViewer" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then(async (html) => {
            shadow.innerHTML = html
            let insets = JSON.parse(await Utils.app.remoteClient.getWindowInsets());
            let top = Math.max(36, insets.top / devicePixelRatio);
            shadow.querySelector("#topbar").style.top = (top) + "px";
            this.ontransitionend = () => { }
            /**
             * @type {ProgressBar}
             */
            let pb = shadow.getElementById("pb");
            window.addEventListener("popstate", (e) => {
                if (e.state.where != "listenViewer") {
                    this.close()
                }
            }, { signal: this.controller.signal })
            Utils.player.onSongChange(async () => {
                this.clearUrls()
                shadow.getElementById("changeState").children[1].classList.add("playSVG")
                shadow.getElementById("music_title").innerText = Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title
                shadow.getElementById("music_artist").innerText = ""
                let span = document.createElement("span")
                span.innerText = Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName
                span.classList.add("link")
                span.onclick = async () => {
                    if (Utils.queueManager.currentSong.imgUrl !== "localImg") {
                        history.back()
                        this.goToMusicViewer = "si_" + Utils.queueManager.currentSong.singerID
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
                        span2.onclick = async () => {
                            history.back()
                            this.goToMusicViewer = "si_" + sing.singerID
                        }
                        this.shadowRoot.getElementById("music_artist").appendChild(span2)
                    }
                }
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
                if (Utils.player.isLocalMusic) {
                    if (Utils.queueManager.currentSong.canBeLoaded) {
                        var imge = this.shadowRoot.getElementById("music_img");
                        var imge2 = this.shadowRoot.getElementById("bg");
                        imge.onerror = () => {
                            imge.src = "/resources/icon.ico"
                            imge2.style.backgroundImage = "url('/resources/background.jpg')"
                        }
                        let imgU = "app://data"
                        if (Utils.app.platform == "Android") imgU = "https://mydata";
                        imge.src = imgU + "/Image/" + Utils.queueManager.currentSong.id + ".png"
                        imge2.style.backgroundImage = "url(" + imgU + "/Image/" + Utils.queueManager.currentSong.id + ".png)"
                    }
                }
                else {
                    this.shadowRoot.getElementById("music_img").src = Utils.queueManager.currentSong.imgUrl
                    this.shadowRoot.getElementById("bg").style.backgroundImage = "url(" + Utils.queueManager.currentSong.imgUrl + ")"
                }
            })
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
                    }
                }
            })
            let mouseDownPb = false;
            Utils.player.onTimeUpdate(async () => {
                let cur = await Utils.player.getCurrentTime()
                if (!mouseDownPb) pb.changeValue(cur)
                shadow.getElementById("curTime").firstChild.textContent = Utils.msToTime(cur)
            })
            pb.onChanging(() => {
                mouseDownPb = true;
            })
            pb.onRelease(() => {
                mouseDownPb = false;
                Utils.player.seek(pb.getValue());
            })
            Utils.musicViewer.onSongChange(() => {
                shadow.getElementById("changeState").children[1].classList.add("playSVG")
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
            })
            Utils.player.onPlay(async () => {
                shadow.getElementById("changeState").children[1].classList.remove("playSVG")
                shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Pause"])
            })
            Utils.player.onPause(async () => {
                shadow.getElementById("changeState").children[1].classList.remove("playSVG")
                shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Play"])
            })
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
            Utils.player.onNeedTokenChange(async () => {
                shadow.getElementById("changeState").children[1].classList.add("playSVG")
            })
            Utils.player.onSkipAds(async () => {
                shadow.getElementById("changeState").children[1].classList.add("playSVG")
            });
            Utils.player.onNeedRefresh(async (e) => {
                shadow.getElementById("changeState").children[1].classList.add("playSVG")
            });
            Utils.player.onNotConnected(async () => {
                shadow.getElementById("changeState").children[1].classList.add("playSVG")
            });
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                this.shadowRoot.getElementById("listen").ontransitionend = () => { };
                this.shadowRoot.getElementById("listen").style = ""
                let firstS = true;

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
                shadow.getElementById("back").onclick = () => {
                    history.back()
                }
                shadow.getElementById("music_title").onclick = () => {
                    if (Utils.queueManager.currentSong.imgUrl !== "localImg") {
                        history.back()
                        this.goToMusicViewer = "al_" + Utils.queueManager.currentSong.albumID
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
                        history.back()
                        this.goToMusicViewer = "so_" + Utils.queueManager.currentSong.id
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
                //changed child index 1 to 2 with bg !
                this.translation = new Translations(shadow.children[2])
                new ThemeColor(shadow.children[2])
                let gesture = new GestureHandler(shadow.querySelector("#left_scroll"), false, 90)
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
                let gesture2 = new GestureHandler(shadow.querySelector("#listen"), true, 100)
                let quitViewer = () => {
                    history.back()
                    gesture2.acceptGesture()
                }
                gesture2.addEventListener("bottom", quitViewer)
                gesture2.addEventListener("top", quitViewer)
            }
        })
    }

    async show() {
        document.getElementById("main").appendChild(this)
        this.clientWidth //wait
        this.style.opacity = "1"
        if (this.isClosed && (Utils.app.platform == "Android" || Utils.app.platform == "iOS")) window.history.pushState({ where: "listenViewer", id: this.id }, "", "/index.html")
        try {
            if (Utils.queueManager.shuffle) {
                this.shadowRoot.getElementById("shuffle").children[0].setAttribute("fill", "#00ccff")
            }
            else {
                this.shadowRoot.getElementById("shuffle").children[0].setAttribute("fill", "currentColor")
            }
            if (Utils.queueManager.repeat == 0) {
                this.shadowRoot.getElementById("repeat").children[0].setAttribute("fill", "currentColor")
                this.shadowRoot.getElementById("repeat").children[0].setAttribute("d", Utils.pathsData["Repeat"])
            }
            else if (Utils.queueManager.repeat == 1) {
                this.shadowRoot.getElementById("repeat").children[0].setAttribute("fill", "#00ccff")
                this.shadowRoot.getElementById("repeat").children[0].setAttribute("d", Utils.pathsData["Repeat"])
            }
            else {
                this.shadowRoot.getElementById("repeat").children[0].setAttribute("fill", "#00ccff")
                this.shadowRoot.getElementById("repeat").children[0].setAttribute("d", Utils.pathsData["RepeatOne"])
            }
            this.shadowRoot.getElementById("next").style.color = Utils.queueManager.canNext() ? "white" : "gray"
            this.shadowRoot.getElementById("previous").style.color = Utils.queueManager.canPrevious() ? "white" : "gray"
            let dur = await Utils.player.getDuration()
            let cur = await Utils.player.getCurrentTime()
            /**
             * @type {ProgressBar}
             */
            let pb = this.shadowRoot.getElementById("pb");
            pb.changeMax(dur)
            pb.changeValue(cur)
            this.shadowRoot.getElementById("maxTime").innerText = Utils.msToTime(dur)
            this.shadowRoot.getElementById("curTime").innerText = Utils.msToTime(cur)
        }
        catch (e) {
            console.error(e)
        }
        this.isClosed = false;
    }

    close() {
        this.ontransitionend = () => {
            if (this.style.opacity != "1") this.parentElement.removeChild(this)
            this.ontransitionend = () => { }
        }
        this.style.opacity = "0%"
        this.isClosed = true
        if (this.goToMusicViewer != "") Utils.musicViewer.changeView(this.goToMusicViewer)
        this.goToMusicViewer = ""
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

    disconnectedCallback() {
        /* no close function, so do not do this
        this.translation.end()
        this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""*/
    }
}