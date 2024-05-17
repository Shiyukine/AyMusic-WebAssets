import InfoPanel from "../ui/components/infoPanel/infoPanel.js";
import Album from "./music/album.js";
import Playlist from "./music/playlist.js"
import Singer from "./music/singer.js";
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
    userLikedObjects = []

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

    refreshUserInfo(cb) {
        try {
            console.log("Refreshing user info")
            Utils.apiManager.fetchAPIThenCache({ act: "getUserInfo" }, (info) => {
                this.userPlaylists = []
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
                this.userLikedObjects = info["likedSongs"]
                this.userInfo.likedSongsPlId = info["likedSongsPlId"]
                console.log("User info refreshed successfully")
                cb()
            })
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

    async addSongToAPlaylist(plId, objId, silent = false) {
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
        else {
            if (!silent)
                Utils.newError("Can't add song to this playlist", "This song is already added or there is an internal error.")
            console.error("Can't add song to this playlist", result)
        }
        return result == "OK"
    }

    async addBatchSongsToAPlaylist(plId, objsId, silent = false) {
        console.log("Adding songs in playlist")
        let result = await Utils.apiManager.doPostRequest({
            act: "addBatchSongsInUserPlaylist",
            playlistID: plId,
            objectsID: objsId,
        })
        if (result == "OK") {
            for (let objId of objsId) {
                this.#eventEl.dispatchEvent(new CustomEvent("addsongtoplaylist", {
                    detail: {
                        playlistId: plId,
                        objId: objId
                    }
                }));
            }
            console.log("Songs added in playlist successfully")
        }
        else {
            if (!silent)
                Utils.newError("Can't add songs to this playlist", "These songs are already added or there is an internal error.")
            console.error("Can't add songs to this playlist", result)
        }
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

    addEventListener(event, callback, options) {
        this.#eventEl.addEventListener(event, callback, options)
    }

    /**
     * 
     * @param {String} objId 
     */
    async addObjToLikedSongs(objId, silent = false) {
        var result = await this.addSongToAPlaylist(this.userInfo.likedSongsPlId, objId, silent)
        if (result) {
            this.userLikedObjects.push(objId)
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
     * @param {Array} objsId 
     */
    async addBatchObjsToLikedSongs(objsId, silent = false) {
        var result = await this.addBatchSongsToAPlaylist(this.userInfo.likedSongsPlId, objsId, silent)
        if (result) {
            for (let objId of objsId) {
                this.userLikedObjects.push(objId)
                this.#eventEl.dispatchEvent(new CustomEvent("addsongtolikedsongs", {
                    detail: {
                        objId: objId
                    }
                }));
            }
        }
        return result
    }

    /**
     * 
     * @param {String} objId 
     */
    async removeObjFromLikedSongs(objId) {
        await this.removeSongFromAPlaylist(this.userInfo.likedSongsPlId, objId)
        for (let i in this.userLikedObjects) {
            let id = this.userLikedObjects[i]
            if (id === objId) {
                this.userLikedObjects.splice(i, 1)
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
        else if (Utils.libManager.userLikedObjects.includes("so_" + song.id)) {
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

    async addOrRemoveObjectIDLikedSongs(objectID) {
        if (Utils.libManager.userLikedObjects.includes(objectID)) {
            await Utils.libManager.removeObjFromLikedSongs(objectID)
            console.log("removed song")
        }
        else {
            await Utils.libManager.addObjToLikedSongs(objectID)
            console.log("added song")
        }
    }

    isSongIsInLikedSongs(song) {
        return LocalMusicHandler.isMusicInLocalLibrary(song.id) || Utils.libManager.userLikedObjects.includes("so_" + song.id)
    }

    isObjectIsInLikedSongs(obj) {
        if (obj.constructor == Playlist) return Utils.libManager.userLikedObjects.includes("pl_" + obj.id)
        if (obj.constructor == Album) return Utils.libManager.userLikedObjects.includes("al_" + obj.id)
        if (obj.constructor == Singer) return Utils.libManager.userLikedObjects.includes("si_" + obj.id)
        return false
    }

    isObjectIDIsInLikedSongs(obj) {
        return Utils.libManager.userLikedObjects.includes(obj)
    }
}