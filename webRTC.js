class WebRTC {
    signalingAdapter;
    connectionRepo;
    onAttachMediaStream;

    constructor(myMediaStream, signalingAdapter, connectionRepo, onAttachMediaStream) {
        this.myMediaStream = myMediaStream;
        this.signalingAdapter = signalingAdapter;
        this.connectionRepo = connectionRepo;
        this.onAttachMediaStream = onAttachMediaStream;
    }

    async makeCall(calledPlayerID) {
        let peerConnection = this.createPeerConnection(calledPlayerID);

        let mediaConstraints = {
            'offerToReceiveAudio': true,
            'offerToReceiveVideo': true
        };
        const offer = await peerConnection.createOffer(mediaConstraints);
        await peerConnection.setLocalDescription(offer);

        this.signalingAdapter.sendOffer(calledPlayerID, offer)
        this.connectionRepo.setPeerConnection(calledPlayerID, peerConnection);
    }

    async answerCall(callingPlayerID, offer) {
        let peerConnection = createPeerConnection(callingPlayerID);

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        this.signalingAdapter.sendAnswer(callingPlayerID, answer)
        players.setPeerConnection(callingPlayerID, peerConnection);
    }

    createPeerConnection(playerID) {
        const configuration = {'iceServers': [{'urls': 'stun:stun1.l.google.com:19302'}]};
        const peerConnection = new RTCPeerConnection(configuration);
        peerConnection.addEventListener('icecandidate', event => {

            if (event.candidate) {
                this.signalingAdapter.sendIceCandidate(playerID, event.candidate)
            }
        });
        peerConnection.addEventListener('connectionstatechange', event => {
            // noinspection JSUnresolvedVariable
            console.log("connectionstatechange -> ", event.currentTarget.connectionState);
            if (peerConnection.connectionState === 'connected') {
                console.log("Peers connected!");
            }
        });

        this.myMediaStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, this.myMediaStream);
        });
        peerConnection.addEventListener('track', async (event) => {
            let playerMediaStream = this.connectionRepo.getMediaStream(playerID);
            playerMediaStream.addTrack(event.track, playerMediaStream);
            this.onAttachMediaStream(playerID, playerMediaStream)
        });

        return peerConnection;
    }

    async establishConnection(remotePlayerID, answer) {
        const remoteDesc = new RTCSessionDescription(answer);
        await this.connectionRepo.getPeerConnection(remotePlayerID).setRemoteDescription(remoteDesc);
        console.log("peer pairing done")
    }

    async addIceCandidate(remotePlayerID, iceCandidate) {
        try {
            console.log("adding ice candidate");
            if (!this.connectionRepo.hasPeerConnection(remotePlayerID)) {
                console.warn(`no peer connection found for ${remotePlayerID}`);
                return;
            }
            await this.connectionRepo.getPeerConnection(remotePlayerID).addIceCandidate(iceCandidate);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
}