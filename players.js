class Player {
    name = 'unnamed';
    webRtcConnection = undefined;
    mediaStream = undefined;

    dispose() {
        console.log("dispose")
    }
}

class Players {
    players;

    constructor() {
        this.players = {};
    }

    has(id) {
        return this.players[id] !== undefined;
    }

    getName(id) {
        return this.players[id].name;
    }

    removePlayer(id) {
        if (this.has(id)) {
            this.players[id].dispose();
            delete (this.players[id]);
        } else {
            console.log("cannot remove unknown player:" + id)
        }
    }

    setName(id, newName) {
        if (!this.has(id)) {
            this.players[id] = new Player();
        }
        this.players[id].name = newName;
    }

    getIDs() {
        let ids = [];
        for (let id in this.players) {
            if (!this.players.hasOwnProperty(id)) {
                continue;
            }
            ids.push(id)
        }
        return ids;
    }

    setPeerConnection(id, webRtcConnection) {
        this.get(id).webRtcConnection = webRtcConnection;
    }

    getPeerConnection(id) {
        return this.get(id).webRtcConnection;
    }

    get(id) {
        return this.players[id];
    }

    getMediaStream(id) {
        return this.get(id).mediaStream;
    }

    setMediaStream(id, mediaStream) {
        this.get(id).mediaStream = mediaStream;
    }

    disableVideo(id) {
        this.getMediaStream(id).getVideoTracks().forEach(track => track.enabled = false);
    }

    enableVideo(id) {
        this.getMediaStream(id).getVideoTracks().forEach(track => track.enabled = true);
    }

    disableAudio(id) {
        this.getMediaStream(id).getAudioTracks().forEach(track => track.enabled = false);
    }

    enableAudio(id) {
        this.getMediaStream(id).getAudioTracks().forEach(track => track.enabled = true);
    }

    hasPeerConnection(id) {
        return this.getPeerConnection(id) !== undefined && this.getPeerConnection(id) !== null;
    }
}