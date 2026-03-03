export type PeerConnection = {
    remoteStream?: MediaStream;
    state: string;
};

export interface IConnectionProvider {
    // React useSyncExternalStore contract
    subscribe(listener: () => void): () => void;
    getSnapshot(): Record<string, PeerConnection>;

    // Initialise: creates local stream + PeerJS Peer instance.
    // Must be awaited before createRoom / joinRoom.
    // Returns own PeerJS peer ID.
    init(cameraOn?: boolean, microphoneOn?: boolean): Promise<string>;

    // Ensure local media stream is acquired (called internally by init,
    // also kept on the interface for direct use if needed).
    ensureLocalStream(cameraOn?: boolean, microphoneOn?: boolean): Promise<void>;

    // Local media controls
    toggleLocalCamera(cameraOn?: boolean): Promise<void> | void;
    toggleLocalMic(microphoneOn?: boolean): Promise<void> | void;

    // Remote media display
    toggleRemoteVideoAndAudioSources(
        connectionId: string,
        isVideoSrc?: boolean,
        isMicSrc?: boolean
    ): void;

    // Returns current connection snapshot (same as getSnapshot but typed explicitly)
    getConnections(): Record<string, PeerConnection>;
}
