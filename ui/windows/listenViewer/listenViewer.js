import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Singer from "../../../class/music/singer.js";
import Song from "../../../class/music/song.js";
import PlatformHandler from "../../../class/player/platformHandler.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import ProgressBar from "../../components/progressBar/progressBar.js";
import QueueViewerWindow from "../queueViewer/queueViewer.js";

export default class ListenViewerWindow extends HTMLDivElement {
    isClosed = true;
    controller = new AbortController();
    id = Date.now()

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
        this.style.position = "absolute"
        this.style.bottom = Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "0" : "78px"
        this.style.left = "0"
        this.style.right = "0"
        this.style.top = "0"
        this.style.zIndex = "3"
        Import.getData("/ui/windows/listenViewer/listenViewer" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
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
                shadow.getElementById("music_title").innerText = Utils.queueManager.currentSong.title
                shadow.getElementById("music_artist").innerText = Utils.queueManager.currentSong.singerName
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
                        imge.onerror = () => {
                            imge.src = "/resources/icon.ico"
                        }
                        imge.src = "app://cache/Image/" + Utils.queueManager.currentSong.id + ".png"
                    }
                }
                else {
                    this.shadowRoot.getElementById("music_img").src = Utils.queueManager.currentSong.imgUrl
                }
            })
            Utils.player.onLoadedMetadata(async () => {
                let dur = await Utils.player.getDuration()
                if (dur != -1) {
                    pb.changeValue(0)
                    pb.changeMax(dur)
                    shadow.getElementById("maxTime").innerText = Utils.msToTime(dur)
                    shadow.getElementById("curTime").innerText = Utils.msToTime(0)
                    if (await Utils.player.getState()) {
                        shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Pause"])
                    }
                }
            })
            let mouseDownPb = false;
            Utils.player.onTimeUpdate(async () => {
                let cur = await Utils.player.getCurrentTime()
                if (!mouseDownPb) pb.changeValue(cur)
                shadow.getElementById("curTime").innerText = Utils.msToTime(cur)
            })
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
                shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Pause"])
            })
            Utils.player.onPause(async () => {
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
                        Utils.musicViewer.changeView("al_" + Utils.queueManager.currentSong.albumID)
                    }
                }
                shadow.getElementById("music_artist").onclick = () => {
                    if (Utils.queueManager.currentSong.imgUrl !== "localImg") {
                        history.back()
                        Utils.musicViewer.changeView("si_" + Utils.queueManager.currentSong.singerID)
                    }
                }
                new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
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
}