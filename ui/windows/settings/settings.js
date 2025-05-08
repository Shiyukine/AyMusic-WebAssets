import ImageCacheHandler from "../../../class/imageCacheHandler.js";
import Import from "../../../class/import.js";
import PlatformHandler from "../../../class/player/platformHandler.js";
import ThemeColor from "../../../class/themeColor.js";
import Translations from "../../../class/translations.js";
import LocalMusicHandler from "../../../class/utils/localMusicHandler.js";
import Utils from "../../../class/utils/utils.js";
import InfoPanel from "../../components/infoPanel/infoPanel.js";
import LoginPanel from "../../components/loginPanel/loginPanel.js";
import PlaylistImporter from "../playlistImporter/playlistImporter.js";

export default class SettingsWindow extends HTMLDivElement {
    selectedIndex = 0;
    isClosed = false;
    controller = new AbortController();

    constructor() {
        super();
        var shadow = this.attachShadow({ mode: "open" })
        this.style.opacity = "0%"
        this.style.transition = "opacity 0.4s"
        Import.getData("/ui/windows/settings/settings" + (Utils.app.platform == "Android" || Utils.app.platform == "iOS" ? "_mobile" : "") + ".html").then((html) => {
            shadow.innerHTML = html
            this.shadowRoot.getElementById("cssImport").onload = async () => {
                shadow.getElementById("menu").onwheel = (ev) => {
                    let newIndex;
                    if (ev.deltaY > 0) newIndex = this.selectedIndex + 1
                    else newIndex = this.selectedIndex - 1
                    if (newIndex > shadow.getElementById("menu").children.length - 1) newIndex -= 1
                    if (newIndex < 0) newIndex += 1
                    this.changeView(newIndex)
                };
                Array.from(shadow.getElementById("menu").children).forEach((x, y) => {
                    x.onclick = () => {
                        this.changeView(y)
                    }
                })
                //
                this.changeAccount();
                this.translation = new Translations(shadow.children[1])
                new ThemeColor(shadow.children[1])
                Import.getData("/resources/translation.json").then((trls) => {
                    try {
                        var allTranslations = ""
                        if (trls) {
                            allTranslations = JSON.parse(trls)
                        }
                        else console.error("Unable to load translations file")
                        for (var i in allTranslations["Available"]) {
                            let trl = allTranslations["Available"][i]
                            var opt = document.createElement("option")
                            opt.value = trl
                            opt.innerText = trl
                            shadow.getElementById("gen_langs").appendChild(opt)
                        }
                    }
                    catch (e) {
                        Utils.newError("Unable to get translations", e)
                    }
                });
                shadow.getElementById("about_web").onclick = () => {
                    Utils.app.remoteClient.openLink(Utils.servURL)
                }
                shadow.getElementById("about_git").onclick = () => {
                    if (Utils.app.platform == "Android") Utils.app.remoteClient.openLink("https://github.com/Shiyukine/AyMusic-Android")
                    else if (Utils.app.platform == "Windows" || Utils.app.platform == "Linux" || Utils.app.platform == "MacOS") Utils.app.remoteClient.openLink("https://github.com/Shiyukine/AyMusic-Electron")
                }
                shadow.getElementById("about_pp").onclick = () => {
                    Utils.app.remoteClient.openLink(Utils.servURL + "privacy.php")
                }
                shadow.getElementById("about_tos").onclick = () => {
                    Utils.app.remoteClient.openLink(Utils.servURL + "cgu.php")
                }
                shadow.getElementById("clear_cache").onclick = async () => {
                    console.log(await Utils.app.remoteClient.removeCache("Image/"))
                    ImageCacheHandler.cache = {}
                    console.log(await Utils.app.remoteClient.removeCache("API/"))
                    Utils.apiManager.cache = {}
                    Utils.showMiniError("rm_cache", "Cache cleared!", true, "rgb(0, 204, 255)", "#000")
                }
                shadow.querySelectorAll("*").forEach((x) => {
                    if (typeof Utils.app.settings[x.id] !== "undefined") {
                        if (x.tagName == "INPUT" && x.max == "1") {
                            x.value = Utils.app.getSetting(x.id) ? 1 : 0
                            x.style.backgroundColor = x.value == "1" ? "" : "gray"
                            x.onmousedown = (e) => {
                                x.value = x.value == 0 ? 1 : 0
                                Utils.app.changeSetting(x.id, x.value == "1")
                                x.style.backgroundColor = x.value == "1" ? "" : "gray"
                                e.preventDefault()
                                e.stopPropagation()
                            }
                        }
                        if (x.tagName == "INPUT" && x.max != "1") {
                            x.value = parseInt(Utils.app.getSetting(x.id))
                            x.oninput = () => {
                                Utils.app.changeSetting(x.id, x.value)
                                //x.value = parseInt(Utils.app.getSetting(x.id))
                            }
                        }
                        if (x.tagName == "SELECT") {
                            x.value = Utils.app.getSetting(x.id)
                            x.addEventListener("change", () => {
                                Utils.app.changeSetting(x.id, x.value)
                                x.value = Utils.app.getSetting(x.id)
                            })
                        }
                    }
                })
                shadow.getElementById("gen_langs").addEventListener("change", () => {
                    Utils.app.changeLanguage(Utils.app.getSetting("gen_langs"))
                })
                shadow.getElementById("gen_theme").addEventListener("change", () => {
                    Utils.app.changeTheme(Utils.app.getSetting("gen_theme"))
                })
                /**
                 * @type {LoginPanel}
                 */
                var lp = null;
                shadow.getElementById("acc_change").onclick = () => {
                    if (lp && !lp.isClosed) lp.close(false)
                    lp = new LoginPanel("modify")
                    document.getElementById("main").appendChild(lp)
                    window.history.pushState({ where: "settings", showLog: true }, "", "/index.html")
                }
                shadow.getElementById("music_add").onclick = () => {
                    LocalMusicHandler.addMusic()
                }
                PlatformHandler.getAvailablePlatforms().then(async platforms => {
                    for (let platform of platforms) {
                        /*<div class="set">
                            <p>{set.music.addSpotify}</p>
                            <button id="acc_spotify">{set.music.addAccount}</button>
                            <button id="acc_spotify_rm">{set.music.rmAccount}</button>
                        </div>*/
                        let div = document.createElement("div")
                        div.classList.add("set")
                        let p = document.createElement("p")
                        p.innerHTML = "<span>{set.music.addAccountPlatform}</span><span> " + platform + "</span>"
                        div.appendChild(p)
                        let btn1 = document.createElement("p")
                        btn1.classList.add("link")
                        btn1.classList.add("inline")
                        btn1.innerText = "{set.music.addAccount}"
                        btn1.onclick = async () => {
                            await SettingsWindow.connectToPlatform(platform)
                        }
                        div.appendChild(btn1)
                        let btn2 = document.createElement("p")
                        btn2.classList.add("link")
                        btn2.classList.add("inline")
                        btn2.innerText = "{set.music.rmAccount}"
                        btn2.onclick = async () => {
                            await Utils.app.remoteClient.openWebsiteInNewWindow(await PlatformHandler.getPlatformUrl(platform, "LogoutUrl"),
                                await PlatformHandler.getPlatformUrl(platform, "LogoutUrlCallback"), (await PlatformHandler.getPlatformSettings(platform)).UseIncludeUrlFilter)
                            /*await Utils.app.remoteClient.openWebsiteInNewWindow(await PlatformHandler.getPlatformUrl(platform, "LoginUrl"),
                                await PlatformHandler.getPlatformUrl(platform, "BaseUrl"))*/
                            Utils.newError("Information", "If the window has closed by itself, it means that you've been disconnected!")
                        }
                        div.appendChild(btn2)
                        if ((await PlatformHandler.getPlatformSettings(platform)).SupportsPlaylistsImport) {
                            let btn3 = document.createElement("p")
                            btn3.classList.add("link")
                            btn3.classList.add("inline")
                            btn3.innerText = "{set.music.importPlaylist}"
                            btn3.onclick = async () => {
                                let plImport = new PlaylistImporter(platform)
                                document.getElementById("main").appendChild(plImport)
                                plImport.showDialog()
                            }
                            div.appendChild(btn3)
                        }
                        shadow.getElementById("music_panel").insertBefore(div, shadow.getElementById("music_import"))
                    }
                })
                /*shadow.getElementById("experimental_popout").onclick = async () => {
                    await Utils.app.remoteClient.popoutChrome()
                }*/
                window.addEventListener("popstate", (e) => {
                    if (!this.isClosed) {
                        if (e.state.where == "settings") {
                            if (e.state.showLog) {
                                if (lp == null) {
                                    lp = new LoginPanel("modify")
                                    document.getElementById("main").appendChild(lp)
                                }
                            }
                        }
                        else if (e.state.where == "menu" && e.state.menu == "Settings") {
                            if (lp != null) {
                                lp.close(false)
                                lp = null;
                            }
                        }
                    }
                }, { signal: this.controller.signal })
                shadow.getElementById("acc_logout").onclick = () => {
                    var ip = new InfoPanel("Log-out", "Do you want to log-out now ?\nAyMusic will restart after you have logged out.", [
                        {
                            text: "No", isPositive: false, onclick: () => {
                                ip.close()
                            }
                        }, {
                            text: "Yes", isPositive: true, onclick: () => {
                                var lp = new LoginPanel("logout")
                                document.getElementById("main").appendChild(lp)
                            }
                        }])
                    document.getElementById("main").appendChild(ip)
                    ip.show()
                }
                shadow.getElementById("about_ver").innerText += " " + Utils.app.versionName
                this.changeView(this.selectedIndex)
                this.style.opacity = "1"
            }
        })
    }

