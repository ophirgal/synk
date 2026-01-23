export interface Room {
    id: string;
    createdAt: number;
    createdBy?: string;
    participants?: string[];
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    offerIceCandidates?: RTCIceCandidateInit[];
    answerIceCandidates?: RTCIceCandidateInit[];
}

export interface DatabaseService {
    createRoom(): Promise<Room>;
    getRoomById(roomId: string): Promise<Room>;
    // getRooms(): Promise<Room[]>; // TODO -- remove if not needed
    updateRoomOffer(roomId: string, offer: RTCSessionDescriptionInit): Promise<void>;
    updateRoomAnswer(roomId: string, answer: RTCSessionDescriptionInit): Promise<void>;
    addIceCandidate(roomId: string, candidate: RTCIceCandidateInit, isOffer: boolean): Promise<void>;
    listenForRoomUpdates(roomId: string, callback: (room: Room) => void): () => void;
}
