// import type { WebRTCConnectionProvider } from "@/lib/webrtc";
// import { FirebaseRoomService } from "./FirebaseRoomService";

import { getDatabase } from "firebase/database";
import app from "@/firebase";

import type { IConnectionProvider } from "@/lib/peerjs";
import { PeerJSConnectionProvider } from "@/lib/peerjs";
import { PeerJSRoomService } from "./PeerJSRoomService";

/**
 * An interface for interacting with a room storage backend (e.g., Firebase).
 */
export interface RoomService {
    createRoom(participant: Participant, onConnected: () => void, onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void): Promise<string>; // returns the room ID
    joinRoom(roomId: string, participant: Participant, onConnected: () => void, onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void): Promise<void>;
}

// export function createRoomService(provider: WebRTCConnectionProvider): RoomService {
//     return new FirebaseRoomService(provider);
// } 

export function createRoomService(provider: IConnectionProvider): RoomService {
    return new PeerJSRoomService(provider as PeerJSConnectionProvider, getDatabase(app));
}