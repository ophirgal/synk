import app from "@/firebase";
import { getDatabase, ref, get } from "firebase/database";
import type { PeerOptions } from "peerjs";

/**
 * Fetches TURN credentials from Firebase RTDB and returns a fully-populated
 * PeerOptions object for the Peer constructor.
 *
 * Omitting host/port/path causes PeerJS to default to the PeerJS Cloud server
 * (api.peerjs.com), which handles WebRTC signaling (SDP, ICE).
 * Firebase is used only to fetch credentials and manage room participants.
 */
export async function buildPeerOptions(): Promise<PeerOptions> {
    const db = getDatabase(app);
    const [usernameSnap, credentialSnap] = await Promise.all([
        get(ref(db, "turnUsername")),
        get(ref(db, "turnCredential")),
    ]);
    const username = usernameSnap.val() as string;
    const credential = credentialSnap.val() as string;

    return {
        config: {
            iceServers: [
                {
                    urls: [
                        "stun:stun.relay.metered.ca:80",
                        "stun:stun1.1.google.com:19302",
                        "stun:stun2.1.google.com:19302",
                        "stun:stun3.1.google.com:19302",
                        "stun:stun4.1.google.com:19302",
                        "stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                        "stun:stun3.l.google.com:19302",
                        "stun:stun4.l.google.com:19302",
                    ],
                },
                {
                    urls: [
                        // TURN over TLS (port 443, TCP) — penetrates strict firewalls (looks like HTTPS)
                        "turns:relay1.expressturn.com:443?transport=tcp",
                        "turns:relay2.expressturn.com:443?transport=tcp",
                        "turns:relay3.expressturn.com:443?transport=tcp",
                        "turns:relay4.expressturn.com:443?transport=tcp",
                        "turns:relay5.expressturn.com:443?transport=tcp",
                        "turns:relay6.expressturn.com:443?transport=tcp",
                        "turns:relay7.expressturn.com:443?transport=tcp",
                        "turns:relay8.expressturn.com:443?transport=tcp",
                        "turns:relay9.expressturn.com:443?transport=tcp",
                        "turns:relay10.expressturn.com:443?transport=tcp",
                        "turns:relay11.expressturn.com:443?transport=tcp",
                        "turns:relay12.expressturn.com:443?transport=tcp",
                        "turns:relay13.expressturn.com:443?transport=tcp",
                        "turns:relay14.expressturn.com:443?transport=tcp",
                        "turns:relay15.expressturn.com:443?transport=tcp",
                        "turns:relay16.expressturn.com:443?transport=tcp",
                        "turns:relay17.expressturn.com:443?transport=tcp",
                        "turns:relay18.expressturn.com:443?transport=tcp",
                        "turns:relay19.expressturn.com:443?transport=tcp",
                        "turns:global.expressturn.com:443?transport=tcp",
                        // TURN over plain TCP (port 443) — fallback for non-TLS TCP on port 443
                        "turn:relay1.expressturn.com:443?transport=tcp",
                        "turn:global.expressturn.com:443?transport=tcp",
                        // TURN over UDP (port 3478) — fastest, works on open/home networks
                        "turn:relay1.expressturn.com:3478",
                        "turn:relay2.expressturn.com:3478",
                        "turn:relay3.expressturn.com:3478",
                        "turn:relay4.expressturn.com:3478",
                        "turn:relay5.expressturn.com:3478",
                        "turn:relay6.expressturn.com:3478",
                        "turn:relay7.expressturn.com:3478",
                        "turn:relay8.expressturn.com:3478",
                        "turn:relay9.expressturn.com:3478",
                        "turn:relay10.expressturn.com:3478",
                        "turn:relay11.expressturn.com:3478",
                        "turn:relay12.expressturn.com:3478",
                        "turn:relay13.expressturn.com:3478",
                        "turn:relay14.expressturn.com:3478",
                        "turn:relay15.expressturn.com:3478",
                        "turn:relay16.expressturn.com:3478",
                        "turn:relay17.expressturn.com:3478",
                        "turn:relay18.expressturn.com:3478",
                        "turn:relay19.expressturn.com:3478",
                        "turn:global.expressturn.com:3478",
                    ],
                    username,
                    credential,
                },
            ],
            // Keep iceTransportPolicy as "all" (not "relay") to allow direct
            // peer-to-peer connections when TURN is not needed.
            // Set to "relay" if you want to force TURN for testing purposes.
            iceTransportPolicy: "all",
        },
        debug: import.meta.env.DEV ? 2 : 0,
    };
}
