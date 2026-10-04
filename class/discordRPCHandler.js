import Utils from "./utils/utils.js";
import PlatformHandler from "./player/platformHandler.js";

export default class DiscordRPCHandler {
    static async updateDiscordRPC(pb, setNothing = false) {
        if (Utils.app.settings.gen_discordRPC) {
            if (!setNothing) {
                let buttons = []
                if (!Utils.player.isLocalMusic) buttons.push({ label: "Listen this music", url: Utils.queueManager.currentSong.url })
                buttons.push({ label: "Download AyMusic", url: Utils.realServURL + "projects/AyMusic.php" })
                let plat = Utils.player.isLocalMusic ? "icon" : (await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)).toLowerCase()
                let platName = Utils.player.isLocalMusic ? "their PC" : await PlatformHandler.getPlatformBySongUrl(Utils.player.currentSongUrl)
                let singer = Utils.queueManager.currentSong.aliasSingerName != null ? Utils.queueManager.currentSong.aliasSingerName : Utils.queueManager.currentSong.singerName
                for (let sing of Utils.queueManager.currentSong.additionalSingers) {
                    singer += ", " + (sing.aliasSingerName != null ? sing.aliasSingerName : sing.singerName)
                }
                if (singer.length < 2) singer += "  ";
                let title = Utils.queueManager.currentSong.aliasTitle != null ? Utils.queueManager.currentSong.aliasTitle : Utils.queueManager.currentSong.title
                if (title.length < 2) title += "  ";
                let out = {
                    details: "" + (title),
                    state: "" + (singer),
                    name: "AyMusic",
                    //endTimestamp: Date.now() + ((Utils.queueManager.currentSong.cropEnd != -1 ? Utils.queueManager.currentSong.cropEnd : pb.getMax()) - pb.getValue()),
                    assets: {
                        large_image: Utils.queueManager.currentSong.imgUrl != "localImg" && Utils.queueManager.currentSong.imgUrl != "" ? Utils.queueManager.currentSong.imgUrl : "big_icon",
                        large_text: "AyMusic by Aketsuky",
                        small_image: plat,
                        small_text: "Music from " + platName,
                    },
                    timestamps: {
                        start: Date.now() + ((Utils.queueManager.currentSong.cropStart != -1 ? Utils.queueManager.currentSong.cropStart : 0) - pb.getValue()),
                        end: Date.now() + ((Utils.queueManager.currentSong.cropEnd != -1 ? Utils.queueManager.currentSong.cropEnd : pb.getMax()) - pb.getValue())
                    },
                    type: 2,
                    url: Utils.queueManager.currentSong.url
                }
                if (buttons.length > 0) out["buttons"] = buttons
                Utils.app.remoteClient.discordRPC(out)
            }
            else {
                Utils.app.remoteClient.discordRPC(null)
            }
        }
    }
}