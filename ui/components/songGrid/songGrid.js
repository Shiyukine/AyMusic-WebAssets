import Import from "../../../class/import.js";
import Song from "../../../class/music/song.js";
import Translations from "../../../class/translations.js";
import Utils from "../../../class/utils/utils.js";
import ContextMenu from "../contextMenu/contextMenu.js";

export default class SongGrid extends HTMLDivElement {

    /**
     * @type {Song}
     */
    song = null;


    /**
     * 
     * @param {song} song 
     */
    constructor(song) {
        super();
        this.song = song
        var shadow = this.attachShadow({ mode: "open" })
        Import.getData("/ui/components/songGrid/songGrid.html").then((html) => {
            shadow.innerHTML = html
            //new Translations(shadow.children[1])
            this.shadowRoot.getElementById("title").innerText = this.song.title
            this.shadowRoot.getElementById("artist").innerText = this.song.singerName
            this.shadowRoot.getElementById("time").innerText = Utils.msToTime(this.song.time)
            this.shadowRoot.getElementById("img").style.backgroundImage = "url('" + this.song.imgUrl + "')"
            this.addEventListener("mouseover", function () {
                this.shadowRoot.getElementById("svg").style.opacity = "1"
                this.shadowRoot.getElementById("cache").style.opacity = "1"
            });
            this.addEventListener("mouseout", function () {
                this.shadowRoot.getElementById("svg").style.opacity = "0"
                this.shadowRoot.getElementById("cache").style.opacity = "0"
            });
            this.shadowRoot.getElementById("svg").addEventListener("click", function () {
                console.log("clicked")
            });
            var cm = new ContextMenu()
            this.shadowRoot.getElementById("context").onclick = (e) => {
                cm.addElement("{wt.addQueue}", () => {
                    Utils.newError("Can't do this", "This feature will be added soon :)")
                })
                cm.addElement("{lib.goArtist}", () => {
                    Utils.newError("Can't do this", "This feature will be added soon :)")
                })
                cm.addElement("{lib.goAlbum}", () => {
                    Utils.newError("Can't do this", "This feature will be added soon :)")
                })
                cm.addElement(Utils.libManager.userLikedSongs.includes(this.song.id) ? "{lib.removeLikedSong}" : "{lib.addLikedSong}", () => {
                    Utils.newError("Can't do this", "This feature will be added soon :)")
                })
                cm.addElement("{lib.addToPl}", () => {
                    Utils.newError("Can't do this", "This feature will be added soon :)")
                })
                cm.show(e)
                cm.resetElements()
            }
            cm.hidden = () => {
                cm.resetElements()
            }
        })
    }
}