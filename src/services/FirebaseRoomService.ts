import { getDatabase, ref, push, set, get, update, onValue, off, onDisconnect } from "firebase/database";
import app from "@/firebase";
import { type RoomService } from "./RoomService";
import type { WebRTCConnectionProvider } from "@/lib/webrtc";

export class FirebaseRoomService implements RoomService {
    private db = getDatabase(app);
    private webRTCConnectionProvider: WebRTCConnectionProvider | null = null;
    private processedAnswers = new Set<string>();
    private processedCandidateIndices = new Map<string, number>();

    constructor(provider: WebRTCConnectionProvider) {
        this.webRTCConnectionProvider = provider;
    }

    async createRoom(participant: Participant, onConnected: () => void, onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void): Promise<string> {
        // Create Room in Database
        const newRoomRef = push(ref(this.db, 'rooms'));
        const newRoomId = newRoomRef.key;
        // Create 1st participant in room
        const creatorParticipantRef = push(ref(this.db, `rooms/${newRoomId}/participants`));
        const creatorParticipantId = creatorParticipantRef.key;
        await set(creatorParticipantRef, participant);
        // ensure participant is removed from database when user disconnects 
        onDisconnect(creatorParticipantRef).remove();

        // Listen for Room Updates (ICE candidates from joining peers).
        // We listen for offers and then add answers for them.
        this.listenForRoomUpdates(newRoomId, async (room: Room) => {
            // console.log('[DEBUG]: creator received room updates:', room);
            // console.log("[DEBUG]: PeerConnection:", getPeerConnection());

            // for each connection -- if offer for me and no answer -- add answer.
            for (const connectionId in room.connections) {
                const connection = room.connections[connectionId];
                if (connection.answeringPeerId === creatorParticipantId && !connection.answer) {
                    // Create SDP answer, Set up ICE candidate handling, and Set Remote Description
                    await this.answerOfferedConnection(newRoomId, connectionId, connection, onConnected, onDataChannelReady);
                }
            }
        });

        return newRoomId;
    }

    private async answerOfferedConnection(newRoomId: string, connectionId: string, connection: Connection, onConnected: () => void, onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void) {
        const connectionRef = ref(this.db, `rooms/${newRoomId}/connections/${connectionId}`);
        // ensure connection cleanup when user disconnects
        onDisconnect(connectionRef).remove();
        // Create SDP answer and set remote description with offer from offering peer
        const answer = await this.webRTCConnectionProvider!.createAnswerForConnection(
            connectionId,
            connection.offer,
            async (answerIceCandidate: RTCIceCandidateInit) => {
                // Save Answer's ICE candidates to database as they arrive
                const connection = (await get(connectionRef)).val() as Connection;
                update(connectionRef, { answerIceCandidates: [...(connection.answerIceCandidates || []), answerIceCandidate] });
            },
            // handle successful connection
            onConnected,
            // handle data channel ready
            onDataChannelReady
        );

        // Save answer to connection in database
        update(connectionRef, { answer });

        // Process all NEW ICE candidates from the offering peer
        if (connection.offerIceCandidates?.length > 0) {
            const lastProcessedIndex = this.processedCandidateIndices.get(`offer:${connectionId}`) ?? -1;
            const newCandidates = connection.offerIceCandidates.slice(lastProcessedIndex + 1);
            for (const candidate of newCandidates) {
                await this.webRTCConnectionProvider!.addRemoteIceCandidate(connectionId, candidate);
            }
            this.processedCandidateIndices.set(`offer:${connectionId}`, connection.offerIceCandidates.length - 1);
        }
    }

