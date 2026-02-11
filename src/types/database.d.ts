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

    // A Participant object contains information about a participant.
    interface Participant {
        avatar: string;
        displayName: string;
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
}

/*

A user either creates a room (no room id in URL path) or joins an existing room (id in URL). *** **The database design is based on the following flow: *****
*** The database design is based on the following flow: ***
1. User A creates a room and waits for connection offers.
    1. A room is created in the database with only User A as the participant (no connection objects).
2. Any subsequent user (User B, User C, etc.) — adds a new connection object with an SDP offer inside **for each** existing participant.
3. Existing participants are notified and they add a separate SDP answer for their new connection.
4. WebRTC connections are all established for that new (subsequent) user.
- All participants register an onDisconnect handler to remove their participant entry and any associated connection entries from the DB (for cleanup purposes).
- This design achieves 4 desired outcomes (in order of decreasing importance):
    1. As long as there’s a user in the room at any single moment, it doesn’t matter who, when, or how many times someone leaves or enters the room — since any “joiner” simply creates a connection+offer for any existing user.
    2. Room is auto-deleted by firebase when all participants leave (room object empty).
    3. The existence of the “participants” field allows us to decouple the presence of a user from the connection with another user (can indicate someone is in the room even if  they failed to connect).
    4. The separation of “participant” objects from “connection” objects (connection objects are not contained in participant obejcts) prevents data duplication where users maintain duplicate connection objects.

*/