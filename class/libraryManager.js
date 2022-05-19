import Playlist from "./music/playlist.js"
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

    userInfo = {
        curTime: 0,
        curMusic: null,
        lastState: false,
        likedSongsPlId: ""
    }

    async refreshUserInfo() {
        try {
            console.log("Refreshing user info")
            this.userPlaylists = []
            let info = await Utils.apiManager.getAccountInfo()
            this.userInfo.curMusic = info["curMusic"]
            this.userInfo.curTime = info["curTime"]
            this.userInfo.lastState = info["lastState"]
            for (let i = 0; i < info["playlists"].length; i++) {
                let pl = info["playlists"][i]
                this.userPlaylists.push(new Playlist(pl.id, pl.name, pl.userID, pl.desc, pl.imgUrl, pl.isPrivate, pl.rank))
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
        await Utils.apiManager.doPostRequest({
            act: "addSongInUserPlaylist",
            playlistID: plId,
            objectID: objId,
        })
        console.log("Song added in playlist successfully")
    }

    async removeSongFromAPlaylist(plId, objId) {
        console.log("Removing song from playlist")
        await Utils.apiManager.doPostRequest({
            act: "removeSongInUserPlaylist",
            playlistID: plId,
            objectID: objId,
        })
        console.log("Song removed from playlist successfully")
    }

    /**
     * 
     * @param {String} objId 
     */
    async addObjToLikedSongs(objId) {
        await this.addSongToAPlaylist(this.userInfo.likedSongsPlId, objId)
        this.userLikedSongs.push(objId.replace("so_", ""))
    }

    /**
     * 
     * @param {String} objId 
     */
    async removeObjFromLikedSongs(objId) {
        await this.removeObjFromLikedSongs(this.userInfo.likedSongsPlId, objId)
        for (let i in this.userLikedSongs) {
            let id = this.userLikedSongs[i]
            if (id === objId.replace("so_", "")) {
                this.userLikedSongs.splice(i, 1)
                break;
            }
        }
    }
}