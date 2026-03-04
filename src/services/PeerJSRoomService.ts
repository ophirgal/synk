import { ref, push, set, get, onDisconnect } from "firebase/database";
import type { Database } from "firebase/database";
import type { DataConnection, MediaConnection } from "peerjs";

import type { RoomService } from "./RoomService";
import type { PeerJSConnectionProvider } from "@/lib/peerjs";

/**
 * PeerJS-based implementation of RoomService.
 *
 * Signaling is handled by PeerJS Cloud (api.peerjs.com).
 * Firebase is used only as a room registry:
 *   - Store participant presence + their PeerJS peer IDs
 *   - Fetch existing peer IDs when joining
 *   - Clean up on disconnect via onDisconnect()
 *
 * N-peer mesh topology:
 *   - Each joiner reads existing participants → initiates PeerJS connections to all
 *   - All existing peers accept inbound connections via peer.on('connection'/'call')
 *   - Subsequent joiners connect to everyone already present; no Firebase listeners
 *     are needed for connection initiation (joiners always drive their own outgoing connections)
 */
export class PeerJSRoomService implements RoomService {
    private readonly provider: PeerJSConnectionProvider;
    private readonly db: Database;
    constructor(
        provider: PeerJSConnectionProvider,
        db: Database
    ) {
        this.provider = provider;
        this.db = db;
    }

    async createRoom(
        participant: Participant,
        onConnected: () => void,
        onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void
    ): Promise<string> {
        // Create the room and register self as first participant
        const newRoomRef = push(ref(this.db, "rooms"));
        const roomId = newRoomRef.key!;

        await this.registerSelf(roomId, participant);

        // Accept all inbound connections — joiners will initiate to us
        this.listenForIncomingConnections(onConnected, onDataChannelReady);

        return roomId;
    }

    async joinRoom(
        roomId: string,
        participant: Participant,
        onConnected: () => void,
        onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void
    ): Promise<void> {
        const ownPeerId = this.provider.getPeer().id;

        // Fetch current participants
        const snap = await get(ref(this.db, `rooms/${roomId}/participants`));
        if (!snap.exists()) {
            throw new Error(`Room "${roomId}" does not exist.`);
        }

        const existing = snap.val() as Record<string, Participant>;

        await this.registerSelf(roomId, participant);

        // Initiate PeerJS connections to every participant already in the room
        for (const entry of Object.values(existing)) {
            if (!entry?.peerId || entry.peerId === ownPeerId) continue;
            this.provider.connectToPeer(entry.peerId, onDataChannelReady, onConnected);
        }

        // Accept inbound connections from participants who join after us
        this.listenForIncomingConnections(onConnected, onDataChannelReady);
    }

    private async registerSelf(roomId: string, participant: Participant): Promise<void> {
        const ownPeerId = this.provider.getPeer().id;
        const selfRef = push(ref(this.db, `rooms/${roomId}/participants`));
        await set(selfRef, {
            avatar: participant.avatar,
            displayName: participant.displayName,
            peerId: ownPeerId,
        } satisfies Participant);
        onDisconnect(selfRef).remove();
    }

    /**
     * Registers peer.on('connection') and peer.on('call') handlers.
     * These fire for every inbound connection from any peer in the mesh,
     * both for the creator waiting on joiners and for joiners waiting on
     * subsequent joiners.
     *
     * Note: PeerJS fires these events per-connection, so calling this once
     * is sufficient — it handles all future inbound connections.
     */
    private listenForIncomingConnections(
        onConnected: () => void,
        onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void
    ): void {
        const peer = this.provider.getPeer();

        peer.on("connection", (dataConn: DataConnection) => {
            this.provider.acceptDataConnection(
                dataConn.peer,
                dataConn,
                onDataChannelReady,
                onConnected
            );
            this.provider.watchPeerConnection(dataConn.peerConnection, dataConn.peer);
        });

        peer.on("call", (mediaConn: MediaConnection) => {
            this.provider.acceptMediaConnection(mediaConn.peer, mediaConn);
            this.provider.watchPeerConnection(mediaConn.peerConnection, mediaConn.peer);
        });
    }
}
