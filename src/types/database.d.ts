export { }; // needed to make this a module

declare global {
    // A Room object represents a [synk] session where at least one participant is present.
    interface Room {
        // maps participant IDs to Participant objects
        participants?: {
            [key: string]: Participants;
        };
        // maps connection IDs to Connection obejcts.
        connections?: {
            [key: string]: Connection;
        };
    }

    // A Connection encapsulates information about a WebRTC connection of two peers.
    interface Connection {
        offeringPeerId: string;
        answeringPeerId: string;
        offer: RTCSessionDescriptionInit;
        offerIceCandidates: RTCIceCandidateInit[];
        answer: RTCSessionDescriptionInit;
        answerIceCandidates: RTCIceCandidateInit[];
    }

    interface Participant {
      avatar: string;
      displayName: string;
      peerId: string; // PeerJS peer ID — used by PeerJSRoomService for peer discovery
    }
}

/*

Database structure (PeerJSRoomService):

/rooms/{roomId}/participants/{participantId}: {
    avatar: string,
    displayName: string,
    peerId: string      ← PeerJS peer ID (UUID assigned by PeerJS Cloud)
}
/turnUsername: string   ← TURN credentials (fetched by PeerJSConnectionProvider)
/turnCredential: string

WebRTC signaling (SDP offers/answers, ICE candidates) is handled by PeerJS Cloud.
Firebase is used only for:
  1. Room registry — which rooms exist and who is in them (with their peer IDs)
  2. TURN credentials storage
  3. Automatic participant cleanup via onDisconnect()

N-peer group call topology:
  - Each joiner reads all current participants from Firebase, gets their peer IDs,
    and initiates PeerJS connections to each.
  - All existing peers (creator + earlier joiners) accept incoming connections via
    peer.on('connection') and peer.on('call').
  - No signaling data is stored in Firebase — PeerJS Cloud handles it all.

*/
