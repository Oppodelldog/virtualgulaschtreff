<!--suppress JSUnresolvedVariable -->

const WHATS_YOUR_NAME = "WHATS_YOUR_NAME";
const STATE_UPDATE = "STATE_UPDATE";
const MY_NAME_IS = 'MY_NAME_IS';

const wsUrl = 'wss://' + location.host + '/ws/gt';
let players = new Players();
let myPlayerID = null;
let ws = null;
let webrtc = null;

window.onerror = errorHandler;

function getRandomName() {
    const names = ["Sioux", "Martguerita", "Janel", "Ruthy", "Arlene", "Pauly", "Flo", "Scarlett", "Gypsy", "Adel", "Edeline", "Willi", "Arlyne", "Starlin", "Tania", "Hildegaard", "Aveline", "Appolonia", "Linet", "Arabel", "Anjela", "Tyne", "Caresse", "Kylynn", "Lorenza", "Rhianon", "Nonna", "Joni", "Rachelle", "Katusha", "Sharia", "Catherine", "Kerri", "Aili", "Andra", "Margy", "Cindi", "Fanchette", "Dara", "Brittaney", "Corie", "Gilbertine"];
    return names[Math.floor(Math.random() * Math.floor(names.length))];
}

function errorHandler(errorMsg, url, lineNumber) {
    alert("Error occurred: " + errorMsg + " in " + url + " line " + lineNumber);
    return false;
}

function setVideoStream(playerID, stream) {
    document.getElementById("video_" + playerID).srcObject = stream;
}

function createToggleButton(ID, buttonClass, iconClass, changeCallback) {
    let checkboxID = `toggle_${buttonClass}_` + ID;

    let toggleVideoDiv = document.createElement("label");
    toggleVideoDiv.className = `player-controls-toggle player-controls-toggle-${buttonClass}`
    toggleVideoDiv.for = checkboxID;

    let toggleVideo = document.createElement("input");
    toggleVideo.type = "checkbox"
    toggleVideo.checked = true;
    toggleVideo.value = "1"
    toggleVideo.id = checkboxID;
    toggleVideo.addEventListener('change', (e) => changeCallback(e))
    toggleVideo.className = "player-controls-toggle-checkbox";
    toggleVideoDiv.append(toggleVideo);

    let toggleIcon = document.createElement("i");
    toggleIcon.className = `${iconClass} player-controls-toggle-button player-controls-toggle-button-${buttonClass}`;
    toggleVideoDiv.append(toggleIcon);

    return toggleVideoDiv;
}

function callAllPlayers() {
    let playerIDs = players.getIDs();
    for (k in playerIDs) {
        let playerID = playerIDs[k];
        if (!players.hasPeerConnection(playerID)) {
            webrtc.makeCall(playerID);
        }
    }
}

function newPlayer(ID) {
    let playerElement = document.createElement("div");
    playerElement.id = "player_" + ID;
    playerElement.className = "player";

    let playerLabel = document.createElement("div");
    playerLabel.id = "player_label_" + ID;
    playerLabel.innerText = players.getName(ID);
    playerLabel.className = "player-name"
    playerElement.append(playerLabel)

    let videoElement = document.createElement("video");
    videoElement.id = "video_" + ID;
    videoElement.className = "player-video";
    videoElement.autoplay = true;
    playerElement.append(videoElement);

    if (ID === myPlayerID) {
        const constraints = {
            'video': true,
            'audio': true
        };
        let self = this;
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                players.setMediaStream(myPlayerID, stream);
                videoElement.srcObject = players.getMediaStream(myPlayerID);
                videoElement.muted = true;
                webrtc = new WebRTC(stream, new SignalingAdapter(ws), players, this.setVideoStream);
                self.callAllPlayers();
            })
            .catch(error => {
                // TODO: handle error
                console.error('Error accessing media devices.', error);
            });
        let rename = () => askForUsername('Choose a different name', players.getName(myPlayerID))
        playerLabel.addEventListener('click', rename);
        playerLabel.addEventListener('touchend', rename);
    } else {
        players.setMediaStream(ID, new MediaStream());
        videoElement.src = "/images/loading-gulasch.mp4";
    }
    let toggleVideoButton = createToggleButton(ID, "video", "icofont-video-cam", (e) => e.target.checked ? players.enableVideo(ID) : players.disableVideo(ID));
    playerElement.append(toggleVideoButton);

    let toggleAudioButton = createToggleButton(ID, "audio", "icofont-mic", (e) => e.target.checked ? players.enableAudio(ID) : players.disableAudio(ID));
    playerElement.append(toggleAudioButton);

    document.getElementById("players").append(playerElement);
}