    async joinRoom(roomId: string, participant: Participant, onConnected: () => void, onDataChannelReady: (connectionId: string, channel: RTCDataChannel) => void): Promise<void> {
        // Fetch room
        const room = await this.getRoomById(roomId);
        // block 3+ participants feature for now.
        // if (room.participants && Object.keys(room.participants).length === 2) {
        //     throw new Error(`Room "${roomId}" is full`);
        // }
        // Add participant to room
        const joinerParticipantRef = push(ref(this.db, `rooms/${roomId}/participants`));
        const joinerParticipantId = joinerParticipantRef.key;
        set(joinerParticipantRef, participant);
        // ensure participant is removed when user disconnects
        onDisconnect(joinerParticipantRef).remove();

        // Create connections only once (when joining).
        // for each participant: create connection with SDP offer and set up ICE candidate handling
        for (const participantId in room.participants) {
            const connectionRef = push(ref(this.db, `rooms/${roomId}/connections`));
            const connectionId = connectionRef.key!;
            const offer = await this.webRTCConnectionProvider!.createOfferForConnection(
                connectionId,
                async (offerIceCandidate: RTCIceCandidateInit) => {
                    const connection = (await get(connectionRef)).val() as Connection;
                    update(connectionRef, { offerIceCandidates: [...(connection.offerIceCandidates || []), offerIceCandidate] });
                },
                // handle successful connection
                onConnected,
                // handle data channel ready
                onDataChannelReady
            );
            // create connection with offer and establish who is offering and who is answering
            set(connectionRef, {
                offeringPeerId: joinerParticipantId,
                answeringPeerId: participantId,
                offer,
                offerIceCandidates: [],
                answerIceCandidates: [],
            });
        }

        // Listen for Room Updates (answer & ICE candidates from peer)
        this.listenForRoomUpdates(roomId, async (room: Room) => {
            // console.log('[DEBUG]: joiner received room updates:', room);
            // console.log("[DEBUG]: PeerConnection:", getPeerConnection());
            try {
                for (const connectionId in room.connections) {
                    const connection = room.connections[connectionId];
                    if (connection.offeringPeerId === joinerParticipantId && connection.answer) {
                        // Set Remote Description if needed
                        await this.processAnsweredConnection(roomId, connectionId, connection);
                    } else if (connection.answeringPeerId === joinerParticipantId && !connection.answer) {
                        await this.answerOfferedConnection(roomId, connectionId, connection, onConnected, onDataChannelReady);
                    }
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    private async processAnsweredConnection(roomId: string, connectionId: string, connection: Connection) {
        // ensure connection cleanup when user disconnects (only once)
        const isConnectionProcessed = this.processedAnswers.has(connectionId)
        if (!isConnectionProcessed) {
            const connectionRef = ref(this.db, `rooms/${roomId}/connections/${connectionId}`);
            onDisconnect(connectionRef).remove();
        }

        // Set Remote Description if needed (only once)
        if (!isConnectionProcessed && !this.webRTCConnectionProvider!.isRemoteDescriptionSet(connectionId)) {
            await this.webRTCConnectionProvider!.setRemoteAnswer(connectionId, connection.answer);
            this.processedAnswers.add(connectionId);
        }

        // Process all NEW ICE candidates from the peer
        if (connection.answerIceCandidates?.length > 0) {
            const lastProcessedIndex = this.processedCandidateIndices.get(`answer:${connectionId}`) ?? -1;
            const newCandidates = connection.answerIceCandidates.slice(lastProcessedIndex + 1);
            for (const candidate of newCandidates) {
                await this.webRTCConnectionProvider!.addRemoteIceCandidate(connectionId, candidate);
            }
            this.processedCandidateIndices.set(`answer:${connectionId}`, connection.answerIceCandidates.length - 1);
        }
    }

    private listenForRoomUpdates(roomId: string, callback: (room: Room) => void): () => void {
        const roomRef = ref(this.db, `rooms/${roomId}`);

        const listener = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const room = snapshot.val() as Room;
                callback(room);
            }
        });

        return () => off(roomRef, 'value', listener);
    }

    private async getRoomById(roomId: string): Promise<Room> {
        const roomRef = ref(this.db, `rooms/${roomId}`);
        const snapshot = await get(roomRef);
        if (!snapshot.exists()) {
            throw new Error(`Room "${roomId}" does not exist`);
        }
        return snapshot.val() as Room;
    }
}