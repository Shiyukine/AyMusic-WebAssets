import InfoPanel from "../ui/components/infoPanel/infoPanel.js";
import Playlist from "./music/playlist.js"
import Song from "./music/song.js";
import LocalMusicHandler from "./utils/localMusicHandler.js";
import Utils from "./utils/utils.js"

export default class LibraryManager {
    /**
     * @type {[Playlist]}
     */
    userPlaylists = []

    /**
     * @type {[String]}
     */
    userLikedSongs = []

    /**
     * @type {Playlist}
     */
    userLikedPl = null;

    userInfo = {
        curTime: 0,
        curMusic: null,
        curObject: null,
        likedSongsPlId: ""
    }

    #eventEl = document.createElement("event");

    async refreshUserInfo() {
        try {
            console.log("Refreshing user info")
            this.userPlaylists = []
            let info = await Utils.apiManager.getAccountInfo()
            this.userInfo.curMusic = info["curMusic"]
            this.userInfo.curTime = info["curTime"]
            this.userInfo.curObject = info["curObject"]
            for (let i = 0; i < info["playlists"].length; i++) {
                let pl = info["playlists"][i]
                let npl = new Playlist(pl.id, pl.name, pl.userID, pl.desc, pl.imgUrl, pl.isPrivate, pl.rank)
                this.userPlaylists.push(npl)
                if (pl.id == info["likedSongsPlId"])
                    this.userLikedPl = npl
            }
            this.userLikedSongs = info["likedSongs"]
            this.userInfo.likedSongsPlId = info["likedSongsPlId"]
            console.log("User info refreshed successfully")
        }
        catch (e) {
            Utils.newError("Unable to get your account information", e)
        }
    }

    async addPlaylist(name, desc, imgUrl, isPrivate) {
        try {
            console.log("Adding playlist")
            let info = await Utils.apiManager.doPostRequest({
                act: "addUserPlaylist",
                name: name,
                desc: desc,
                imgUrl: imgUrl,
                isPrivate: isPrivate
            })
            this.userPlaylists.push(new Playlist(info, name, Utils.actualAccount.id, desc, imgUrl, isPrivate, 0))
            console.log("Playlist added successfully")
        }
        catch (e) {
            Utils.newError("Unable to add this playlist.", e)
        }
    }

    async updatePlaylist(id, name, desc, imgUrl, isPrivate, rank) {
        try {
            console.log("Updating playlist")
            await Utils.apiManager.doPostRequest({
                act: "updatePlaylist",
                id: id,
                name: name,
                desc: desc,
                imgUrl: imgUrl,
                isPrivate: isPrivate,
                rank: rank
            })
            for (var i in this.userPlaylists) {
                var pl = this.userPlaylists[i]
                if (pl.id === id) {
                    this.userPlaylists[i] = new Playlist(id, name, Utils.actualAccount.id, desc, imgUrl, isPrivate, rank)
                }
            }
            console.log("Playlist updated successfully")
        }
        catch (e) {
            Utils.newError("Unable to add this playlist.", e)
        }
    }

    async removePlaylist(id) {
        try {
            console.log("Removing playlist")
            await Utils.apiManager.doPostRequest({
                act: "removeUserPlaylist",
                playlistID: id
            })
            for (let i in this.userPlaylists) {
                let pl = this.userPlaylists[i]
                if (pl.id == id) {
                    this.userPlaylists.splice(i, 1)
                    break;
                }
            }
            console.log("Playlist removed successfully")
        }
        catch (e) {
            Utils.newError("Unable to remove this playlist.", e)
        }
    }

    async addSongToAPlaylist(plId, objId) {
        console.log("Adding song in playlist")
        let result = await Utils.apiManager.doPostRequest({
            act: "addSongInUserPlaylist",
            playlistID: plId,
            objectID: objId,
        })
        if (result == "OK") {
            this.#eventEl.dispatchEvent(new CustomEvent("addsongtoplaylist", {
                detail: {
                    playlistId: plId,
                    objId: objId
                }
            }));
            console.log("Song added in playlist successfully")
        }
        else
            Utils.newError("Can't add song to this playlist", "This song is already added or there is an internal error.")
        return result == "OK"
    }

    async removeSongFromAPlaylist(plId, objId) {
        console.log("Removing song from playlist")
        await Utils.apiManager.doPostRequest({
            act: "removeSongInUserPlaylist",
            playlistID: plId,
            objectID: objId,
        })
        console.log("Song removed from playlist successfully")
        this.#eventEl.dispatchEvent(new CustomEvent("removesongfromplaylist", {
            detail: {
                playlistId: plId,
                objId: objId
            }
        }));
    }

    onAddSongToPlaylist(callback) {
        this.#eventEl.addEventListener("addsongtoplaylist", callback)
    }

    onRemoveSongFromPlaylist(callback) {
        this.#eventEl.addEventListener("removesongfromplaylist", callback)
    }

    onAddSongToLikedSongs(callback) {
        this.#eventEl.addEventListener("addsongtolikedsongs", callback)
    }

    onRemoveSongFromLikedSongs(callback) {
        this.#eventEl.addEventListener("removesongfromlikedsongs", callback)
    }

    /**
     * 
     * @param {String} objId 
     */
    async addObjToLikedSongs(objId) {
        var result = await this.addSongToAPlaylist(this.userInfo.likedSongsPlId, objId)
        if (result) {
            this.userLikedSongs.push(objId.replace("so_", ""))
            this.#eventEl.dispatchEvent(new CustomEvent("addsongtolikedsongs", {
                detail: {
                    objId: objId
                }
            }));
        }
        return result
    }

    /**
     * 
     * @param {String} objId 
     */
    async removeObjFromLikedSongs(objId) {
        await this.removeSongFromAPlaylist(this.userInfo.likedSongsPlId, objId)
        for (let i in this.userLikedSongs) {
            let id = this.userLikedSongs[i]
            if (id === objId.replace("so_", "")) {
                this.userLikedSongs.splice(i, 1)
                this.#eventEl.dispatchEvent(new CustomEvent("removesongfromlikedsongs", {
                    detail: {
                        objId: objId
                    }
                }));
                break;
            }
        }
    }

    /**
     * 
     * @param {Song} song 
     */
    async addOrRemoveSongLikedSongs(song) {
        if (LocalMusicHandler.isMusicInLocalLibrary(song.id)) {
            var ip = new InfoPanel("Confirmation", "Do you want to remove this song ?", [{
                text: "Yes", isPositive: true, onclick: async () => {
                    await LocalMusicHandler.removeMusic(song.id)
                    await Utils.libManager.removeObjFromLikedSongs("so_" + song.id)
                    console.log("removed song")
                    ip.close()
                }
            }, {
                text: "No", isPositive: false, onclick: () => {
                    ip.close()
                }
            }])
            document.getElementById("main").appendChild(ip)
            ip.show()
        }
        else if (Utils.libManager.userLikedSongs.includes(song.id)) {
            await Utils.libManager.removeObjFromLikedSongs("so_" + song.id)
            console.log("removed song")
        }
        else {
            if (song.imgUrl != "localImg") {
                await Utils.libManager.addObjToLikedSongs("so_" + song.id)
                console.log("added song")
            }
            else {
                Utils.newError("Unable to add this music !", "Please import this local music to continue.");
            }
        }
    }

    isSongIsInLikedSongs(song) {
        return LocalMusicHandler.isMusicInLocalLibrary(song.id) || Utils.libManager.userLikedSongs.includes(song.id)
    }
}