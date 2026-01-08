import AlbumGrid from "../ui/components/albumGrid/albumGrid.js";
import InfoPanel from "../ui/components/infoPanel/infoPanel.js";
import LoginPanel from "../ui/components/loginPanel/loginPanel.js";
import PlaylistGrid from "../ui/components/playlistGrid/playlistGrid.js";
import SingerGrid from "../ui/components/singerGrid/singerGrid.js";
import SongGrid from "../ui/components/songGrid/songGrid.js";
import TextBox from "../ui/components/textBox/textBox.js";
import HomeWindow from "../ui/windows/home/home.js";
import LibraryWindow from "../ui/windows/library/library.js";
import ListenWindow from "../ui/windows/listen/listen.js";
import MenuWindow from "../ui/windows/menu/menu.js";
import SearchWindow from "../ui/windows/search/search.js";
import SettingsWindow from "../ui/windows/settings/settings.js";
import MusicViewerWindow from "../ui/windows/musicViewer/musicViewer.js";
import QueueViewerWindow from "../ui/windows/queueViewer/queueViewer.js";
import ContextMenu from "../ui/components/contextMenu/contextMenu.js";
import ProgressBar from "../ui/components/progressBar/progressBar.js";
import ListenViewerWindow from "../ui/windows/listenViewer/listenViewer.js";
import LyricsViewerWindow from "../ui/windows/lyricsViewer/lyricsViewer.js";
import PlaylistImporter from "../ui/windows/playlistImporter/playlistImporter.js";
import PlaylistPicker from "../ui/windows/playlistPicker/playlistPicker.js";

export default class Import {
    static loadCustomElements() {
        customElements.define('info-panel', InfoPanel);
        customElements.define('login-panel', LoginPanel);
        customElements.define("left-menu", MenuWindow);
        customElements.define("listen-window", ListenWindow);
        customElements.define("settings-window", SettingsWindow);
        customElements.define("library-window", LibraryWindow);
        customElements.define("search-window", SearchWindow);
        customElements.define("musicview-window", MusicViewerWindow);
        customElements.define("listenview-window", ListenViewerWindow);
        customElements.define("home-window", HomeWindow);
        customElements.define("playlist-grid", PlaylistGrid);
        customElements.define("album-grid", AlbumGrid);
        customElements.define("singer-grid", SingerGrid);
        customElements.define("song-grid", SongGrid);
        customElements.define("text-box", TextBox);
        customElements.define("progress-bar", ProgressBar);
        customElements.define("context-menu", ContextMenu);
        customElements.define("queue-viewer", QueueViewerWindow)
        customElements.define("lyrics-viewer", LyricsViewerWindow)
        customElements.define("playlist-importer", PlaylistImporter)
        customElements.define("playlist-picker", PlaylistPicker)
    }

    static cache = [[], []]

    /**
     * @param {String|URL} filePath filepath
    */
    static getData(filePath) {
        return new Promise((resolve) => {
            if (Import.cache[0].includes(filePath)) {
                resolve(Import.cache[1][Import.cache[0].indexOf(filePath)])
            }
            else {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', filePath, true);
                xhr.onreadystatechange = function () {
                    if (this.readyState !== 4) return;
                    if (this.status !== 200) return; // or whatever error handling you want
                    else {
                        var data = xhr.responseText
                        Import.cache[0].push(filePath)
                        Import.cache[1].push(data)
                        resolve(data)
                    }
                };
                xhr.send();
            }
        })
    }

    /**
     * @param {String|URL} filePath filepath
    */
    static loadJS(filePath) {
        return new Promise((resolve) => {
            var script = document.createElement("script")
            document.head.insertBefore(script, document.head.firstChild)
            script.onload = function (txt) {
                resolve(txt)
            }
            script.src = filePath
        })
    }

    /**
     * @param {String|URL} filePath filepath
    */
    static loadCSS(filePath) {
        var link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = filePath
        document.head.appendChild(link)
    }

    /**
     * @param {String|URL} filePath filepath
    */
    /*
    static loadHTML(filePath)
    {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', filePath, false);
        xhr.onreadystatechange = function ()
        {
            if (this.readyState !== 4) return;
            if (this.status !== 200) return; // or whatever error handling you want
        };
        xhr.send();
        return xhr.responseText
    }*/
}