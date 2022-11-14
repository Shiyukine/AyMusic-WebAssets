import Import from "../../../class/import.js";
import Album from "../../../class/music/album.js";
import Song from "../../../class/music/song.js";
import Translations from "../../../class/translations.js";
import LocalMusicHandler from "../../../class/utils/localMusicHandler.js";
import Utils from "../../../class/utils/utils.js";
import * as id3 from "../../../plugins/id3/id3.js";
import InfoPanel from "../../components/infoPanel/infoPanel.js";
import ProgressBar from "../../components/progressBar/progressBar.js";

export default class ListenWindow extends HTMLDivElement {
    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.7s"
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
                //get user info
                Utils.player.onSongChange(() => {
                    shadow.getElementById("music_title").innerText = Utils.queueManager.currentSong.title
                    shadow.getElementById("music_artist").innerText = Utils.queueManager.currentSong.singerName
                    shadow.getElementById("like").children[0].setAttribute("d", Utils.libManager.isSongIsInLikedSongs(Utils.queueManager.currentSong) ? Utils.pathsData["Heart"] : Utils.pathsData["HeartOutline"])
                    if (Utils.player.isLocalMusic) {
                        if (Utils.queueManager.currentSong.canBeLoaded) {
                            var request = new XMLHttpRequest();
                            var imge = this.shadowRoot.getElementById("music_img");
                            request.open('GET', Utils.queueManager.currentSong.url, true);
                            request.responseType = 'blob';
                            request.onload = function () {
                                var reader = new FileReader();
                                reader.readAsArrayBuffer(request.response);
                                reader.onload = function (e) {
                                    id3.fromFile(new File([e.target.result], Utils.queueManager.currentSong.url.split("\\")[Utils.queueManager.currentSong.url.split("\\") - 1])).then((tags) => {
                                        if (tags != null && tags.images != null) {
                                            var blob = new Blob([tags.images[0].data])
                                            var uu = URL.createObjectURL(blob)
                                            imge.src = uu
                                            setTimeout(() => {
                                                URL.revokeObjectURL(uu)
                                            }, 10000)
                                        }
                                        else {
                                            imge.src = "/resources/icon.ico"
                                        }
                                    });
                                };
                            };
                            request.send();
                        }
                        else {
                            this.shadowRoot.getElementById("music_img").src = "/resources/icon.ico"
                        }
                    }
                    else {
                        this.shadowRoot.getElementById("music_img").src = this.song.imgUrl
                    }
                    shadow.getElementById("next").style.color = Utils.queueManager.canNext() ? "white" : "gray"
                    shadow.getElementById("previous").style.color = Utils.queueManager.canPrevious() ? "white" : "gray"
                })
                Utils.player.onLoadedMetadata(() => {
                    pb.changeValue(0)
                    pb.changeMax(Utils.player.getDuration())
                    shadow.getElementById("maxTime").innerText = Utils.msToTime(Utils.player.getDuration())
                    shadow.getElementById("curTime").innerText = Utils.msToTime(0)
                })
                Utils.player.onTimeUpdate(() => {
                    if (!mouseDownPb) pb.changeValue(Utils.player.getCurrentTime())
                    shadow.getElementById("curTime").innerText = Utils.msToTime(Utils.player.getCurrentTime())
                })
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
                    Utils.app.changeSetting("repeat", Utils.queueManager.repeat)
                })
                Utils.player.onPlay(() => {
                    shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Pause"])
                })
                Utils.player.onPause(() => {
                    shadow.getElementById("changeState").children[0].setAttribute("d", Utils.pathsData["Play"])
                })
                let anVol = 0;
                Utils.player.onVolumeChange(() => {
                    pbVol.changeValue(Utils.player.getVolume());
                    if (Utils.player.getVolume() > 0) anVol = Utils.player.getVolume()
                    Utils.app.changeSetting("music_vol", Utils.player.getVolume())
                })
                /*pbVol.onRelease(() => {
                    Utils.player.changeVolume(pbVol.getValue());
                })*/
                pbVol.onValueChange(() => {
                    Utils.player.changeVolume(pbVol.getValue());
                    if (pbVol.getValue() == 0) {
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
                pbVol.changeValue(parseInt(Utils.app.getSetting("music_vol")))
                Utils.player.changeRepeat(parseInt(Utils.app.getSetting("repeat")))
                Utils.player.changeShuffle(Utils.app.getSetting("shuffle"))
                Utils.player.onEnded(() => {
                    if (Utils.queueManager.repeat != 2) {
                        Utils.player.next()
                    }
                    else {
                        Utils.player.seek(0)
                        Utils.player.play()
                    }
                })
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
                shadow.getElementById("changeState").onclick = () => {
                    if (Utils.player.getState()) {
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
                    if (Utils.player.getVolume() > 0) Utils.player.changeVolume(0)
                    else Utils.player.changeVolume(anVol)
                }
                if (Utils.libManager.userInfo.curMusic != null) {
                    if (Utils.libManager.userInfo.curObject == null) {
                        let obj = await Utils.apiManager.doPostRequest({
                            act: "getSongInfo",
                            id: Utils.libManager.userInfo.curMusic
                        })
                        await Utils.queueManager.changeQueue(new Song(obj.songID.replace("so_", ""), obj.url, obj.dateAdded, obj.title, obj.imgUrl, obj.time, obj.isExplicit, obj.addedBy, obj.cropStart, obj.cropEnd, obj.singerID, obj.singerName, obj.albumName, obj.albumID))
                    }
                    else if (Utils.libManager.userInfo.curObject.startsWith("pl_")) {
                        let result = null;
                        for (let pl of Utils.libManager.userPlaylists) {
                            if ("pl_" + pl.id == Utils.libManager.userInfo.curObject) {
                                result = pl;
                            }
                        }
                        await Utils.queueManager.changeQueue(result, Utils.libManager.userInfo.curMusic)
                    }
                    else if (Utils.libManager.userInfo.curObject.startsWith("al_")) {
                        let result = await Utils.apiManager.doPostRequest({
                            act: "getAlbumInfo",
                            id: Utils.libManager.userInfo.curObject.replace("al_", ""),
                            offset: 0
                        })
                        let al = result["albumInfo"]
                        await Utils.queueManager.changeQueue(new Album(al.id, al.name, al.singerID, al.type, al.imgUrl), Utils.libManager.userInfo.curMusic)
                    }
                    Utils.player.seek(Utils.libManager.userInfo.curTime)
                }
                this.style.opacity = "1"
            }
            new Translations(shadow.children[1])
        })
    }
}