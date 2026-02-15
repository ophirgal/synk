import { LOCAL_VIDEO_ELEMENT_ID } from "@/constants/constants";
import { getRemoteVideoElementId, getRemoteAudioElementId } from "@/lib/utils";
import { RTCPeerConnectionSignalingState, RTCPeerConnectionState, servers } from "./constants";

type WebRTCConnection = {
    peerConnection: RTCPeerConnection,
    remoteStream?: MediaStream;
    dataChannel?: RTCDataChannel;
    state: RTCPeerConnectionState
}

class WebRTCConnectionProvider {
    private connections: { [key: string]: WebRTCConnection } = {};
    private localStream: MediaStream | null = null;
    private listeners = new Set<() => void>();

    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    private emit() {
        this.listeners.forEach(l => l());
    }

    updateConnection(id: string, update: Partial<WebRTCConnection>) {
        this.connections[id] = { ...this.connections[id], ...update };
        this.emit();
    }

    removeConnection(id: string) {
        const { [id]: _, ...rest } = this.connections;
        this.connections = rest; // new object reference
        this.emit();
    }

    getSnapshot = () => {
        return this.connections;
    }

    /**
     * Ensures a local media stream is available and updates its enabled media types as specified.
     * If the local stream does not exist, it is initialized with at least one enabled media type.
     * The local video element is updated with the local stream if the camera is enabled.
     * @param {boolean} cameraOn - Whether the video track should be enabled.
     * @param {boolean} microphoneOn - Whether the audio track should be enabled.
     * @returns {Promise<void>} - A promise that resolves when the local stream has been updated.
     */
    async ensureLocalStream(cameraOn: boolean = false, microphoneOn: boolean = false): Promise<void> {
        // if (!localStream) {
        if (true) {
            // need at least one enabled media type for initialization
            this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            // turning media types on/off as specified
            this.localStream.getAudioTracks().forEach(track => track.enabled = microphoneOn)
            this.localStream.getVideoTracks().forEach(track => track.enabled = cameraOn)
        }
        const localVideo = document.getElementById(LOCAL_VIDEO_ELEMENT_ID) as HTMLVideoElement
        if (localVideo && cameraOn) localVideo.srcObject = this.localStream
    };

    /**
     * Ensures a remote media stream is available.
     * If the remote stream does not exist, it is initialized.
     */
    ensureRemoteStream(connectionId: string) {
        this.connections[connectionId] = this.connections[connectionId] || {}
        const conn = this.connections[connectionId]
        if (!conn.remoteStream) conn.remoteStream = new MediaStream()
    };

    async toggleLocalCamera(cameraOn: boolean = true): Promise<void> {
        if (cameraOn && !this.localStream) {
            // alert("ensuring localStream exists with camera on")
            await this.ensureLocalStream(true);
            return;
        }
        // enable/disable video track (stops sending frames when disabled)
        this.localStream?.getVideoTracks().forEach(track => {
            track.enabled = cameraOn;
        });
        // inflate or nullify video source (nullifying displays poster)
        const localVideo = document.getElementById(LOCAL_VIDEO_ELEMENT_ID) as HTMLVideoElement
        if (!localVideo) return;
        localVideo.srcObject = cameraOn ? this.localStream : null
    };

    async toggleLocalMic(microphoneOn: boolean = true): Promise<void> {
        if (microphoneOn && !this.localStream) {
            await this.ensureLocalStream(false, true);
            return;
        }
        this.localStream?.getAudioTracks().forEach(track => {
            track.enabled = microphoneOn;
        });
    };

    async toggleRemoteVideoAndAudioSources(connectionId: string, isVideoSrc: boolean = true, isMicSrc: boolean = true): Promise<void> {
        this.ensureRemoteStream(connectionId);
        let remoteStream = this.connections[connectionId].remoteStream!

        // inflate or nullify video source so as to display poster when needed
        const remoteVideoEl = document.getElementById(getRemoteVideoElementId(connectionId)) as HTMLVideoElement
        if (!remoteVideoEl) return;
        // only set the srcObject when needed (otherwise the browser will display the poster for a split second)
        if (isVideoSrc && remoteVideoEl.srcObject !== remoteStream) {
            remoteVideoEl.srcObject = remoteStream
        }
        if (!isVideoSrc && remoteVideoEl.srcObject) {
            remoteVideoEl.srcObject = null
        }

        // nullify or inflate audio source (allows remote audio to be streamed when video is disabled)
        // -- only inflate audio source when video source is nullified (to prevent duplicate audio streams)
        const remoteAudioEl = this.getOrCreateAudioElement(connectionId)
        if (isMicSrc && !remoteVideoEl.srcObject) {
            remoteAudioEl.srcObject = remoteStream
        }
        if (!isMicSrc && remoteAudioEl.srcObject) {
            remoteAudioEl.srcObject = null
        }
    }

    // Ensures hidden audio element exists; 
    // serves as fallback player for remote audio when nullifying video element's stream.
    getOrCreateAudioElement(connectionId: string): HTMLAudioElement {
        const remoteAudioElementId = getRemoteAudioElementId(connectionId)
        let remoteAudioEl = document.getElementById(remoteAudioElementId) as HTMLAudioElement
        if (!remoteAudioEl) {
            remoteAudioEl = document.createElement('audio');
            remoteAudioEl.id = remoteAudioElementId;
            remoteAudioEl.style.display = 'none';
            remoteAudioEl.autoplay = true;
            document.body.appendChild(remoteAudioEl);
        }
        return remoteAudioEl;
    }

