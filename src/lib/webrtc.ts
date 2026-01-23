// document.getElementById('create-offer').addEventListener('click', createOffer)
// document.getElementById('create-answer').addEventListener('click', createAnswer)
// document.getElementById('add-answer').addEventListener('click', addAnswer)

// const APP_ID: string = "YOU'RE AGORA APP ID";

let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

export const getPeerConnection = () => peerConnection;
export const getLocalStream = () => localStream;
export const getRemoteStream = () => remoteStream;

// const uid: string = String(Math.floor(Math.random() * 10000));
// let token: string | null = null;
//let client: Client;

// BEGIN: TEMPORARY INTERFACES FOR STARTER CODE TO WORK
// interface Message {
//     text: string;
// }
// END: TEMPORARY INTERFACES FOR STARTER CODE TO WORK

const servers: RTCConfiguration = {
    iceServers: [
        {
            urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
        }
    ]
};

const initLocalStream = async (): Promise<void> => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const localVideo = document.getElementById('curr-user') as HTMLVideoElement;
    if (localVideo) localVideo.srcObject = localStream;
};

// const handlePeerJoined = async (MemberId: string): Promise<void> => {
//     console.log('A new peer has joined this room:', MemberId);
//     createOffer(MemberId);
// };

// const handleMessageFromPeer = async (message: Message, MemberId: string): Promise<void> => {
//     const msgData = JSON.parse(message.text);
//     console.log('Message:', msgData.type);

//     if (msgData.type === 'offer') {
//         if (!localStream) {
//             localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
//             const localVideo = document.getElementById('curr-user') as HTMLVideoElement;
//             if (localVideo) localVideo.srcObject = localStream;
//         }

//         const offerInput = document.getElementById('offer-sdp') as HTMLInputElement;
//         if (offerInput) offerInput.value = JSON.stringify(msgData.offer);
//         createAnswer(MemberId);
//     }

//     if (msgData.type === 'answer') {
//         const answerInput = document.getElementById('answer-sdp') as HTMLInputElement;
//         if (answerInput) answerInput.value = JSON.stringify(msgData.answer);
//         addAnswer();
//     }

//     if (msgData.type === 'candidate' && peerConnection) {
//         await peerConnection.addIceCandidate(msgData.candidate);
//     }
// };

// const createPeerConnection = async (sdpType: 'offer-sdp' | 'answer-sdp', MemberId: string): Promise<void> => {
//     console.log(MemberId) // todo - delete this line
//     peerConnection = new RTCPeerConnection(servers);

//     remoteStream = new MediaStream();
//     const remoteVideo = document.getElementById('peer-user') as HTMLVideoElement;
//     if (remoteVideo) remoteVideo.srcObject = remoteStream;

//     localStream?.getTracks().forEach(track => {
//         peerConnection?.addTrack(track, localStream!);
//     });

//     peerConnection.ontrack = (event: RTCTrackEvent) => {
//         event.streams[0].getTracks().forEach(track => {
//             remoteStream?.addTrack(track);
//         });
//     };

//     peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
//         if (event.candidate) {
//             const sdpInput = document.getElementById(sdpType) as HTMLInputElement;
//             if (sdpInput) sdpInput.value = JSON.stringify(peerConnection?.localDescription);
//             // client.sendMessageToPeer(
//             //     { text: JSON.stringify({ type: 'candidate', candidate: event.candidate }) },
//             //     MemberId
//             // );
//         }
//     };
// };

// const createOffer = async (MemberId: string): Promise<void> => {
//     await createPeerConnection('offer-sdp', MemberId);

//     if (!peerConnection) return;

//     const offer = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offer);

//     const offerInput = document.getElementById('offer-sdp') as HTMLInputElement;
//     if (offerInput) offerInput.value = JSON.stringify(offer);

//     // client.sendMessageToPeer({ text: JSON.stringify({ type: 'offer', offer }) }, MemberId);
// };

