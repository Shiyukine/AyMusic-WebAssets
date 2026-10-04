import TaskHandler from "../taskHandler.js";
import Utils from "../utils/utils.js";

export default class MediaSessionManager {
    static async overrideMediaSessionTaskUrl(url) {
        if (Utils.app.platform == "Android") return; // Android doesn't support MediaSession API, so we don't need to override it
        Utils.app.remoteClient.registerIframeUrl(url, `
        if(typeof window.newMediaSession == 'undefined' || window.newMediaSession == null) {
            try {
                window.newMediaSession = navigator.mediaSession;
                Object.defineProperty(navigator, 'mediaSession', {
                    value: Object.create(null), // Replaces it with an empty, useless object
                    configurable: false,
                    writable: false
                });
                console.log("MediaSession has been successfully blocked for iframe: " + location.href);
            } catch (e) {
                console.error("Failed to block MediaSession:", e);
            }
        }
            
        addEventListener('message', async (e) => {
            if(e.origin.includes('` + origin + `')) {
                if(e.data.message == 'changeMediaMetadata') {
                    window.newMediaSession.metadata = new window.MediaMetadata({
                        title: e.data.inData.title,
                        artist: e.data.inData.artist,
                        album: e.data.inData.album,
                        artwork: e.data.inData.artwork
                    });
                }
                if(e.data.message == 'changePositionState') {
                    window.newMediaSession.setPositionState({
                        playbackRate: e.data.inData.pR,
                        position: e.data.inData.cur,
                        duration: e.data.inData.dur
                    });
                    if(e.data.inData.isPlaying) window.newMediaSession.playbackState = "playing";
                    else window.newMediaSession.playbackState = "paused";
                }
                if(e.data.message == 'setPlayingState') {
                    if(e.data.inData.isPlaying) window.newMediaSession.playbackState = "playing";
                    else window.newMediaSession.playbackState = "paused";
                }
                if(e.data.message == 'setActionHandler') {
                    window.newMediaSession.setActionHandler(e.data.inData.action, e.data.inData.callbackIsNull ? null : (event) => {
                        if(parent.parent) parent.parent.postMessage({message: 'setActionHandlerCB', action: e.data.inData.action, id: e.data.id, event: event}, '` + origin + `')
                        else parent.postMessage({message: 'setActionHandlerCB', action: e.data.inData.action, id: e.data.id, event: event}, '` + origin + `')
                    });
                }
            }
        })`)
    }

    static async clearMediaSession() {
        if (Utils.app.platform == "Android") {
            // not implemented yet
        }
        else {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.setPositionState(undefined);
            navigator.mediaSession.playbackState = "none";
            navigator.mediaSession.setActionHandler("play", null);
            navigator.mediaSession.setActionHandler("pause", null);
            navigator.mediaSession.setActionHandler("seekbackward", null);
            navigator.mediaSession.setActionHandler("seekforward", null);
            navigator.mediaSession.setActionHandler("previoustrack", null);
            navigator.mediaSession.setActionHandler("nexttrack", null);
            navigator.mediaSession.setActionHandler("seekto", null);
        }
    }

    /**
     * 
     * @param {{artist: string, album: string, title:string, artwork: Array<{src: string, sizes: string, type: string}>}} data 
     * @param {{mainFrame: boolean, subFrame: boolean}} context
     */
    static async setMetadata(data, context = { mainFrame: true, subFrame: true }) {
        if (Utils.app.platform == "Android") {
            Utils.app.remoteClient.sessionChangeMediaMetadata(data.title, data.album, data.artist, data.artwork[0].src)
        }
        else {
            if (context.mainFrame) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: data.title,
                    artist: data.artist,
                    album: data.album,
                    artwork: data.artwork
                });
            }
            // search all sub iframes and send message to them to change metadata
            let searchIframes = (win) => {
                for (let i = 0; i < win.frames.length; i++) {
                    let frame = win.frames[i];
                    try {
                        frame.postMessage({ message: 'changeMediaMetadata', inData: data }, '*');
                    } catch { }
                    searchIframes(frame);
                }
            }
            if (context.subFrame) searchIframes(window);
        }
    }

    /**
     * 
     * @param {{playbackRate: number, position: number, duration: number, playing: boolean, repeat: number|undefined, shuffle: boolean|undefined}} state 
     * @param {{mainFrame: boolean, subFrame: boolean}} context
     */
    static async setPlaybackState(state, context = { mainFrame: true, subFrame: true }) {
        if (Utils.app.platform == "Android") {
            Utils.app.remoteClient.sessionChangePositionState(state.cur, state.dur, state.pR, state.playing, state.shuffle, state.repeat)
        }
        else {
            if (context.mainFrame) {
                navigator.mediaSession.setPositionState({
                    playbackRate: state.playbackRate,
                    position: state.position,
                    duration: state.duration
                });
            }
            // search all sub iframes and send message to them to change position state
            let searchIframes = (win) => {
                for (let i = 0; i < win.frames.length; i++) {
                    let frame = win.frames[i];
                    try {
                        frame.postMessage({
                            message: 'changePositionState', inData: {
                                pR: state.playbackRate,
                                cur: state.position,
                                dur: state.duration,
                                isPlaying: state.playing
                            }
                        }, '*');
                    } catch { }
                    searchIframes(frame);
                }
            }
            if (context.subFrame) searchIframes(window);
        }
    }

    static async setPlaybackStatePlaying(isPlaying, context = { mainFrame: true, subFrame: true }) {
        if (Utils.app.platform == "Android") {
            Utils.app.remoteClient.sessionChangePlaying(isPlaying)
        }
        else {
            if (context.mainFrame) {
                if (isPlaying) navigator.mediaSession.playbackState = "playing";
                else navigator.mediaSession.playbackState = "paused";
            }
            if (context.subFrame) {
                // search all sub iframes and send message to them to change position state
                let searchIframes = (win) => {
                    for (let i = 0; i < win.frames.length; i++) {
                        let frame = win.frames[i];
                        try {
                            frame.postMessage({
                                message: 'setPlayingState', inData: {
                                    isPlaying: state.playing
                                }
                            }, '*');
                        } catch { }
                        searchIframes(frame);
                    }
                }
                searchIframes(window);
            }
        }
    }

    static async setActionHandler(action, callback, context = { mainFrame: true, subFrame: true }) {
        if (Utils.app.platform == "Android") {
            // not implemented yet
        }
        else {
            if (context.mainFrame) {
                navigator.mediaSession.setActionHandler(action, callback);
            }
            let id = Date.now() + (Math.random() + 1).toString(36).substring(7) + action;
            // search all sub iframes and send message to them to set action handler
            let searchIframes = (win) => {
                for (let i = 0; i < win.frames.length; i++) {
                    let frame = win.frames[i];
                    try {
                        frame.postMessage({ message: 'setActionHandler', inData: { action: action, callbackIsNull: callback === null }, id: id }, '*');
                    } catch { }
                    searchIframes(frame);
                }
            }
            if (context.subFrame) {
                searchIframes(window);

                window.addEventListener("message", (e) => {
                    if (e.data.message == "setActionHandlerCB") {
                        if (e.data.id == id) {
                            callback(e.data.event);
                        }
                    }
                })
            }
        }
    }
}
