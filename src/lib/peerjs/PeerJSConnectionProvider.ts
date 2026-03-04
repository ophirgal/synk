import { Peer } from "peerjs";
import type { DataConnection, MediaConnection } from "peerjs";

import { buildPeerOptions } from "./constants";
import type { IConnectionProvider, PeerConnection } from "./IConnectionProvider";
import { LOCAL_VIDEO_ELEMENT_ID } from "@/constants/constants";
import { getRemoteVideoElementId, getRemoteAudioElementId } from "@/lib/utils";

type PeerEntry = {
    media: MediaConnection | null;
    remoteStream: MediaStream;
    state: string;
};

/**
 * Manages PeerJS peer connections, local/remote media streams, and connection state.
 * Replaces WebRTCConnectionProvider. Uses the React useSyncExternalStore pattern
 * for reactive state updates.
 *
 * Lifecycle:
 *   1. Construct: new PeerJSConnectionProvider()
 *   2. init(cameraOn, micOn): acquires local stream + creates Peer → returns own peer ID
 *   3. PeerJSRoomService calls connectToPeer / acceptDataConnection / acceptMediaConnection
 */
export class PeerJSConnectionProvider implements IConnectionProvider {
    private peer: Peer | null = null;
    private localStream: MediaStream | null = null;
    private peers = new Map<string, PeerEntry>();
    private listeners = new Set<() => void>();
    // snapshot is a new object reference on every mutation (required by useSyncExternalStore)
    private snapshot: Record<string, PeerConnection> = {};

    // ── useSyncExternalStore contract ─────────────────────────────────────

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    getSnapshot = (): Record<string, PeerConnection> => this.snapshot;

    private emit(): void {
        const out: Record<string, PeerConnection> = {};
        this.peers.forEach((entry, peerId) => {
            out[peerId] = { remoteStream: entry.remoteStream, state: entry.state };
        });
        this.snapshot = out;
        this.listeners.forEach((l) => l());
    }

    // ── Initialisation ────────────────────────────────────────────────────

    /**
     * Acquires local stream then creates the PeerJS Peer instance.
     * Must be awaited before calling createRoom / joinRoom on PeerJSRoomService.
     * Returns own PeerJS peer ID (a UUID assigned by PeerJS Cloud).
     */
    async init(cameraOn = false, microphoneOn = false): Promise<string> {
        await this.ensureLocalStream(cameraOn, microphoneOn);
        const options = await buildPeerOptions();
        return new Promise<string>((resolve, reject) => {
            this.peer = new Peer(options);
            this.peer.on("open", (id) => resolve(id));
            this.peer.on("error", (err) => {
                console.error("[PeerJSConnectionProvider] Peer error:", err);
                reject(err);
            });
        });
    }

    /** Returns the Peer instance; throws if init() has not been called. */
    getPeer(): Peer {
        if (!this.peer) throw new Error("PeerJSConnectionProvider: call init() first");
        return this.peer;
    }

    // ── Local stream management ───────────────────────────────────────────

    async ensureLocalStream(cameraOn = false, microphoneOn = false): Promise<void> {
        if (!this.localStream) {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
        }
        this.localStream.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
        this.localStream.getAudioTracks().forEach((t) => (t.enabled = microphoneOn));

        const localVideo = document.getElementById(LOCAL_VIDEO_ELEMENT_ID) as HTMLVideoElement | null;
        if (localVideo) {
            localVideo.srcObject = cameraOn ? this.localStream : null;
        }
    }

    async toggleLocalCamera(cameraOn = true): Promise<void> {
        if (!this.localStream) {
            await this.ensureLocalStream(cameraOn, false);
            return;
        }
        this.localStream.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
        const localVideo = document.getElementById(LOCAL_VIDEO_ELEMENT_ID) as HTMLVideoElement | null;
        if (localVideo) {
            localVideo.srcObject = cameraOn ? this.localStream : null;
        }
    }

    toggleLocalMic(microphoneOn = true): void {
        this.localStream?.getAudioTracks().forEach((t) => (t.enabled = microphoneOn));
    }

    // ── Remote stream display ─────────────────────────────────────────────

    toggleRemoteVideoAndAudioSources(
        connectionId: string,
        isVideoSrc = true,
        isMicSrc = true
    ): void {
        const entry = this.peers.get(connectionId);
        if (!entry?.remoteStream) return;
        const { remoteStream } = entry;

        const videoEl = document.getElementById(
            getRemoteVideoElementId(connectionId)
        ) as HTMLVideoElement | null;

        if (videoEl) {
            if (isVideoSrc && videoEl.srcObject !== remoteStream) {
                videoEl.srcObject = remoteStream;
            } else if (!isVideoSrc && videoEl.srcObject) {
                videoEl.srcObject = null;
            }
        }

        // Hidden audio element for when the peer has audio but no video
        const audioEl = this.getOrCreateAudioElement(connectionId);
        // Only pipe to audio element when video element is not showing the stream
        if (!isVideoSrc && isMicSrc) {
            audioEl.srcObject = remoteStream;
        } else if (!isVideoSrc && audioEl.srcObject) {
            audioEl.srcObject = null;
        }
    }

    private getOrCreateAudioElement(connectionId: string): HTMLAudioElement {
        const id = getRemoteAudioElementId(connectionId);
        let el = document.getElementById(id) as HTMLAudioElement | null;
        if (!el) {
            el = document.createElement("audio");
            el.id = id;
            el.style.display = "none";
            el.autoplay = true;
            document.body.appendChild(el);
        }
        return el;
    }

    // ── Connection registry ───────────────────────────────────────────────

    getConnections(): Record<string, PeerConnection> {
        return this.snapshot;
    }