    async createOfferForConnection(
        connectionId: string,
        onIceCandidate: (candidate: RTCIceCandidateInit) => void,
        onConnectionConnected: () => void,
        onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void
    ): Promise<RTCSessionDescriptionInit> {
        const conn: WebRTCConnection = { peerConnection: new RTCPeerConnection(servers), state: RTCPeerConnectionState.CONNECTING };
        this.connections[connectionId] = conn;
        this.emit(); // notify subscribers that a new connection has been created

        // Create data channel BEFORE creating offer (creator side)
        conn.dataChannel = conn.peerConnection.createDataChannel('yjs-sync', {
            ordered: true,
        });

        conn.dataChannel.onopen = () => {
            // handle data channel opened (creator side);
            onDataChannelReady(connectionId, conn.dataChannel!);
        };

        this.localStream?.getTracks().forEach(track => {
            conn.peerConnection.addTrack(track, this.localStream!);
        });

        conn.peerConnection.ontrack = (event: RTCTrackEvent) => {
            this.toggleRemoteVideoAndAudioSources(connectionId);

            event.streams.forEach(stream => {
                stream.getTracks().forEach(track => {
                    this.connections[connectionId].remoteStream?.addTrack(track);
                });
            });
        };

        conn.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                onIceCandidate(event.candidate.toJSON());
            }
        };

        conn.peerConnection.onconnectionstatechange = () => {
            // alert("connection state changed: " + conn.peerConnection.connectionState);
            this.updateConnection(connectionId, { state: conn.peerConnection.connectionState });
            if (conn.peerConnection.connectionState === RTCPeerConnectionState.CONNECTED) {
                onConnectionConnected();
            }
            if (conn.peerConnection.connectionState === RTCPeerConnectionState.FAILED) {
                this.removeConnection(connectionId);
            }
        }

        const offer = await conn.peerConnection.createOffer();
        await conn.peerConnection.setLocalDescription(offer);

        return offer;
    };

    async createAnswerForConnection(
        connectionId: string,
        offer: RTCSessionDescriptionInit,
        onIceCandidate: (candidate: RTCIceCandidateInit) => void,
        onConnectionConnected: () => void,
        onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void
    ): Promise<RTCSessionDescriptionInit> {
        if (this.connections[connectionId]?.peerConnection) { // connection was created, return local description as answer
            return this.connections[connectionId].peerConnection.localDescription!;
        }
        const conn: WebRTCConnection = { peerConnection: new RTCPeerConnection(servers), state: RTCPeerConnectionState.CONNECTING };
        this.connections[connectionId] = conn;
        this.emit(); // notify subscribers that a new connection has been created

        // Listen for data channel from creator (joiner side)
        conn.peerConnection.ondatachannel = (event) => {
            conn.dataChannel = event.channel;
            // console.log('[DEBUG]: WebRTC data channel received (joiner)');

            conn.dataChannel.onopen = () => {
                // handle data channel opened (joiner side);
                onDataChannelReady(connectionId, conn.dataChannel!);
            };
        };

        this.localStream?.getTracks().forEach(track => {
            conn.peerConnection.addTrack(track, this.localStream!);
        });

        this.ensureRemoteStream(connectionId);

        conn.peerConnection.ontrack = (event: RTCTrackEvent) => {
            event.streams[0].getTracks().forEach(track => {
                this.connections[connectionId].remoteStream!.addTrack(track);
            });
        };

        conn.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                onIceCandidate(event.candidate.toJSON());
            }
        };

        conn.peerConnection.onconnectionstatechange = () => {
            // alert("connection state changed: " + conn.peerConnection.connectionState);
            this.updateConnection(connectionId, { state: conn.peerConnection.connectionState });
            if (conn.peerConnection.connectionState === RTCPeerConnectionState.CONNECTED) {
                onConnectionConnected();
            }
            if (conn.peerConnection.connectionState === RTCPeerConnectionState.FAILED) {
                this.removeConnection(connectionId);
            }
        }

        await conn.peerConnection.setRemoteDescription(offer);

        const answer = await conn.peerConnection.createAnswer();
        await conn.peerConnection.setLocalDescription(answer);

        return answer;
    };

    isRemoteDescriptionSet(connectionId: string): boolean {
        return !!this.connections[connectionId]?.peerConnection.currentRemoteDescription;
    };

    async setRemoteAnswer(connectionId: string, answer: RTCSessionDescriptionInit): Promise<void> {
        const conn = this.connections[connectionId];
        if (conn && conn.peerConnection &&
            conn.peerConnection.signalingState === RTCPeerConnectionSignalingState.HAVE_LOCAL_OFFER) {
            await conn.peerConnection.setRemoteDescription(answer);
        }
    };

    async addRemoteIceCandidate(connectionId: string, candidate: RTCIceCandidateInit): Promise<void> {
        const conn = this.connections[connectionId];
        if (conn && conn.peerConnection) {
            await conn.peerConnection.addIceCandidate(candidate);
        }
    };

    getConnections() { return this.connections };
}

export {
    type WebRTCConnection,
    WebRTCConnectionProvider
}