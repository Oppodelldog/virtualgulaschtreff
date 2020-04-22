
class SignalingAdapter{
    WEB_RTC_OFFER = 'WEB_RTC_OFFER';
    WEB_RTC_ANSWER = 'WEB_RTC_ANSWER';
    WEB_RTC_ICE_CANDIDATE = 'WEB_RTC_ICE_CANDIDATE';

    webSocket;
    constructor(webSocket) {
        this.webSocket = webSocket;
    }

    sendOffer(playerID, offer) {
        const offerMessage = {
            'Type': this.WEB_RTC_OFFER,
            'Payload': {'RemotePlayerID': playerID, 'Offer': offer}
        };

        this.webSocket.send(JSON.stringify(offerMessage));
    }

    sendAnswer(playerID, answer) {
        const answerMessage = {
            'Type': this.WEB_RTC_ANSWER,
            'Payload': {'RemotePlayerID': playerID, 'Answer': answer}
        };
        this.webSocket.send(JSON.stringify(answerMessage));
    }

    sendIceCandidate(playerID, iceCandidate) {
        const iceCandidateMessage = {
            'Type': this.WEB_RTC_ICE_CANDIDATE,
            'Payload': {'RemotePlayerID': playerID, 'IceCandidate': iceCandidate}
        };
        try {
            console.log("sending ice candidate", event.candidate.address, event.candidate.protocol, event.candidate.relatedAddress, event.candidate.relatedPort);
            this.webSocket.send(JSON.stringify(iceCandidateMessage));
        } catch (e) {
            console.log("error sending ice candidate:", e)
        }
    }

}