    static async connectToPlatform(platform) {
        await Utils.app.remoteClient.openWebsiteInNewWindow(await PlatformHandler.getPlatformUrl(platform, "LoginUrl"),
            await PlatformHandler.getPlatformUrl(platform, "BaseUrl"), (await PlatformHandler.getPlatformSettings(platform)).UseIncludeUrlFilter)
        let inf = new InfoPanel("Information", "If the window has closed by itself, it means that you've been connected! If so, click on the \"I'm connected!\" button and wait a bit. If you find you're waiting too long, restart the application.", [
            { text: "Close", isPositive: false, onclick: async () => { inf.close() } },
            {
                text: "I'm connected!", isPositive: true, onclick: async () => {
                    if (await PlatformHandler.getPlatformBySongUrl(Utils.queueManager.currentSong.url) == platform) {
                        if ((await PlatformHandler.getPlatformSettings(platform)).RequireUserLoggedOnPlatform) Utils.player.needTokenChange()
                        else Utils.player.playSong(Utils.queueManager.currentSong)
                    }
                    inf.close()
                }
            }], false)
        document.getElementById("main").appendChild(inf)
    }

    changeView(newIndex) {
        try {
            this.shadowRoot.getElementById("menu").children[this.selectedIndex].classList.remove("selected")
            this.shadowRoot.getElementById("view").children[this.selectedIndex].classList.remove("selected")
            this.shadowRoot.getElementById("menu").children[newIndex].classList.add("selected")
            this.shadowRoot.getElementById("view").children[newIndex].classList.add("selected")
        } catch { }
        this.selectedIndex = newIndex
    }

    changeAccount() {
        this.shadowRoot.getElementById("acc_img").onerror = () => {
            this.shadowRoot.getElementById("acc_img").src = "/resources/noavatar.png"
        }
        this.shadowRoot.getElementById("acc_img").src = Utils.actualAccount.avatarUrl;
        this.shadowRoot.getElementById("acc_name").innerText = Utils.actualAccount.name;
        this.shadowRoot.getElementById("acc_email").innerText = Utils.actualAccount.email;
    }

    close() {
        this.isClosed = true
        while (this.firstChild) {
            this.removeChild(this.lastChild);
        }
        this.controller.abort()
    }

    disconnectedCallback() {
        this.translation.end()
        this.controller.abort()
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        this.shadowRoot.innerHTML = ""
        this.__proto__ = null
    }
}