function playerLeft(ID) {
    players.removePlayer(ID);
    console.log(`remove player ${ID}`)
    document.getElementById("player_" + ID).remove();
}

function updateName(ID, newName) {
    let name = players.getName(ID);
    if (name !== newName) {
        players.setName(ID, newName);
        document.getElementById("player_label_" + ID).innerText = newName;
    }
}

function updatePlayers(Players) {
    // check for new players
    for (let ID in Players) {
        if (!Players.hasOwnProperty(ID)) {
            continue;
        }
        if (players.has(ID)) {
            updateName(ID, Players[ID]);
        } else {
            players.setName(ID, Players[ID]);
            newPlayer(ID)
            if (webrtc!==null) {
                webrtc.makeCall(ID);
            }
        }
    }

    // check for removed players
    let playerIDs = players.getIDs();
    for (let key in playerIDs) {
        if (!playerIDs.hasOwnProperty(key)) {
            continue
        }
        let id = playerIDs[key];
        if (id in Players) {

        } else {
            let name = players.getName(id);
            playerLeft(id, name);
        }
    }
}

function askForUsername(message, originalName) {
    let userInputNickName = "";
    while (userInputNickName === "") {
        userInputNickName = prompt(message, originalName);
    }

    const answer = {Type: MY_NAME_IS, 'Payload': {'Name': userInputNickName}};
    ws.send(JSON.stringify(answer));
}

function startGame() {
    ws = new WebSocket(wsUrl);
    let messageBuffer = "";
    ws.onopen = () => console.log("opened websocket");

    ws.onmessage = function (evt) {
        const messages = [];
        let buffer = "";
        messageBuffer += evt.data;
        for (let i = 0; i < messageBuffer.length; i++) {
            const char = messageBuffer[i];
            buffer += char;
            if (char === "\n") {
                messages.push(buffer);
                buffer = "";
            }
        }
        messageBuffer = buffer;

        for (const k in messages) {
            if (!messages.hasOwnProperty(k)) {
                continue;
            }
            const message = messages[k];
            const data = JSON.parse(message);
            switch (data.Type) {
                case WHATS_YOUR_NAME:
                    myPlayerID = data.Payload.ID;
                    askForUsername(data.Payload.Message, getRandomName());
                    break;

                case STATE_UPDATE:
                    let Players = data.Payload.Players;
                    updatePlayers(Players);
                    break;

                case SignalingAdapter.WEB_RTC_OFFER:
                    console.log("received an offer from " + data.Payload.RemotePlayerID);
                    webrtc.answerCall(data.Payload.RemotePlayerID, data.Payload.Offer);
                    break;

                case SignalingAdapter.WEB_RTC_ANSWER:
                    console.log("received an answer from " + data.Payload.RemotePlayerID);
                    webrtc.establishConnection(data.Payload.RemotePlayerID, data.Payload.Answer);
                    break;

                case SignalingAdapter.WEB_RTC_ICE_CANDIDATE:
                    webrtc.addIceCandidate(data.Payload.RemotePlayerID, data.Payload.IceCandidate)
                    break;
            }
        }
        ws.onclose = function (evt) {
            //TODO: handle this
            console.log("closed channel");
            console.log(evt)
        };
        ws.onerror = function (evt) {
            //TODO: handle error
            console.log("error");
            console.log(evt)
        };
    };
}

startGame();