// const createAnswer = async (MemberId: string): Promise<void> => {
//     await createPeerConnection('answer-sdp', MemberId);

//     if (!peerConnection) return;

//     const offerInput = document.getElementById('offer-sdp') as HTMLInputElement;
//     if (!offerInput?.value) return alert('Retrieve offer from peer first...');

//     const offer = JSON.parse(offerInput.value);
//     await peerConnection.setRemoteDescription(offer);

//     const answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answer);

//     const answerInput = document.getElementById('answer-sdp') as HTMLInputElement;
//     if (answerInput) answerInput.value = JSON.stringify(answer);

//     // client.sendMessageToPeer({ text: JSON.stringify({ type: 'answer', answer }) }, MemberId);
// };

// const addAnswer = async (): Promise<void> => {
//     const answerInput = document.getElementById('answer-sdp') as HTMLInputElement;
//     if (!answerInput?.value) return alert('Retrieve answer from peer first...');

//     const answer = JSON.parse(answerInput.value);
//     if (peerConnection && !peerConnection.currentRemoteDescription) {
//         await peerConnection.setRemoteDescription(answer);
//     }
// };

// New functions for Firebase-based WebRTC signaling
const createOfferForRoom = async (
    onIceCandidate: (candidate: RTCIceCandidateInit) => void,
    onConnectionConnected: () => void
): Promise<RTCSessionDescriptionInit> => {
    peerConnection = new RTCPeerConnection(servers);

    localStream?.getTracks().forEach(track => {
        peerConnection?.addTrack(track, localStream!);
    });

    peerConnection.ontrack = (event: RTCTrackEvent) => {
        if (!remoteStream) remoteStream = new MediaStream();
        const remoteVideo = document.getElementById('peer-user') as HTMLVideoElement;
        remoteVideo.srcObject = remoteStream;

        event.streams[0].getTracks().forEach(track => {
            remoteStream?.addTrack(track);
        });
    };

    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
            onIceCandidate(event.candidate.toJSON());
        }
    };

    peerConnection.onconnectionstatechange = () => {
        if (peerConnection?.connectionState === 'connected') {
            onConnectionConnected();
        }
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    return offer;
};

const createAnswerForRoom = async (
    offer: RTCSessionDescriptionInit,
    onIceCandidate: (candidate: RTCIceCandidateInit) => void,
    onConnectionConnected: () => void
): Promise<RTCSessionDescriptionInit> => {
    peerConnection = new RTCPeerConnection(servers);

    localStream?.getTracks().forEach(track => {
        peerConnection?.addTrack(track, localStream!);
    });

    if (!remoteStream) remoteStream = new MediaStream();
    const remoteVideo = document.getElementById('peer-user') as HTMLVideoElement;
    remoteVideo.srcObject = remoteStream;


    peerConnection.ontrack = (event: RTCTrackEvent) => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream?.addTrack(track);
        });
    };

    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
            onIceCandidate(event.candidate.toJSON());
        }
    };

    peerConnection.onconnectionstatechange = () => {
        if (peerConnection?.connectionState === 'connected') {
            onConnectionConnected();
        }
    }

    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    return answer;
};

const isRemoteDescriptionSet = (): boolean => {
    return !!peerConnection?.currentRemoteDescription;
};

const setRemoteAnswer = async (answer: RTCSessionDescriptionInit): Promise<void> => {
    if (peerConnection && !peerConnection.currentRemoteDescription) {
        await peerConnection.setRemoteDescription(answer);
    }
};

const addRemoteIceCandidate = async (candidate: RTCIceCandidateInit): Promise<void> => {
    if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
    }
};

export {
    initLocalStream as initWebRTC,
    // handlePeerJoined,
    // handleMessageFromPeer,
    // createPeerConnection,
    // createOffer,
    // createAnswer,
    // addAnswer,
    createOfferForRoom,
    createAnswerForRoom,
    isRemoteDescriptionSet,
    setRemoteAnswer,
    addRemoteIceCandidate
};