    /**
     * Called by PeerJSRoomService when a media connection is established.
     * Creates the peer entry and wires media stream events.
     */
    registerPeer(remotePeerId: string, media: MediaConnection | null): void {
        if (this.peers.has(remotePeerId)) return; // already registered
        const entry: PeerEntry = {
            media,
            remoteStream: new MediaStream(),
            state: "connecting",
        };
        this.peers.set(remotePeerId, entry);
        this.emit();

        if (media) {
            this.wireMediaConnection(remotePeerId, media, entry);
        }
    }

    private wireMediaConnection(
        remotePeerId: string,
        media: MediaConnection,
        entry: PeerEntry
    ): void {
        media.on("stream", (remoteStream: MediaStream) => {
            entry.remoteStream = remoteStream;
            this.emit();
        });
        media.on("close", () => this.removePeer(remotePeerId));
        media.on("error", (err) => {
            console.error("[PeerJSConnectionProvider] MediaConnection error:", err);
            this.removePeer(remotePeerId);
        });
    }

    markConnected(remotePeerId: string): void {
        const entry = this.peers.get(remotePeerId);
        if (entry && entry.state !== "connected") {
            entry.state = "connected";
            this.emit();
        }
    }

    removePeer(remotePeerId: string): void {
        if (!this.peers.has(remotePeerId)) return;
        this.peers.delete(remotePeerId);
        // Clean up audio element
        const audioEl = document.getElementById(getRemoteAudioElementId(remotePeerId));
        audioEl?.remove();
        this.emit();
    }

    // ── Outbound connection initiation ────────────────────────────────────

    /**
     * Initiates both a data connection and a media call to remotePeerId.
     * Called by PeerJSRoomService for each existing participant when joining.
     */
    connectToPeer(
        remotePeerId: string,
        onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void,
        onConnected: () => void
    ): void {
        const peer = this.getPeer();

        // serialization: "raw" → PeerJS passes send()/onmessage through to the raw
        // RTCDataChannel without any transformation, keeping WebRTCDataProvider intact.
        const dataConn = peer.connect(remotePeerId, {
            reliable: true,
            serialization: "raw",
        });

        const mediaConn = this.localStream
            ? peer.call(remotePeerId, this.localStream)
            : null;

        this.watchPeerConnection(dataConn.peerConnection, dataConn.peer);

        this.registerPeer(remotePeerId, mediaConn);
        this.wireDataConnection(remotePeerId, dataConn, onDataChannelReady, onConnected);
    }

    /**
     * Listens to connection state changes on the given PeerConnection and removes the peer with the given id when the connection is closed, failed, or disconnected.
     * @param {RTCPeerConnection} pc - The PeerConnection to listen to.
     * @param {string} peerId - The id of the peer to remove when the connection is closed.
     */
    watchPeerConnection(pc: RTCPeerConnection, peerId: string): void {
        pc.onconnectionstatechange = () => {
            if (
                pc.connectionState === 'disconnected' ||
                pc.connectionState === 'failed' ||
                pc.connectionState === 'closed'
            ) {
                this.removePeer(peerId);
            }
        };
    }

    // ── Inbound connection acceptance ─────────────────────────────────────

    /**
     * Accepts an inbound DataConnection from peer.on('connection').
     * Called by PeerJSRoomService's incoming connection handler.
     */
    acceptDataConnection(
        remotePeerId: string,
        dataConn: DataConnection,
        onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void,
        onConnected: () => void
    ): void {
        if (!this.peers.has(remotePeerId)) {
            this.registerPeer(remotePeerId, null);
        }
        this.wireDataConnection(remotePeerId, dataConn, onDataChannelReady, onConnected);
    }

    /**
     * Accepts and answers an inbound MediaConnection from peer.on('call').
     * Called by PeerJSRoomService's incoming call handler.
     */
    acceptMediaConnection(remotePeerId: string, mediaConn: MediaConnection): void {
        mediaConn.answer(this.localStream ?? undefined);

        const entry = this.peers.get(remotePeerId);
        if (entry) {
            // Data connection arrived first; attach media to existing entry
            entry.media = mediaConn;
            this.wireMediaConnection(remotePeerId, mediaConn, entry);
        } else {
            this.registerPeer(remotePeerId, mediaConn);
        }
    }

    // ── Private: wire data connection events ──────────────────────────────

    private wireDataConnection(
        remotePeerId: string,
        dataConn: DataConnection,
        onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void,
        onConnected: () => void
    ): void {
        dataConn.on("open", () => {
            // dataConn.dataChannel is the underlying RTCDataChannel (public API in PeerJS v1.5.x).
            // It is guaranteed to be non-null after the 'open' event.
            const rawChannel = dataConn.dataChannel;
            if (!rawChannel) {
                console.error(
                    "[PeerJSConnectionProvider] dataChannel is null after open — " +
                    "ensure serialization: 'raw' is set"
                );
                return;
            }
            this.markConnected(remotePeerId);
            onConnected();
            onDataChannelReady(remotePeerId, rawChannel);
        });

        dataConn.on("close", () => this.removePeer(remotePeerId));
        dataConn.on("error", (err) => {
            console.error("[PeerJSConnectionProvider] DataConnection error:", err);
            this.removePeer(remotePeerId);
        });
    }

    // ── Cleanup ───────────────────────────────────────────────────────────

    destroy(): void {
        this.peer?.destroy();
        this.peer = null;
        this.peers.clear();
        this.localStream?.getTracks().forEach((t) => t.stop());
        this.localStream = null;
        this.snapshot = {};
        this.listeners.forEach((l) => l());
    }
}
