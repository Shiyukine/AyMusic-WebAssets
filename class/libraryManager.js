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
            let info = await Utils.apiManager.getAccountInfo()
            this.userInfo.curMusic = info["curMusic"]
            this.userInfo.curTime = info["curTime"]
            this.userInfo.lastState = info["lastState"]
            this.userPlaylists = info["playlists"]
        }
        catch (e) {
            Utils.newError("Unable to get user infos", e)
        }
    }

    getSongsInPlaylist(playlistId) {

    }
}