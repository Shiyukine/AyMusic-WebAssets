import Utils from "./utils/utils.js"

export default class LibraryManager {
    userPlaylists = []

    userInfo = {
        curTime: 0,
        curMusic: null,
        lastState: false
    }

    async refreshUserInfo() {
        try {
            console.log("Refreshing user info")
            let info = await Utils.apiManager.getAccountInfo()
            this.userInfo.curMusic = info["curMusic"]
            this.userInfo.curTime = info["curTime"]
            this.userInfo.lastState = info["lastState"]
            this.userPlaylists = info["playlists"]
            console.log("User info refreshed successfully")
        }
        catch (e) {
            Utils.newError("Unable to get your account information", "Please retry later.")
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
            this.userPlaylists.push({
                id: info,
                name: name,
                userId: Utils.actualAccount.id,
                desc: desc,
                imgUrl: imgUrl,
                isPrivate: isPrivate,
                rank: 0
            })
            console.log("Playlist added successfully")
        }
        catch
        {
            Utils.newError("Unable to add this playlist.", "Please retry later.")
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
                if (i.id == id) {
                    let index = this.userPlaylists.indexOf(i)
                    this.userPlaylists.splice(index)
                    break;
                }
            }
            console.log("Playlist removed successfully")
        }
        catch
        {
            Utils.newError("Unable to remove this playlist.", "Please retry later.")
        }
    }
}