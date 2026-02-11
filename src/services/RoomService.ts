import { FirebaseRoomService } from "./FirebaseRoomService";

/**
 * An interface for interacting with a room storage backend (e.g., Firebase).
 */
export interface RoomService {
    createRoom(participant: Participant, onConnected: () => void, onDataChannelReady: (channel: RTCDataChannel) => void): Promise<string>; // returns the room ID
    joinRoom(roomId: string, participant: Participant, onConnected: () => void, onDataChannelReady: (channel: RTCDataChannel) => void): Promise<void>;
}

export const roomService: RoomService = new FirebaseRoomService();
