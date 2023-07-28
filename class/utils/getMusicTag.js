import * as id3 from "../../plugins/id3/id3.js";
import AudioWAV from "../../plugins/uttori-audio-wave/wav.js";

export default class GetMusicTag {
    tags = {
        title: null,
        artist: null,
        album: null,
        image: null,
        duration: null
    }
    curMusicUrl = "";

    constructor(musicURL) {
        this.curMusicUrl = musicURL
    }

    getTags() {
        return new Promise((resolve) => {
            var base = this;
            var musicURL = this.curMusicUrl
            let request = new XMLHttpRequest();
            request.open('GET', musicURL, true);
            request.responseType = 'blob';
            request.onload = function () {
                let reader = new FileReader();
                reader.readAsArrayBuffer(request.response);
                reader.onload = function (e) {
                    if (base.getFileExtension() == "wav") {
                        let titleFile = musicURL.split("\\")[musicURL.split("\\").length - 1].split(".")[0]
                        base.tags.title = titleFile
                        var audioWav = AudioWAV;
                        const outputChunks = wav => {
                            const {
                                chunks
                            } = wav;
                            chunks.forEach(chunk => {
                                if (chunk.type == "data") {
                                    base.tags.duration = chunk.value.duration * 1000
                                }
                                if (chunk.type == "list") {
                                    for (let data of chunk.value.data) {
                                        let dataV = data.text.split("\x00").join("")
                                        if (data.id == "INAM") base.tags.title = dataV
                                        if (data.id == "IART") base.tags.artist = dataV
                                        if (data.id == "IPRD") base.tags.album = dataV
                                    }
                                }
                            });
                        };
                        const output = audioWav.fromFile(e.target.result);
                        outputChunks(output);
                        resolve(base.tags)
                    }
                    else if (base.getFileExtension() == "mp3" || base.getFileExtension() == "ogg") {
                        id3.fromFile(new File([e.target.result], musicURL.split("\\")[musicURL.split("\\").length - 1])).then((tags) => {
                            let audio = new Audio()
                            audio.onloadedmetadata = async () => {
                                let titleFile = musicURL.split("\\")[musicURL.split("\\").length - 1].split(".")[0]
                                base.tags = {
                                    title: tags != null && tags.title != null ? tags.title : titleFile,
                                    duration: audio.duration * 1000,
                                    album: tags != null && tags.album != null ? tags.album : "Unknown album",
                                    artist: tags != null && tags.artist != null ? tags.artist : "Unknown artist",
                                    image: tags != null && tags.images != null && tags.images.length > 0 ? tags.images[0].data : null
                                }
                                resolve(base.tags)
                            }
                            audio.src = musicURL;
                        });
                    }
                    else if (base.getFileExtension() == "flac" || base.getFileExtension() == "aac") {
                        window.jsmediatags.read(new File([e.target.result], musicURL.split("\\")[musicURL.split("\\").length - 1]), {
                            onSuccess: function (tag) {
                                let audio = new Audio()
                                audio.onloadedmetadata = async () => {
                                    let titleFile = musicURL.split("\\")[musicURL.split("\\").length - 1].split(".")[0]
                                    base.tags = {
                                        title: tag != null && tag.tags.title != null ? tag.tags.title : titleFile,
                                        duration: audio.duration * 1000,
                                        album: tag != null && tag.tags.album != null ? tag.tags.album : "Unknown album",
                                        artist: tag != null && tag.tags.artist != null ? tag.tags.artist : "Unknown artist",
                                        image: tag != null && tag.tags.picture != null ? tag.tags.picture.data : null
                                    }
                                    resolve(base.tags)
                                }
                                audio.src = musicURL;
                            },
                            onError: function (error) {
                                console.log(error);
                            }
                        });
                    }
                    else {
                        let audio = new Audio()
                        audio.onloadedmetadata = async () => {
                            let titleFile = musicURL.split("\\")[musicURL.split("\\").length - 1].split(".")[0]
                            base.tags = {
                                title: titleFile,
                                duration: audio.duration * 1000,
                                album: "Unknown album",
                                artist: "Unknown artist",
                                image: null
                            }
                            resolve(base.tags)
                        }
                        audio.src = musicURL;
                    }
                };
            };
            request.send();
        })
    }

    getFileExtension() {
        return this.curMusicUrl.toLowerCase().split(".")[this.curMusicUrl.toLowerCase().split(".").length - 1]
    }
}