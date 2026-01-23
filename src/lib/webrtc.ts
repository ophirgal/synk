let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

export const getPeerConnection = () => peerConnection;
export const getLocalStream = () => localStream;
export const getRemoteStream = () => remoteStream;

const servers: RTCConfiguration = {
    iceServers: [
        {
            urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
        }
    ]
};

const initLocalStream = async (): Promise<void> => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const localVideo = document.getElementById('curr-user') as HTMLVideoElement;
    if (localVideo) localVideo.srcObject = localStream;
};


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
    initLocalStream,
    createOfferForRoom,
    createAnswerForRoom,
    isRemoteDescriptionSet,
    setRemoteAnswer,
    addRemoteIceCandidate
};