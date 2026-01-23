import { getDatabase, ref, push, set, get, update, onValue, off } from "firebase/database";
import app from "@/firebase";
import type { DatabaseService, Room } from "./DatabaseService";

class FirebaseDatabaseService implements DatabaseService {
    private db = getDatabase(app);

    async createRoom(): Promise<Room> {
        const roomsRef = ref(this.db, 'rooms');
        const newRoomRef = push(roomsRef);

        const room: Room = {
            id: newRoomRef.key!,
            createdAt: Date.now(),
            participants: []
        };

        await set(newRoomRef, room);
        return room;
    }

    async getRoomById(roomId: string): Promise<Room> {
        const roomRef = ref(this.db, `rooms/${roomId}`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
            throw new Error('Room not found');
        }

        return snapshot.val() as Room;
    }

    // TODO -- maybe use later for a "currently active rooms" feature
    // async getRooms(): Promise<Room[]> {
    //     const roomsRef = ref(this.db, 'rooms');
    //     const snapshot = await get(roomsRef);

    //     if (!snapshot.exists()) {
    //         return [];
    //     }

    //     const roomsData = snapshot.val();
    //     return Object.values(roomsData) as Room[];
    // }

    async updateRoomOffer(roomId: string, offer: RTCSessionDescriptionInit): Promise<void> {
        const roomRef = ref(this.db, `rooms/${roomId}`);
        await update(roomRef, { offer });
    }

    async updateRoomAnswer(roomId: string, answer: RTCSessionDescriptionInit): Promise<void> {
        const roomRef = ref(this.db, `rooms/${roomId}`);
        await update(roomRef, { answer });
    }

    async addIceCandidate(roomId: string, candidate: RTCIceCandidateInit, isOffer: boolean): Promise<void> {
        const roomRef = ref(this.db, `rooms/${roomId}`);
        const snapshot = await get(roomRef);
        const room = snapshot.val() as Room;
        if (isOffer) {
            room.offerIceCandidates = room.offerIceCandidates || [];
            room.offerIceCandidates.push(candidate);
            await update(roomRef, { offerIceCandidates: room.offerIceCandidates });
        } else {
            room.answerIceCandidates = room.answerIceCandidates || [];
            room.answerIceCandidates.push(candidate);
            await update(roomRef, { answerIceCandidates: room.answerIceCandidates });
        }
    }


    listenForRoomUpdates(roomId: string, callback: (room: Room) => void): () => void {
        const roomRef = ref(this.db, `rooms/${roomId}`);

        const listener = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const room = snapshot.val() as Room;
                callback(room);
            }
        });

        return () => off(roomRef, 'value', listener);
    }
}

export const databaseService: DatabaseService = new FirebaseDatabaseService();
