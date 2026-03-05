import app from "@/firebase";
import { getDatabase, ref, get } from "firebase/database";

async function buildRTCConfiguration(): Promise<RTCConfiguration> {
    return {
        iceServers: [
            {
                urls: [
                    "stun:stun.relay.metered.ca:80",
                    'stun:stun1.1.google.com:19302',
                    'stun:stun2.1.google.com:19302',
                    'stun:stun3.1.google.com:19302',
                    'stun:stun4.1.google.com:19302',
                    'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    'stun:stun3.l.google.com:19302',
                    'stun:stun4.l.google.com:19302',
                ]
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
                username: (await get(ref(getDatabase(app), "turnUsername"))).val() as string,
                credential: (await get(ref(getDatabase(app), "turnCredential"))).val() as string,
            }
        ],
        iceTransportPolicy: "all",
    };
}

const RTCPeerConnectionState = {
    CLOSED: "closed",
    CONNECTED: "connected",
    CONNECTING: "connecting",
    DISCONNECTED: "disconnected",
    FAILED: "failed",
    NEW: "new",
} as const;

const ScratchTab = {
    NOTES: 'notes',
    WHITEBOARD: 'whiteboard',
} as const;

type ScratchTabType = typeof ScratchTab[keyof typeof ScratchTab];

const RTCPeerConnectionSignalingState = {
    CLOSED: "closed",
    HAVE_LOCAL_OFFER: "have-local-offer",
    HAVE_LOCAL_PRANSWER: "have-local-pranswer",
    HAVE_REMOTE_OFFER: "have-remote-offer",
    HAVE_REMOTE_PRANSWER: "have-remote-pranswer",
    STABLE: "stable",
} as const;

export {
    buildRTCConfiguration,
    RTCPeerConnectionState,
    RTCPeerConnectionSignalingState,
    ScratchTab,
    type ScratchTabType
}